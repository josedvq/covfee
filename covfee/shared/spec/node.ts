/**
 * @TJS-additionalProperties false
 */
export interface BaseNodeSpec {
  name: string
  // id?: string;
  /**
   * If true, this node must have a valid submission before the HIT can be submitted
   * @default True
   */
  required?: boolean
  /**
   * Node is marked as a prerrequisite
   * Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
   * @default False
   */
  prerequisite?: boolean
  /**
   * Maximum number of submissions a user can make for the task.
   * @default 0
   */
  max_submissions?: number
  /**
   * Instructions to be displayed for the node
   */
  instructions?: string
  /**
   * How the instructions will be displayed
   * @default 'default'
   */
  instructions_type?: "default" | "popped"
  /**
   * If true, the task state will be synced between clients.
   * This applies both to multiple clients in the same journey and across journeys.
   * Internally covfee uses socketio to synchronize task state.
   * @default False
   */
  useSharedState?: boolean

  /**
   * Condition for task start
   * @default 'N >= NJOURNEYS'
   */
  start?: string
  /**
   * Conditions for task end
   */
  stop?: string
  /**
   * Conditions for task pause
   */
  pause?: string
}
