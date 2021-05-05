import { CommonTaskSpec } from '../task'
import {CheckboxGroupSpec, FormSpec, InputFieldSpec, RadioSpec} from './questionnaire'
import {MarkdownContentSpec} from './utils'

type InputSpec = CheckboxGroupSpec | InputFieldSpec | RadioSpec

/**
* @TJS-additionalProperties false
*/
export interface InstructionsTaskBaseSpec {
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
    form?: FormSpec<InputSpec>
}

/**
* @TJS-additionalProperties false
*/
export interface InstructionsTaskSpec extends InstructionsTaskBaseSpec, CommonTaskSpec {}