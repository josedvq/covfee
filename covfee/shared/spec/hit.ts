import { JourneySpec } from "./journey"
import { TaskSpec } from "./task"
import { MarkdownContentSpec } from "./utils"

type NodeSpec = TaskSpec[]

export interface completion_info {
  /**
   * Completion code to give back to participants. Used for crowdsourcing in eg. Prolific
   */
  completion_code?: string
  /**
   * Name/label of the website to redirect to
   */
  redirect_name?: string
  /**
   * Redirect URL. URL to redirect participants to after completing the HIT.
   */
  redirect_url?: string
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
   * HIT configuration and other params
   */
  config?: completion_info
}
