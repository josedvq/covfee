import * as React from 'react'

interface BaseTaskProps {
    onSubmit: Function,
    onEnd: Function, // should be called when the task ends
    buffer: Function
}

interface ReplayableTaskProps {
    replayMode: boolean,
    getCurrReplayAction: Function,
    getNextReplayAction: Function
}

interface TaskSpec {
    type: string,
    hit_id: string,
    id: string,
    name: string,
    media: any,
    numSubmissions: number,
    props: any,
    response: any,
}

export { BaseTaskProps, ReplayableTaskProps, TaskSpec}
