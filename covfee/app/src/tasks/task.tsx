import * as React from 'react'

interface MediaSpec {
    /**
     * URL to hosted media file
     */
    url: string,
}

interface VideoSpec extends MediaSpec {
    /**
     * Video resolution. Used by some players.
     */
    res?: Array<number>,
    /**
     * Video fps. Used by some players to obtain frame number from time (since frame number is not directly accesible in browsers).
     */
    fps?: number
}

interface AudioSpec extends MediaSpec {}

interface TaskSpec {
    type: string,
    hit_id: string,
    id: string,
    name: string,
    media?: MediaSpec,
    numSubmissions: number,
    response: any,
}

interface BaseTaskProps extends TaskSpec {
    /**
     * Specification of the form to be created.
     */
    onSubmit: Function,
    /**
     * Specification of the form to be created.
     */
    onEnd: Function, // should be called when the task ends
    /**
     * For continuous tasks.
     */
    buffer: Function,
    /**
     * Used to provide a function that renders the task instructions.
     */
    setInstructionsFn: Function
}

interface ReplayableTaskProps {
    replayMode: boolean,
    getCurrReplayAction: Function,
    getNextReplayAction: Function
}



export { 
    BaseTaskProps, 
    ReplayableTaskProps, 
    TaskSpec, 
    MediaSpec,
    VideoSpec,
    AudioSpec
}
