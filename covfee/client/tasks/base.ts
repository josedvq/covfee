import { TaskInfo } from '@covfee-types/task';
import React from 'react';
import { DataCaptureBuffer, DataPlaybackBuffer} from '../buffers/buffer'

export class CovfeeComponent<T extends BaseTaskProps, S> extends React.Component<T, S> {
    static taskInfo?: TaskInfo
    /**
     * Used to provide a function that renders the task instructions.
     */
    instructions?: () => React.ReactNode
    /**
     * If implemented, should return the response to the task up to the given moment.
     * This method is called for timed tasks when the timer is over to retrieve the result of the task.
     */
    getData?: () => any
}

export interface BaseTaskProps {
    /**
     * To be called when the task has been submitted by the user (eg. via a submit button)
     */
    onSubmit: () => void,
    /**
     * If true, visualization mode is enabled and the task is expected to visualize its data.
     */
    visualizationModeOn: boolean
    /**
     * Response to be visualized if visualizationModeOn is true
     */
    visualizationData: any
}

export interface ContinuousTaskProps extends BaseTaskProps {
    /**
     * Called when a continuous task ends
     */
    onEnd: () => void,
    /**
     * This buffer should be used to record data or log events during continuous tasks.
     * It takes care of communication with the server.
     */
    buffer: DataCaptureBuffer,
    /**
     * Input buffer to be used by the task to read the data of a response and visualize it.
     */
    visualizationBuffer: DataPlaybackBuffer
    /**
     * If true, the task should visualize the action log in addition to the data.
     */
    visualizeActionsOn: boolean
}