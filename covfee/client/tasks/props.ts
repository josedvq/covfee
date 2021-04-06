
export interface BaseTaskProps {
    /**
     * To be called when the task has been submitted by the user (eg. via a submit button)
     */
    onSubmit: Function,
    /**
     * Used to provide a function that renders the task instructions.
     */
    setInstructionsFn: Function
}

export interface ContinuousTaskProps extends BaseTaskProps {
    
    onEnd: Function,
    /**
     * This fn should be called everytime a data point is recorded in a continuous task. It will be buffered and sent to the server.
     */
    buffer: Function,
}

export interface ReplayableTaskProps extends ContinuousTaskProps {
    replayMode: boolean,
    getCurrReplayAction: Function,
    getNextReplayAction: Function
}