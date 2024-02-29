import { BaseTaskSpec } from "@covfee-shared/spec/task"
import { VideojsPlayerMedia } from "@covfee-shared/spec/players/videojs"
import { BinaryInputSpec } from "@covfee-shared/spec/input/1d_intensity"
// import { FormSpec } from "@covfee-shared/spec/form"
/**
 * @TJS-additionalProperties false
 */
export interface ActionAnnotationTaskSpec extends BaseTaskSpec {
  /**
   * @default "ActionAnnotationTask"
   */
  type: "ActionAnnotationTask"
  /**
   * Media file to be displayed.
   */
  media: VideojsPlayerMedia
  /**
   * The annotations
   */
  input: BinaryInputSpec
}
