class EventBuffer {
    public numBuffers = 0 // num of filled buffers
    private queue = [{status: 'filling', buffer: []}]

    private currBuffer = 0

    private size: number
    private url: string
    private submission: number
    private onError: any

    constructor(size: number, url: string, submission: number, onError: any) {
        this.size = size
        this.url = url
        this.submission = submission
        this.onError = onError
    }

    private moveToNextBuffer() {
        this.queue[this.currBuffer].status = 'filled'
        this.queue.push({ status: 'filling', buffer: [] })
        this.currBuffer += 1
    }

    private submitBuffer(idx: number) {
        this.queue[idx].status = 'submitting'
        // console.log({ index: idx, data: this.queue[idx].buffer })
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ index: idx, submission: this.submission, data: this.queue[idx].buffer})
        }
        Promise.race([
            fetch(this.url, requestOptions),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), 3000)
            )
        ]).then(async response => {
            const data = await response.json()

            // check for error response
            if (!response.ok) {
                // get error message from body or default to response status
                const error = (data && data.message) || response.status
                return Promise.reject(error)
            }

            // success
            this.queue[idx] = undefined
            console.log('submitted buffer '+idx)
        })
        .catch(error => {
            this.queue[idx].status = 'error'
        })
    }   

    public attemptBufferSubmit() {
        for (let i = 0; i < this.queue.length; i++) {
            if (this.queue[i] === undefined) continue
            // 'filled' should only happen for one buffer, multiple may be in 'error' state
            if (this.queue[i].status == 'filled' || this.queue[i].status == 'error')
                this.submitBuffer(i)
        }
    }

    public async awaitQueueClear(timeout: number) {
        return Promise.race([
            new Promise((resolve, reject)=>{
                setInterval(() => {
                    this.queue.forEach((el)=>{
                        if(el === undefined) return
                        if(el.status == 'error' || el.status == 'submitting') reject()
                        resolve()
                    })
                }, 3000);
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), timeout)
            )
        ])
    }

    private handleBufferFilled() {
        // move the pointer to the next buffer
        this.moveToNextBuffer()

        this.attemptBufferSubmit()

        let numNonSubmittedBuffers = 0
        this.queue.forEach((elem)=>{
            console.log(elem)
            if (elem !== undefined) numNonSubmittedBuffers += 1
        })

        // console.log(this.queue)

        if (numNonSubmittedBuffers > 5) {
            this.onError('Unable to submit results to the server. Annotations cannot be saved.')
        }
    }

    public data(timestamp:number, data: object) {
        let payload = [
            Date.now(),
            timestamp,
            data
        ]
        // console.log(data)
        this.queue[this.currBuffer].buffer.push(payload)
        if(this.queue[this.currBuffer].buffer.length == this.size) {
            this.handleBufferFilled()
        }
    }
}

export { EventBuffer }