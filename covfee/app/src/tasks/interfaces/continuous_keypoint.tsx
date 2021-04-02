interface Props {
    name: string,
    media: any,
    onEnd: Function, // should be called when the task ends
    buffer: Function,
    replayMode: boolean,
    getCurrReplayAction: Function,
    getNextReplayAction: Function,
    setInstructionsFn: Function
}
interface State {
    paused: boolean,
    occluded: boolean,
    mouse_valid: boolean,
    playbackRateIdx: number,
    duration: number,
    currentTime: number,
    currentFrame: number,
    reverseCount: {
        visible: boolean,
        count: number
    },
    replayMode: {
        data: Array<number>
    }
}