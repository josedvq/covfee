import { getFetchWithTimeout, dummyFetch} from './utils'
import { 
    AnnotationBuffer, 
    LogSample, 
    LogRecord,
} from './buffer'
import { fetcher } from '../utils'
import { Packer} from './packer'

type DataSample = number[]
type DataRecord = number[]
interface Chunk {
    chunk_index: number
    idxs: Uint32Array
    data: Float64Array
    logs: Array<LogRecord>
    buff: ArrayBuffer
}

/**
 * This class implements a custom circular array data buffer as main data structure via nested arrays.
 * It is meant to support efficient over-writing of data samples up to a fixed horizon, for correction of continuous data.
 * The data buffer chunks are filled with data samples in order until headptr reaches the tailptr chunk.
 * The tailptr chunk (containing the oldest data) is then moved to the outBuffer to be sent to the server, and tailptr is incremented.
 * Correction of data by decrementing headptr is supported until headptr reaches tailptr.
 * The buffer is meant to be one-use. ie. it can only be flushed once.
 */
type OnErrorCallback = (arg0: string) => void
export class BinaryDataCaptureBuffer implements AnnotationBuffer {
    chunkByteLength: number
    dataBuffer = Array<Chunk>()
    outBuffer = Array<Chunk>()

    // props
    outBufferErrorLength = 10
    chunkLength: number
    fps: number
    sampleLength: number
    recordLength: number
    url: string
    disabled: boolean
    eager: boolean
    onError: OnErrorCallback

    // state
    tailptr = 0
    logptr = 0   // points to a log within the chunk when reading
    receivedData = false
    // counts the total number of data and log samples
    // one-based bc zero is used for null.
    cntr = 1 
    chunkIndex = 0

    isDataReady = false
    isDataPromisePending = false
    loadDataPromise: Promise<void>

    awaitClearPending = false
    awaitClearPromise:Promise<unknown> = null
    fetch_fn: (arg0: any, arg1: any) => Promise<any> = getFetchWithTimeout(3000)

    constructor(disabled = false, sampleLength = 1, chunkLength = 200, 
                fps=60, url = '', onError: OnErrorCallback = () => { }, 
                eager=true, outBufferErrorLength=5) {
        this.chunkLength = chunkLength
        this.fps = fps
        this.sampleLength = sampleLength
        this.recordLength = sampleLength + 1
        this.outBufferErrorLength = outBufferErrorLength
        this.chunkByteLength = this.chunkLength * (4 + 8 * (this.recordLength))
        this.url = url
        this.disabled = disabled
        this.eager = eager
        if (disabled) this.fetch_fn = dummyFetch
        this.onError = onError
    }

    reset = () => {
        this.tailptr = 0
        this.logptr = 0
        this.receivedData = false
        this.chunkIndex = 0
    }

    _createChunkFromArrayBuffer = (arrayBuff: ArrayBuffer, logs: Array<LogRecord> = null) => {
        const chunk: Chunk = {
            chunk_index: this.chunkIndex++,
            idxs: new Uint32Array(arrayBuff, 0, this.chunkLength),
            data: new Float64Array(arrayBuff, this.chunkLength * 4, this.chunkLength * (this.recordLength)),
            logs: logs ? logs : Array<LogRecord>(),
            buff: arrayBuff
        }
        this.dataBuffer.push(chunk)
    }

    _createChunk = () => {
        const arrayBuff = new ArrayBuffer(this.chunkByteLength)
        this._createChunkFromArrayBuffer(arrayBuff)
    }

    loadChunks = (arr: ArrayBuffer) => {
        if (arr.byteLength === 0) 
            throw new Error('Provided ArrayBuffer is empty')
        
        this.reset()
        const packer = new Packer()
        const chunks = packer.unpackChunkList(arr).chunks

        for(let i = 0; i < chunks.length; i++) {
            this._createChunkFromArrayBuffer(chunks[i].data.buffer, chunks[i].logs)
        }
    }

    _load = async () => {
        const url = this.url + '/chunks'
        // return the stored promise if there is no response yet.
        if (this.loadDataPromise && this.isDataPromisePending) return this.loadDataPromise

        this.isDataPromisePending = true
        this.loadDataPromise = fetcher(url)
            .then(async (res) => {
                this.isDataReady = true
                const arr = await res.arrayBuffer()
                this.loadChunks(arr)
            }).catch(err => {
            }).finally(() => {
                this.isDataPromisePending = false
            })
        return this.loadDataPromise
    }

    createChunksUntil = (until: number) => {
        while(this.dataBuffer.length <= until) {
            this._createChunk()
        }
    }

    timestampToChunkSample = (timestamp: number) => {
        // calculate sample and chunk numbers
        const frameNum = Math.round(timestamp * this.fps)
        const chunkNum = Math.floor(frameNum / this.chunkLength)
        const sampleNum = frameNum % this.chunkLength

        return [chunkNum, sampleNum]
    }

    isOutBufferFull = () => {
        return this.outBuffer.length > this.outBufferErrorLength
    }

    /**
     * Puts a data sample into the data buffer.
     * @param timestamp - A media timestamp (eg. video or audio time in seconds)
     * @param data - A data sample / row
     */
    data = (timestamp: number, data: DataSample) => {
        if(this.disabled) return
        this.receivedData = true

        const record: DataRecord = [timestamp, ...data]

        const [chunkNum, sampleNum] = this.timestampToChunkSample(timestamp)
        this.createChunksUntil(chunkNum)

        // write into data buffer
        const ini = sampleNum * this.recordLength
        let i = 0
        for (; i < this.recordLength; i++) {
            this.dataBuffer[chunkNum].data[ini + i] = record[i]
        }
        this.dataBuffer[chunkNum].idxs[sampleNum] = this.cntr++

        // advance tail if necessary
        if(chunkNum - this.tailptr > (this.eager ? 1 : 5))
            this.advanceTail()
    } 

    read = (timestamp: number) => {
        const [chunkNum, sampleNum] = this.timestampToChunkSample(timestamp)
        if(this.dataBuffer[chunkNum] === undefined || 
            this.dataBuffer[chunkNum].idxs[sampleNum] === undefined)
            return [null, null] as [number[], LogRecord[]]

        let res, logs = []
        if (this.dataBuffer[chunkNum].idxs[sampleNum] === 0) res = null
        else {
            res = []
            const ini = sampleNum * this.recordLength
            for (let i = 0; i < this.recordLength; i++) {
                res.push(this.dataBuffer[chunkNum].data[ini+i])
            }
        }

        while (this.logptr < this.dataBuffer[chunkNum].logs.length
              && this.dataBuffer[chunkNum].logs[this.logptr][1] < timestamp) {
            logs.push(this.dataBuffer[chunkNum].logs[this.logptr])
            this.logptr += 1
        }

        return [res, logs] as [number[], LogRecord[]]
    }


    log = (timestamp: number, data: LogSample) => {
        this.receivedData = true

        const [chunkNum, _] = this.timestampToChunkSample(timestamp)
        this.createChunksUntil(chunkNum)

        const record: LogRecord = [this.cntr++, timestamp, data]
        this.dataBuffer[chunkNum].logs.push(record)
    }

    /**
     * Advances the tailptr (chunk-level pointer) by one chunk
     * Moves the just-completed chunk into the output buffer.
     * Does not output to server.
     * @returns void
     */
    advanceTail = () => {
        this.outBuffer.push(this.dataBuffer[this.tailptr])
        this.tailptr++

        this.awaitClear()
        if (this.isOutBufferFull()) {
            this.onError('Output buffer full. Data may be lost.')
        }
    }

    /**
     * Submit the next chunk it the output queue.
     * @returns promise from fetch
     */
    submitChunk = async () => {
        const chunk = this.outBuffer[0]
        const packet = new Packer().pack(chunk.buff, chunk.logs, this.chunkLength, this.recordLength)
        const requestOptions = {
            method: 'POST',
            body: packet,
        }

        const url = this.url + '/chunk?' + new URLSearchParams({
            index: chunk.chunk_index.toString(),
            length: this.chunkLength.toString()
        })

        return this.fetch_fn(url, requestOptions).then(async (response: Response) => {
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

    /**
     * Move all the remaining chunks into the outBuffer, then wait for it to clear
     * @returns promise that is resolved 
     */
    flush = async (timeout=8000) => {
        if (!this.receivedData) return Promise.resolve()
        while(this.tailptr !== this.dataBuffer.length) {
            this.advanceTail()
        }

        return this.awaitClear(timeout)
    }
    
    /**
     * Makes a race between
     * - submitting all the chunks in the output buffer
     * - The provided timeout
     * @param timeout 
     * @returns promise
     */
    awaitClear = async (timeout = 4000) => {
        // avoid multiple unresolved awaitClear promises
        if (this.awaitClearPending) return this.awaitClearPromise

        this.awaitClearPending = true
        this.awaitClearPromise = Promise.race([
            (async () => {
                while (this.outBuffer.length > 0) {
                    await this.submitChunk()
                }
            })(),
            new Promise((_, reject) => {
                setTimeout(()=>{
                    reject(new Error('The server is taking too long to respond.'))
                }, timeout)
            })
        ])
        
        this.awaitClearPromise.finally(() => {
            this.awaitClearPending = false
        })
        
        return this.awaitClearPromise
    }
}
