import { BaseTaskSpec } from "@covfee-shared/spec/task"

/**
 * @TJS-additionalProperties false
 */
export interface VideocallTaskSpec extends BaseTaskSpec {
  /**
   * @default "VideocallTask"
   */
  type: "VideocallTask"

  /**
   * Layout mode
   * @default 'grid
   */
  layout: "grid"
  /**
   * Call is audio only
   * video is always off
   * @default false
   */
  videoOff?: boolean
  /**
   * Videocall is muted
   * @default false
   */
  muted?: boolean
  /**
   * Allow the user to mute their own audio
   * @default true
   */
  allowMute?: boolean
  /**
   * Allow the user to stop their own video
   * @default true
   */
  allowStopVideo?: boolean
  /**
   * Allow the user to share their screen
   * @default true
   */
  allowScreenShare?: boolean
}
