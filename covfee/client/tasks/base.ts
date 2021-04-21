import { BasePlayerProps } from '@covfee-types/players/base';
import { TaskInfo } from '@covfee-types/task';
import { TaskPlayer } from '../hit/task_player';
import React from 'react';
import { AnnotationBuffer } from '../buffers/buffer'
import { RenderPlayerProps } from 'players';

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

export class CovfeeContinuousComponent<T extends ContinuousTaskProps, S> extends CovfeeComponent<T, S> {
    
}

/**
 * Props used by a normal non-continuous task
 */
export interface BaseTaskProps {
    /**
     * To be called when the task has been submitted by the user (eg. via a submit button)
     */
    onSubmit: () => Promise<void>,
    /**
     * If true, visualization mode is enabled and the task is expected to visualize its data.
     */
    visualizationModeOn: boolean
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
    buffer: AnnotationBuffer,
    /**
     * If true, the task should visualize the action log in addition to the data.
     */
    visualizeActionsOn?: boolean
    /**
     * May be called to get the current media time
     */
    currentTime: (arg0?: number) => number
}

/**
 * A player task is a task that implementing BasePlayerProps, which can 
 * therefore act as a media player.
 */
export interface PlayerTaskProps extends ContinuousTaskProps, BasePlayerProps {
    /**
     * Called when there is a playback error
     */
    onError: (err: any) => void
    /**
     * Called when there is a playback error
     */
    player: React.ReactElement
    /**
     * Interface to the buttons manager
     */
    buttons: any
}
