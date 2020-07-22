class EventBuffer {
    private buffer: Array<object>;
    private size: number;
    private url: string;

    constructor(size: number, url: string) {
        this.buffer = new Array();
        this.size = size;
        this.url = url;
    }

    private submit() {
        console.log('submitting buffer..')
        this.buffer = new Array();
    }

    public data(timestamp:number, data: object) {
        console.log(timestamp)
        this.buffer.push({
            't': timestamp,
            'd': data
        })
        if(this.buffer.length == this.size) {
            this.submit()
        }
    }
}

export { EventBuffer }