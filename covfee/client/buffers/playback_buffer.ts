import { TaskResponse } from "@covfee-types/task";
import { fetcher, throwBadResponse } from "../utils";
import { ChunkRange, DataPlaybackBuffer, DataRecord, OutChunk, PlaybackDataPromise, PlaybackDataSample } from "./buffer";

type OnErrorCallback = (arg0: string) => void

export class SimplePlaybackBuffer implements DataPlaybackBuffer {
    chunkLength = 200
    isDataReady = false
    isDataPromisePending = false
    loadDataPromise: Promise<void>
    data: Array<OutChunk>
    headptr = {
        chunk: 0,
        sample: 0
    }
    url: string
    onError: OnErrorCallback

    constructor(url: string, onError: OnErrorCallback) {
        this.url = url
        this.onError = onError
    }

    _load = async () => {
        // return the stored promise if there is no response yet.
        if (this.loadDataPromise && this.isDataPromisePending) return this.loadDataPromise
        this.isDataPromisePending = true
        this.loadDataPromise = fetcher(this.url)
            .then(throwBadResponse)
            .then((res: Array<OutChunk>) => {
                this.isDataReady = true
                this.data = res
                
            }).catch(err=>{
            }).finally(()=>{
                this.isDataPromisePending = false
            })
        return this.loadDataPromise
    }

    // replay logic
    read = (until: number, callback: (arg0: PlaybackDataSample) => void) => {
        if(!this.isDataReady) throw new Error('read() called before the data is ready.')

        while(this.data[this.headptr.chunk].data[this.headptr.sample][0] < until) {
            this.headptr.sample += 1
            if (this.headptr.sample == this.chunkLength) {
                this.headptr.sample = 0;
                this.headptr.chunk += 1
            }
        }

        const res: PlaybackDataSample = [this.data[this.headptr.chunk].data[this.headptr.sample][2], null]
        callback(res)
    }

    // seekTo = async (timestamp: number) => {
    //     if (!this.isDataReady) throw new Error('read() called before the data is ready.')

    //     // TODO: implement search

    // }
}