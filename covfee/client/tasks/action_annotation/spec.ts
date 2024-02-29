import { BaseTaskSpec } from "@covfee-shared/spec/task"
/**
 * @TJS-additionalProperties false
 */
export interface ActionAnnotationTaskSpec extends BaseTaskSpec {
  /**
   * @default "ActionAnnotationTask"
   */
  type: "ActionAnnotationTask"
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
