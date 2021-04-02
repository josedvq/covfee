import {fetchWithTimeout } from './utils'
import { 
    DataCaptureBuffer, 
    DataSample, 
    DataRecord, 
    LogSample, 
    LogRecord,
    OutChunk
} from './dc_buffer'

/**
 * This class implements a custom circular array data buffer as main data structure via nested arrays.
 * It is meant to support efficient over-writing of data samples up to a fixed horizon, for correction of continuous data.
 * The data buffer chunks are filled with data samples in order until headptr reaches the tailptr chunk.
 * The tailptr chunk (containing the oldest data) is then moved to the outBuffer to be sent to the server, and tailptr is incremented.
 * Correction of data by decrementing headptr is supported until headptr reaches tailptr.
 */
class CircularDataCaptureBuffer extends DataCaptureBuffer {
    dataBuffer: Array<Array<DataRecord>>
    rwndStack: Array<DataRecord>
    logBuffer: Array<LogRecord>
    outBuffer: Array<OutChunk>

    // props
    chunkLength: number
    numChunks: number
    outBufferLength: number
    url: string
    onError: Function

    // state
    sampleCounter = 0 // counts the total number of data and log samples
    headptr = {// points to the head of the data buffer
        chunk: 0,
        sample: 0
    }
    tailptr = 0
    rwndptr = 0
    numChunksFilled = 0

    awaitClearPending = false
    awaitClearPromise:Promise<void> = null
    fetch_fn: Function = fetchWithTimeout

    constructor(chunkLength: number, numChunks: number, url: string, onError=()=>{}, outBufferLength = 5) {
        super()
        this.chunkLength = chunkLength
        this.numChunks = numChunks
        this.outBufferLength = outBufferLength
        this.url = url
        this.onError = onError

        // initialize data structures
        this.dataBuffer = Array < Array<DataRecord> > (numChunks)
        
        for (let i = 0; i < numChunks; i++) {
            this.dataBuffer[i] = Array < DataRecord>(chunkLength)
        }
        this.rwndStack = Array<DataRecord>(numChunks*chunkLength)
        this.logBuffer = Array<LogRecord>()
        this.outBuffer = Array<OutChunk>()
    }

    /**
     * Puts a data sample into the data buffer.
     * @param timestamp - A media timestamp (eg. video or audio time in seconds)
     * @param data - A data sample / row
     */
    data = (timestamp: number, data: DataSample) => {
        // raise exception if the write would overwrite non-submitted data
        // data writes should have been stopped by the client when onError was called
        if(this.isOutBufferFull() && this.headptr.chunk === this.tailptr) {
            throw new Error('Buffer is full. A data write would overwrite non-submitted data.')
        }

        const sample: DataRecord = [
            timestamp,
            this.sampleCounter++,
            data
        ]

        // push into data buffer
        this.dataBuffer[this.headptr.chunk][this.headptr.sample] = sample
        this.headptr.sample += 1

        // increment headptr
        if(this.headptr.sample === this.chunkLength) {
            this.headptr.chunk = (this.headptr.chunk + 1) % this.numChunks
            this.numChunksFilled += 1
            this.headptr.sample = 0
        }

        // do not advance tail on the first chunk to let headptr take the lead
        if (this.headptr.chunk == this.tailptr && this.numChunksFilled > 0) this.advanceTail()

        const rwnd_data = this.read_rewind(timestamp)
        if (rwnd_data) return rwnd_data[2]
    } 

    _headptr_forward = () => {
        this.headptr.sample = (this.headptr.sample + 1) % this.chunkLength
        if (this.headptr.sample == 0)
            this.headptr.chunk = (this.headptr.chunk + 1) % this.numChunks
    }

    _headptr_backward = () => {
        this.headptr.sample = (this.headptr.sample === 0) ? this.chunkLength - 1 : this.headptr.sample - 1
        if (this.headptr.sample == this.chunkLength - 1)
            this.headptr.chunk = (this.headptr.chunk === 0) ? this.numChunks - 1 : this.headptr.chunk - 1
    }

    /**
     * Reads the rewind stack until it finds a sample with timestamp >= until
     * @param until
     * @returns 
     */
    read_rewind = (until: number) => {
        if(this.rwndptr === 0) return false

        if (this.rwndStack[this.rwndptr] === undefined)
            this.rwndptr -= 1

        while(this.rwndptr > 0 && until > this.rwndStack[this.rwndptr][0]) {
            this.rwndStack[this.rwndptr] = undefined
            this.rwndptr -= 1
        }

        // ptr is at the target sample
        return this.rwndStack[this.rwndptr]
    }


    can_rewind = (to: number) => {
        // can only rewind to the past
        this._headptr_backward()
        if (to > this.dataBuffer[this.headptr.chunk][this.headptr.sample][0]) return false
        // can only rewind if to > *tailptr[0].timestamp
        if (to <= this.dataBuffer[this.tailptr][0][0]) return false
        this._headptr_forward()

        return true
    }

    
    rewind = (to: number) => {
        if (!this.can_rewind(to)) 
            throw Error('Cannot rewind to timestamp to. Value is beyond buffered interval.')
        
        this._headptr_backward()
        while (this.dataBuffer[this.headptr.chunk][this.headptr.sample][0] >= to) {
            // move to the rewind buffer
            this.rwndStack[this.rwndptr] = this.dataBuffer[this.headptr.chunk][this.headptr.sample]
            this.rwndptr += 1
            this._headptr_backward()
        }
        this._headptr_forward()
        return this.rwndStack[this.rwndptr-1][2]
    }

    log = (timestamp: number, data: LogSample) => {
        // raise exception if the write would overwrite non-submitted data
        // data writes should have been stopped by the client when onError was called
        if (this.isOutBufferFull() && this.headptr === this.headptr) {
            throw new Error('Buffer is full. A data write would overwrite non-submitted data.')
        }

    }

    isOutBufferFull = () => {
        return this.outBuffer.length > this.outBufferLength
    }

    advanceTail = () => {
        
        this.outBuffer.push({
            data: this.dataBuffer[this.tailptr],
            rwnd: this.rwndStack,
            log: this.logBuffer
        })

        if (this.isOutBufferFull()) {
            this.onError('Output buffer full. Data may be lost.')
        }

        this.tailptr = (this.tailptr + 1) % this.numChunks
        this.awaitClear(8000)
    }

    /**
     * Move all the remaining data into the outBuffer
     */
    flush = () => {
        while(this.tailptr !== this.headptr.chunk) {
            this.advanceTail()
        }

        // tailptr = headptr
        if(this.headptr.sample > 0) {
            this.outBuffer.push({
                data: this.dataBuffer[this.tailptr].slice(0, this.headptr.sample),
                rwnd: this.rwndStack,
                log: this.logBuffer
            })
            this.awaitClear(8000)
        }
    }

    submitChunk = async (timeout=8000) => {
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: this.outBuffer[0] }),
            timeout: timeout
        }

        return this.fetch_fn(this.url, requestOptions).then(async (response: Response) => {
            const data = await response.json()
            // check for error response
            if (!response.ok) {
                // get error message from body or default to response status
                const error = (data && data.message) || response.status
                return Promise.reject(error)
            }
            // success, remove from the outBuffer
            this.outBuffer.shift()
        })
    }

    _awaitClear = async (timeout: number) => {
        while(this.outBuffer.length > 0) {
            await this.submitChunk(timeout)
        }
        return Promise.resolve() 
    }

    awaitClear = async (timeout: number) => {
        // avoid multiple unresolved awaitClear promises
        if (this.awaitClearPending) return this.awaitClearPromise

        this.awaitClearPending = true
        this.awaitClearPromise = this._awaitClear(timeout)
        await this.awaitClearPromise
        this.awaitClearPending = false

        return this.awaitClearPromise
    }
}

class DummyDataCaptureBuffer extends Buffer {
    awaitClear = async (timeout: number) => {
        return Promise.resolve()
    }

    data = (timestamp: number, data: DataRecord) => {
        return
    }

    log = (timestamp: number, data: LogSample) => {
        return
    }
}

export { CircularDataCaptureBuffer, DummyDataCaptureBuffer }