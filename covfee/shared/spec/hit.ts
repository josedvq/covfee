import { TaskSpec } from "./task"
import { JourneySpec } from "./journey"
import { MarkdownContentSpec } from "./tasks/utils"

type NodeSpec = TaskSpec[]

export interface completionInfo {
  /**
   * Completion code to give back to participants. Used for crowdsourcing in eg. Prolific
   */
  completionCode?: string
  /**
   * Name/label of the website to redirect to
   */
  redirectName?: string
  /**
   * Redirect URL. URL to redirect participants to after completing the HIT.
   */
  redirectUrl?: string
}
/**
 * @TJS-additionalProperties false
 */
export interface HitSpec {
  /**
   * unique ID of the hit
   */
  id: string
  /**
   * HIT name (for display)
   */
  name: string
  /**
   * list of tasks in the HIT
   */
  nodes: NodeSpec
  /**
   * list of journeys in the HIT
   */
  journeys: JourneySpec
  /**
   * number of copies or instances of the HIT
   */
  repeat?: number
  /**
   * Extra hit-level information to display
   */
  extra?: MarkdownContentSpec
  /**
   * If true, the user will be required to log in before starting the task
   */
  requireLogin?: boolean
  /**
   * HIT configuration and other params
   */
  config?: completionInfo
}
