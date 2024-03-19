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
  /**
   * Recording options for OpenVIDU
   */
  serverRecording?: {
    /**
     * Enable server recording
     */
    enable: boolean
    /**
     * Record audio
     */
    hasAudio: boolean
    /**
     * Record video
     */
    hasVideo: boolean
    /**
     * record all streams in a single file in a grid layout or record each stream in its own separate file.
     */
    outputMode: "INDIVIDUAL" | "COMPOSED" | "COMPOSED_QUICK_START"
    /**
     * Video resolution. Only applies for COMPOSED output mode
     * @default "1280x720"
     */
    resolution: string
    /**
     * Only applies for COMPOSED output mode
     * @default 25
     */
    frameRate: number
  }
}
