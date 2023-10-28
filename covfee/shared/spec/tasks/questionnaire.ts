import { BaseTaskSpec } from "../task";
import { WavesurferPlayerMedia } from "../players/wavesurfer";
import { VideojsPlayerMedia } from "spec/players/videojs";
import { FormSpec, InputSpec } from "../form";

/**
 * @TJS-additionalProperties false
 */
export interface QuestionnaireTaskBaseSpec {
  /**
   * @default "QuestionnaireTask"
   */
  type: "QuestionnaireTask";
  /**
   * Media file to be displayed.
   */
  media?: VideojsPlayerMedia | WavesurferPlayerMedia;
  /**
   * Specification of the form to be created.
   */
  form: FormSpec<InputSpec>;
  /**
   * If true, the form will only become active after the media playback ends
   */
  disabledUntilEnd?: boolean;
}

/**
* @TJS-additionalProperties false
*/
export interface QuestionnaireTaskSpec extends QuestionnaireTaskBaseSpec, BaseTaskSpec {}