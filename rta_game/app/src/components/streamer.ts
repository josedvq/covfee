import io from 'socket.io-client';

class SocketStreamer {
    light_callbacks: Array<Function> ;
    audio_callbacks: Array<Function> ;
    socket: any;

    constructor(url: string) {
        this.light_callbacks = Array();
        this.audio_callbacks = Array();

        // start the stream
        this.socket = io(url, {autoConnect: false});
        
        let self = this;
        this.socket.on('connect', function () {
            console.log('connected to socket');
            self.socket.emit('audio-stream', {}, function (data) {
                console.log;('started audio-stream')
            });
        });

        this.socket.on('data-chunk', function (data) {
            // data.constructor.name = ArrayBuffer
            // 32bits floating point buffer, with each samples between -1.0 and 1.0. If the AudioBuffer has multiple channels, they are stored in separate buffer.
            for (let i = 0; i < self.audio_callbacks.length; i++) {
                self.audio_callbacks[i](data);
            }
            for (let i = 0; i < self.light_callbacks.length; i++) {
                self.light_callbacks[i](data);
            }
        });
    }

    start(): void {
        this.socket.open();
    }

    stop(): void {
        this.socket.close();
    }

    on_light(fn: Function) : void {
        this.light_callbacks.push(fn);
    }

    on_audio(fn: Function): void {
        this.audio_callbacks.push(fn);
    }
}

class BackboneStreamer {
    data_callbacks: Array<Function>;
    scene_callbacks: Array<Function>;
    model: any;
    blocks: any;
    dtypes: any;

    constructor(backbone: any) {
        this.model = backbone.model;
        backbone.model.on('change:data', this._on_data_change_callback.bind(this));
        backbone.model.on('change:blocks change:dtypes', this._on_scene_change_callback.bind(this));

        this.data_callbacks = Array();
        this.scene_callbacks = Array();
    }

    _on_scene_change_callback() {
        for (let i = 0; i < this.scene_callbacks.length; i++) {
            this.scene_callbacks[i](this.model.get('blocks'), this.model.get('dtypes'));
        }
    }

    _on_data_change_callback() {
        for (let i = 0; i < this.data_callbacks.length; i++) {
            this.data_callbacks[i](this.model.get('data').buffer);
        }
    }

    on_data(fn: Function): void {
        this.data_callbacks.push(fn);
    }

    on_scene_change(fn: Function): void {
        this.scene_callbacks.push(fn);
    }
}

export { SocketStreamer, BackboneStreamer }