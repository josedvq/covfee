import { BaseTaskSpec } from '../task'
import {CheckboxSpec, FormSpec, InputFieldSpec, RadioSpec} from './questionnaire'

type InputSpec = CheckboxSpec | InputFieldSpec | RadioSpec
export interface InstructionsTaskSpec extends BaseTaskSpec {
    /**
     * @default "InstructionsTask"
     */
    type: 'InstructionsTask'
    /**
    * A text or Markdown/HTML string containing the experiment instructions.
    */
    content?: string
    /**
    * a form to display after the content.
    */
    form?: FormSpec
}