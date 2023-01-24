import { getFetchWithTimeout, dummyFetch} from './utils'
import { 
    AnnotationBuffer, 
    LogSample, 
    LogRecord,
} from './buffer'
import { fetcher } from '../utils'
import { Packer} from './packer'
import { log } from '../utils'
import hitSlice from 'hit/hitSlice'

type DataSample = number[]
type DataRecord = number[]
interface Chunk {
    chunk_index: number
    idxs: Uint32Array       // stores the data sample indices
    data: Float64Array      // stores the data itself (incl timestamp)
    logs: Array<LogRecord>  // array of logs associated to this chunk
    dirty: boolean          // chunk is modified and not persisted to server
    inQueue: boolean        // chunk is inQueue for submission to the server
    lastHit: number         // a timestamp for the last time the chunk was hit (written to)
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
    chunkDataByteLength: number
    chunkIdxsByteLength: number
    chunks = Array<Chunk>()
    outBuffer = Array<Chunk>()

    dataArrayBuff: ArrayBuffer
    idxsArrayBuff: ArrayBuffer
    dataArray: Float64Array
    idxsArray: Uint32Array

    // props
    length: number                  // total number of data points in the buffer (normally = # video frames)
    lengthErrorThreshold = 10
    chunkLength: number
    numChunks: number
    fps: number
    /**
     * Size of the record (excl mediatime)
     */
    recordDataSize: number
    /**
     * Size of the record (incl mediatime and timestamp)
     */
    recordSize: number
    url: string
    persistInterval: number
    lastHitThreshold: number
    disabled: boolean
    writeTimestamp: boolean
    fill: boolean
    onError: OnErrorCallback

    // state
    /**
     * index of the curr sample, for sequential reading / writing
     */
    head: number
    receivedData = false
    // counts the total number of data and log samples
    // one-based bc zero is used for null.
    cntr = 1 

    isDataPromisePending = false
    loadDataPromise: Promise<void>

    awaitClearPending = false
    awaitClearPromise:Promise<unknown> = null
    fetch_fn: (arg0: any, arg1: any) => Promise<any> = getFetchWithTimeout(3000)

    interval: any

    /**
     * @param url API endpoint for submitting chunks
     * @param disabled the buffer will behave as mock and not submit data to the server.
     * @param recordDataSize number of elements in each record (excluding auto timestamp).
     * @param writeTimestamp If true, a timestamp is added to each record. Timestamp is added by calling Date.now() when data() is called.
     * @param fill If true, the skipped frames/records are filled in by replicating a newly written record backwards until the previous record.
     * @param onError Called when the output queue is full.
     * @param chunkLength length of each data chunk in samples / frames. Data are sent to the server in packets of size chunkLength.
     * @param persistInterval Interval to check for dirty chunks and submit them to the server
     * @param lastHitThreshold Minimum time (seconds) since last hit before a dirty chunk can be enqueued.
     * @param lengthErrorThreshold Max number of permitted dirty chunks in the output queue. If the queue size goes over this value, onError is called.
     */
    constructor(url = '', disabled = false, recordDataSize = 1, writeTimestamp=true, fill=true,
                onError: OnErrorCallback = () => {}, persistInterval = 60, lastHitThreshold = 1, lengthErrorThreshold=5) {

        this.url = url
        this.head = -1
        this.disabled = disabled
        this.recordDataSize = recordDataSize
        this.recordSize = 1 + (writeTimestamp ? 1 : 0) + this.recordDataSize
        
        this.persistInterval = persistInterval
        this.lastHitThreshold = lastHitThreshold
        this.lengthErrorThreshold = lengthErrorThreshold
        this.onError = onError
        this.writeTimestamp = writeTimestamp
        this.fill = fill
        
        if (disabled) this.fetch_fn = dummyFetch

        // enqueue dirty chunks every persistInterval seconds
        this.interval = setInterval(this._enqueueDirtyChunks, persistInterval * 1000)
        log.debug(`buffer constructed with recordDataSize=${this.recordDataSize}, lastHitThreshold=${this.lastHitThreshold}, lengthErrorThreshold=${this.lengthErrorThreshold}`)
    }

    get headMediatime() {
        return this.head * this.fps
    }

    /**
    * @param length length of the data in samples / frames.
    * @param fps fps of the media. Used to convert mediatime to sample / frame number
    */
    make = (length: number, fps=60, chunkLength = 200) => {
        this.length = length
        this.chunkLength = chunkLength
        this.fps = fps
        this.head = -1

        this.numChunks = Math.ceil(length / chunkLength)

        this.chunkDataByteLength = this.chunkLength * 8 * this.recordSize
        this.chunkIdxsByteLength = this.chunkLength * 4

        this.dataArrayBuff = new ArrayBuffer(this.numChunks * this.chunkDataByteLength)
        this.dataArray = new Float64Array(this.dataArrayBuff, 0, Math.floor(this.dataArrayBuff.byteLength / 8))
        this.idxsArrayBuff = new ArrayBuffer(this.numChunks * this.chunkIdxsByteLength)
        this.idxsArray = new Uint32Array(this.idxsArrayBuff, 0, Math.floor(this.idxsArrayBuff.byteLength) / 4)

        this._createChunks()

        log.debug(`buffer.make called with length=${this.length}(${this.numChunks} x ${this.chunkLength}), fps=${fps} recordSize=${this.recordSize}(1+${(this.writeTimestamp?'1':'0')}+${this.recordDataSize})`)
    }

    destroy = () => {
        clearInterval(this.interval)
    }

    reset = () => {
        this.receivedData = false
    }

    _createChunks = () => {
        log.debug('_createChunks')
        this.chunks = Array<Chunk>()
        for(let i = 0; i < this.numChunks; i++) {
            const chunk: Chunk = {
                chunk_index: i,
                idxs: new Uint32Array(this.idxsArrayBuff, i * this.chunkIdxsByteLength, Math.floor(this.chunkIdxsByteLength / 4)),
                data: new Float64Array(this.dataArrayBuff, i * this.chunkDataByteLength, Math.floor(this.chunkDataByteLength / 8)),
                logs: Array<LogRecord>(),
                dirty: false,
                inQueue: false,
                lastHit: Date.now(),
            }
            this.chunks.push(chunk)
        }
        
    }

    // load a chunk from an array buffer. Used to load chunks received from server.
    // array buffer has structure
    // | idxs [4*chunkLength] | data[8*recordLength*chunkLength] |
    _loadChunk = (index: number, arrayBuff: ArrayBuffer, logs: Array<LogRecord> = null) => {
        this.chunks[index].idxs.set(new Uint32Array(arrayBuff, 0, Math.floor(this.chunkIdxsByteLength / 4)))
        this.chunks[index].data.set(new Float64Array(arrayBuff, this.chunkIdxsByteLength, Math.floor(this.chunkDataByteLength / 8)))
    }

    loadChunks = (arr: ArrayBuffer) => {
        if (arr.byteLength === 0) 
            throw new Error('Provided ArrayBuffer is empty')
        
        const packer = new Packer()
        const chunks = packer.unpackChunkList(arr).chunks

        for(let i = 0; i < chunks.length; i++) {
            this._loadChunk(i, chunks[i].data.buffer, chunks[i].logs)
        }

        this.reset()
    }

    _load = async () => {
        const url = this.url + '/chunks'
        // return the stored promise if there is no response yet.
        if (this.loadDataPromise && this.isDataPromisePending) return this.loadDataPromise

        const myHeaders = new Headers()
        myHeaders.append('pragma', 'no-cache')
        myHeaders.append('cache-control', 'no-cache')
        const options = {
            method: 'GET',
            headers: myHeaders,
        }

        this.isDataPromisePending = true
        this.loadDataPromise = fetcher(url, options)
            .then(async (res) => {
                const arr = await res.arrayBuffer()
                this.loadChunks(arr)
            }).catch(err => {
            }).finally(() => {
                this.isDataPromisePending = false
            })
        return this.loadDataPromise
    }

    _getChunkNum = (frameNum: number) => {
        return Math.floor(frameNum / this.chunkLength)
    }

    _write = (mediatime: number, record: number[]) => {
        const frameNum = Math.round(mediatime * this.fps)
        // write into data buffer
        let iniFrame, endFrame
        if(this.fill) {
            iniFrame = this.head + 1
            endFrame = frameNum
            if(endFrame < this.head)
                return log.warn(`Attempt to write non-sequentially with fill=true, head=${this.head}, frameNum=${frameNum}`)
        } else {
            iniFrame = frameNum
            endFrame = frameNum
        }

        for(let fn=iniFrame; fn <= endFrame; fn++) {
            const ini = fn * this.recordSize
            let i = 0
            for (; i < this.recordSize; i++) {
                this.dataArray[ini + i] = record[i]
            }
            this.idxsArray[fn] = this.cntr++

            const chunkNum = this._getChunkNum(fn)
            this.chunks[chunkNum].dirty = true
            this.chunks[chunkNum].lastHit = Date.now()
        }
        this.head = endFrame
    }

    makeIterator = (itemIndex: number, from: number, to: number, step=1) => {
        let index = from
        return {
            next: () => {
                let result
                if(index < to) {
                    result = {value: [index, this.dataArray[index * this.recordSize + 1 + (this.writeTimestamp ? 1 : 0) + itemIndex]], done: false}
                    index += step
                    return result
                }
                return {value: [], done: true}
            }
        }
    }

    makeReverseIterator = (from: number, to: number, itemIndex: number, step=1) => {
        let index = from
        to = Math.max(0, to)
        return {
            next: () => {
                let result
                if(index > to) {
                    result = {value: [index, this.dataArray[index * this.recordSize + 1 + (this.writeTimestamp ? 1 : 0) + itemIndex]], done: false}
                    index -= step
                    return result
                }
                return {value: [], done: true}
            }
        }
    }

    isOutBufferFull = () => {
        return this.outBuffer.length > this.lengthErrorThreshold
    }

    /**
     * Move the head to this meadiatime in seconds
     * @param mediatime in seconds
     */
    seek = (mediatime: number) => {
        const frameNum = Math.round(mediatime * this.fps)
        this.head = frameNum
    }

    /**
     * Puts a data sample into the data buffer.
     * @param mediatime - A media mediatime (eg. video or audio time in seconds)
     * @param data - A data sample / row
     */
    data = (mediatime: number, data: DataSample) => {
        if(this.disabled) return
        this.receivedData = true

        if(data.length !== this.recordDataSize)
            throw new Error(`invalid record size ${data.length} != ${this.recordDataSize} provided to data().`)

        let record
        if(this.writeTimestamp) {
           record = [mediatime, Date.now(), ...data] 
        } else {
            record = [mediatime, ...data] 
        }

        this._write(mediatime, record)
    }

    readFrame = (frameNum: number) => {
        if(this.idxsArray[frameNum] === undefined) {
            return [null, null] as [number[], LogRecord[]]
        }

        let res = []
        if (this.idxsArray[frameNum] === 0) res = null
        else {
            res = []
            const ini = frameNum * this.recordSize
            for (let i = 0; i < this.recordSize; i++) {
                res.push(this.dataArray[ini+i])
            }
        }

        let logs: LogRecord[] = []

        return [res, logs] as [number[], LogRecord[]]
    }

    read = (mediatime: number) => {
        const frameNum = Math.round(mediatime * this.fps)
        return this.readFrame(frameNum)
    }

    readHead = () => {
        return this.readFrame(this.head)
    }

    log = (mediatime: number, data: LogSample) => {
        if(this.disabled) return
        this.receivedData = true

        const frameNum = Math.round(mediatime * this.fps)
        const chunkNum = this._getChunkNum(frameNum)

        log.info(`logging ${JSON.stringify(data)} for frameNum = ${frameNum}, chunkNum = ${chunkNum}`)

        const record: LogRecord = [this.cntr++, mediatime, data]
        this.chunks[chunkNum].logs.push(record)

        this.chunks[chunkNum].dirty = true
        this.chunks[chunkNum].lastHit = Date.now()
        
    }

    /**
     * Ran regularly to check for dirty chunks
     */
    _enqueueDirtyChunks = () => {
        log.debug(`_enqueueDirtyChunks, buffer length=${this.outBuffer.length}`)
        if (this.isOutBufferFull()) {
            this.onError(`Output buffer full (length=${this.outBuffer.length}). Data may be lost.`)
        }

        this.chunks.forEach((chunk, index)=>{
            if(chunk.dirty && !chunk.inQueue && chunk.lastHit < Date.now() - 1000*this.lastHitThreshold) {
                log.debug(`enqueing chunk ${chunk.chunk_index}`)
                this.outBuffer.push(chunk)
                chunk.inQueue = true
            }
        })

        this.awaitClear()
    }

    /**
     * Move all the remaining chunks into the outBuffer, then wait for it to clear
     * @returns promise that is resolved 
     */
     flush = async (timeout=8000) => {
        if (!this.receivedData) return Promise.resolve()

        this.chunks.forEach(chunk=>{
            if(chunk.dirty && !chunk.inQueue) {
                this.outBuffer.push(chunk)
                chunk.inQueue = true
            }
        })

        return this.awaitClear(timeout)
    }

    /**
     * Submit the next chunk it the output queue.
     * @returns promise from fetch
     */
    submitChunk = async () => {
        log.debug('submitChunk')
        const chunk = this.outBuffer[0]
        const packet = new Packer().pack(
            this.dataArrayBuff, chunk.chunk_index * this.chunkDataByteLength, this.chunkDataByteLength,
            this.idxsArrayBuff, chunk.chunk_index * this.chunkIdxsByteLength, this.chunkIdxsByteLength,
            chunk.logs, this.chunkLength, this.recordSize)
        const requestOptions = {
            method: 'POST',
            body: packet,
        }

        const url = this.url + '/chunk?' + new URLSearchParams({
            index: chunk.chunk_index.toString(),
            length: this.chunkLength.toString()
        })

        log.debug(`submitting chunk ${chunk.chunk_index}`)
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
     * Makes a race between
     * - submitting all the chunks in the output buffer
     * - The provided timeout
     * @param timeout 
     * @returns promise
     */
    awaitClear = async (timeout = 0) => {
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
