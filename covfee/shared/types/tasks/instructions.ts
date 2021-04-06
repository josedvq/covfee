import { BaseTaskSpec } from '../task'
import {CheckboxSpec, FormSpec, InputFieldSpec, RadioSpec} from './questionnaire'
import {MarkdownContentSpec} from './utils'

type InputSpec = CheckboxSpec | InputFieldSpec | RadioSpec

/**
* @TJS-additionalProperties false
*/
export interface InstructionsTaskSpec extends BaseTaskSpec {
    /**
     * @default "InstructionsTask"
     */
    type: 'InstructionsTask'
    /**
     * Main static content of the page (eg. consent terms, instructions)
     */
    content: MarkdownContentSpec
    /**
    * a form to display after the content.
    */
    form?: FormSpec
}