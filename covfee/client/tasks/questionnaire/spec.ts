import { BaseTaskSpec } from "@covfee-shared/spec/task"
import { WavesurferPlayerMedia } from "@covfee-shared/spec/players/wavesurfer"
import { VideojsPlayerMedia } from "@covfee-shared/spec/players/videojs"
import { FormSpec, InputSpec } from "@covfee-shared/spec/form"

/**
 * @TJS-additionalProperties false
 */
export interface QuestionnaireTaskSpec extends BaseTaskSpec {
  /**
   * @default "QuestionnaireTask"
   */
  type: "QuestionnaireTask"
  /**
   * Media file to be displayed.
   */
  media?: VideojsPlayerMedia | WavesurferPlayerMedia
  /**
   * Specification of the form to be created.
   */
  form: FormSpec<InputSpec>
  /**
   * If true, the form will only become active after the media playback ends
   */
  disabledUntilEnd?: boolean
}
