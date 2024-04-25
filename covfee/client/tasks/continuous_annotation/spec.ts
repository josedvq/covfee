import { BaseTaskSpec } from "@covfee-shared/spec/task"
/**
 * @TJS-additionalProperties false
 */
export interface AnnotationDataSpec {
  category: string
  participant: string
  interface: "RankTrace" | "GTrace" | "Binary"
}
export interface MediaSpec {
  type: "video/mp4"
  src: string
}

export interface ContinuousAnnotationTaskSpec extends BaseTaskSpec {
  /**
   * @default "ContinuousAnnotationTask"
   */
  type: "ContinuousAnnotationTask"
  media: MediaSpec[]
  annotations: AnnotationDataSpec[]
  prolificCompletionCode?: string
  userCanAdd: boolean
  /**
   * When specified: True, means audio on is mandatory, False means audio off (muted) is mandatory.
   * @default null
   */
  audioRequirement?: boolean
  videoTutorialUrl?: string
}
