abstract class Buffer {
    abstract async awaitQueueClear(timeout: number) : Promise<unknown>
    abstract data(timestamp: number, data: Array<any>): void
}

class EventBuffer extends Buffer {
    public numBuffers = 0 // num of filled buffers
    public queue = [{status: 'filling', buffer: []}]
    public receivedData = false

    private currBuffer = 0

    private size: number
    private url: string
    private onError: any

    constructor(size: number, url: string, onError: any) {
        super()
        this.queue = [{ status: 'filling', buffer: [] }]
        this.size = size
        this.url = url
        this.onError = onError
    }

    moveToNextBuffer = () => {
        this.queue[this.currBuffer].status = 'filled'
        this.queue.push({ status: 'filling', buffer: [] })
        this.currBuffer += 1
    }

    submitBuffer = (idx: number) => {
        this.queue[idx].status = 'submitting'
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ index: idx, data: this.queue[idx].buffer})
        }
        Promise.race([
            fetch(this.url, requestOptions),
            new Promise((_, reject) =>
                window.setTimeout(() => reject(new Error('timeout')), 3000)
            )
        ]).then(async (response: Response) => {
            const data = await response.json()

            // check for error response
            if (!response.ok) {
                // get error message from body or default to response status
                const error = (data && data.message) || response.status
                return Promise.reject(error)
            }

            // success
            this.queue[idx] = undefined
        })
        .catch(error => {
            this.queue[idx].status = 'error'
        })
    }   

    attemptBufferSubmit = (flush = false) => {
        const statusToSubmit = ['filled', 'error']
        if (flush) statusToSubmit.push('filling')
        for (let i = 0; i < this.queue.length; i++) {
            if (this.queue[i] === undefined) continue
            // 'filled' should only happen for one buffer, multiple may be in 'error' state
            
            if (statusToSubmit.includes(this.queue[i].status))
                this.submitBuffer(i)
        }
    }

    awaitQueueClear = async (timeout: number) => {
        return Promise.race([
            new Promise((resolve, reject)=>{
                window.setInterval(() => {
                    let foundErrored = false
                    this.queue.forEach((el)=>{
                        if(el === undefined) return
                        if (el.status == 'error' || el.status == 'submitting') foundErrored = true
                    })
                    if (!foundErrored) resolve()
                }, 3000);
            }),
            new Promise((_, reject) =>
                window.setTimeout(() => reject(new Error('timeout')), timeout)
            )
        ])
    }

    handleBufferFilled = () => {
        // move the pointer to the next buffer
        this.moveToNextBuffer()

        this.attemptBufferSubmit()

        let numNonSubmittedBuffers = 0
        this.queue.forEach((elem)=>{
            if (elem !== undefined) numNonSubmittedBuffers += 1
        })

        if (numNonSubmittedBuffers > 5) {
            this.onError('Unable to submit results to the server. Annotations cannot be saved.')
        }
    }

    data = (timestamp:number, data: Array<any>) => {
        let payload = [2,
            Date.now(),
            timestamp,
            ...data
        ]
        this.queue[this.currBuffer].buffer.push(payload)
        if(this.queue[this.currBuffer].buffer.length == this.size) {
            this.handleBufferFilled()
        }

        this.receivedData = true
    }
}

class DummyBuffer extends Buffer {
    awaitQueueClear = async (timeout: number) => {
        return Promise.resolve()
    }

    data = (timestamp: number, data: Array<any>) => {
        return
    }
}

export { Buffer, EventBuffer, DummyBuffer }