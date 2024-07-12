import React from "react"

export abstract class CovfeeTask<
  T extends BaseTaskProps,
  S
> extends React.Component<T, S> {
  static taskType = "component"
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

export interface BaseTaskProps {
  /**
   * The task specification
   */
  spec: any
  /**
   * Auxiliary task information
   * Results of the the task backend's on_join method
   */
  taskData: any
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
   * To be called when the task has been submitted by the user (eg. via a submit button)
   * arg0 is the task response
   */
  onSubmit: (response: any) => void

  /**
   * Returns a submit button to be rendered in the task. Alternative to directly calling onSubmit.
   */
  renderSubmitButton: (arg0?: any) => React.ReactNode

  /**
   * To be called when wanting to update the task's numeric progress (value between 0 and 100),
   * making the information propagate into the admin interface.
   */
  onUpdateProgress: (progress: number) => void
}

export interface CovfeeTaskProps<T> extends BaseTaskProps {
  spec: T
}
