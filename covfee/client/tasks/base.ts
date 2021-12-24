import React from 'react';
import { AnnotationBuffer } from '../buffers/buffer'
import { VideoPlayerContext } from 'hit/continuous_task_player';
import { ButtonManagerClient } from 'input/button_manager';

export abstract class CovfeeTask<T extends BasicTaskProps, S> extends React.Component<T, S> {
    static taskType = 'component'
    static taskInfo: {
        bufferDataLen: number
    }
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

export abstract class CovfeeContinuousTask<T extends ContinuousTaskProps, S> extends CovfeeTask<T, S> {
    static taskType = 'continuous'
}


export interface CommonTaskProps {
    /**
     * The task specification
     */
    spec: any

    /**
     * Task response to be displayed, possibly for editing
     * A null value indicates the task should initialize an empty state
     * The response will normally be loaded into the task state for visualization / edition
     */
    response: any

    /**
     * This buffer should be used to record data or log events during continuous tasks.
     * It takes care of communication with the server.
     */
    buffer: AnnotationBuffer

    /**
     * Interface to the buttons manager
     */
    buttons: ButtonManagerClient

    /**
     * Called to get access to shared (synced) state and shared state setter
     */
    getSharedState: () => [any, (arg0: any) => void]
}

/**
 * Props used by a normal non-continuous task
 */
export interface BasicTaskProps extends CommonTaskProps {

    /**
     * Whether the task should be disabled (cannot be edited)
     * Only relevant when response != null
     */
    disabled: boolean
    
    /**
     * To be called when the task has been submitted by the user (eg. via a submit button)
     * arg0 is the task response
     */
    onSubmit: (response: any) => void

    /**
     * Returns a submit button to be rendered in the task. Alternative to directly calling onSubmit.
     */
    renderSubmitButton: (arg0?: any) => React.ReactNode

}

export interface ContinuousTaskProps extends CommonTaskProps {

    /**
     * Object representing the video player
     * Includes utilities for listening to events and controlling the player
     */
    player: VideoPlayerContext
    
    /**
     * If true, the task should visualize the action log in addition to the data.
     */
    visualizeActionsOn?: boolean
    
    /**
     * Element that renders the video player in the task.
     * Should be rendered when provided
     */
    renderPlayer?: (arg0?: any) => React.ReactNode
    
    /**
     * Called when a continuous task ends
     */
    onEnd: (arg0: any) => void
}
