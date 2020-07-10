
class AudioPlayer {
    time: number = 0;
    context: any;

    constructor() {
        let AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioContext({
            sampleRate: 44100,
        });
    }
    
    stream(buffer: AudioBuffer) {
        // creates a new buffer source and connects it to the Audio context
        let source = this.context.createBufferSource();
        source.buffer = buffer;
        source.connect(this.context.destination);
        source.loop = false;
        // sets it and updates the time 
        source.start(this.time);
        this.time += source.buffer.duration; // time is global variable initially set to zero
    }

    play(data: ArrayBuffer) {
        let buffer = this.context.createBuffer(2, 1024, this.context.sampleRate);
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            let nowBuffering = buffer.getChannelData(channel);
            let data_view = new Float32Array(data)
            for (let i = 0; i < data_view.length; i++) {
                nowBuffering[i] = data_view[i];
            }
        }
        this.stream(buffer);
    }
}

export default AudioPlayer;