import React from 'react';
import { AnnotationBuffer } from '../buffers/buffer'
import { Cookies } from 'react-cookie';
import { VideoPlayerContext } from 'hit/continuous_task_player';

export interface TaskInfo {
    /**
     * If true the task will be assumed to implement visualization.
     * If true the option to visualize task results will be shown by default after a continuous task.
     */
    supportsVisualization?: boolean
}


export abstract class CovfeeTask<T extends BaseTaskProps, S> extends React.Component<T, S> {
    static taskType = 'component'
    static taskInfo: TaskInfo
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


/**
 * Props used by a normal non-continuous task
 */
export interface BaseTaskProps {
    /**
     * To be called when the task has been submitted by the user (eg. via a submit button)
     * arg0 is the task response
     * arg1 is a task buffer
     * arg2 indicates whether covfee should move to the next task
     */
    onSubmit: (arg0: any, arg1: any, arg2: boolean) => Promise<void>,
    /**
     * Task response to be displayed, possibly for editing
     * A null value indicates the task should initialize an empty state
     * The response will normally be loaded into the task state for visualization / edition
     */
    response: any
    /**
     * Whether the task should be disabled (cannot be edited)
     * Only relevant when response != null
     */
    disabled: boolean
    /**
     * Cookies object for tasks to store user settings
     */
    cookies: Cookies
}

export interface ContinuousTaskProps extends BaseTaskProps {
    /**
     * Called when a continuous task ends
     */
    onEnd: (arg0: any) => void,
    /**
     * This buffer should be used to record data or log events during continuous tasks.
     * It takes care of communication with the server.
     */
    buffer: AnnotationBuffer,
    /**
     * If true, the task should visualize the action log in addition to the data.
     */
    visualizeActionsOn?: boolean
    /**
     * Element that renders the video player in the task.
     * Should be rendered when provided
     */
    playerElement?: React.Component
    /**
     * Object representing the video player
     * Includes utilities for listening to events and controlling the player
     */
    player: VideoPlayerContext
    /**
     * Interface to the buttons manager
     */
    buttons: any
}
