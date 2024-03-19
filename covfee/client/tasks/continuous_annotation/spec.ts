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
  type: "video"
  url: string
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
}
