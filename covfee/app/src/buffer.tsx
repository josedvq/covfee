class EventBuffer {
    public num_buffers = 0 // num of filled buffers
    private buffer: Array<object>
    private size: number
    private url: string
    private on_error: any

    constructor(size: number, url: string, on_error: any) {
        this.buffer = new Array();
        this.size = size;
        this.url = url;
        this.on_error = on_error
    }

    private submit() {
        
        const filled_buffer = this.buffer
        this.buffer = new Array()

        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filled_buffer)
        }
        fetch(this.url, requestOptions)
            .then(async response => {
                const data = await response.json()

                // check for error response
                if (!response.ok) {
                    // get error message from body or default to response status
                    const error = (data && data.message) || response.status
                    return Promise.reject(error)
                }

                // success
                this.num_buffers += 1
                console.log('buffer submitted!')
            })
            .catch(error => {
                this.on_error()
            })
    }

    public data(timestamp:number, data: object) {
        let payload = [
            Date.now(),
            timestamp,
            data
        ]
        console.log(data)
        this.buffer.push(payload)
        if(this.buffer.length == this.size) {
            this.submit()
        }
    }
}

export { EventBuffer }