import { BaseTaskSpec } from "@covfee-shared/spec/task"
/**
 * @TJS-additionalProperties false
 */
export interface ContinuousAnnotationTaskSpec extends BaseTaskSpec {
  /**
   * @default "ContinuousAnnotationTask"
   */
  type: "ContinuousAnnotationTask"
  media: {
    type: "video"
    url: string
  }
  annotations: {
    name: string
    interface: "RankTrace" | "GTrace" | "Binary"
  }[]
  userCanAdd: boolean
}
