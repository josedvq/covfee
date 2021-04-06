import { BaseTaskSpec } from '../task'
import {CheckboxProps, InputProps, RadioGroupProps, SliderSingleProps} from 'antd'
import { WavesurferPlayerMedia } from '../players/wavesurfer'
import { VideojsPlayerMedia } from 'types/players/videojs'


export type CascaderSpec = {
    /**
     * @default "Cascader"
     */
    inputType: 'Cascader'
    // TODO: complete spec
}

/**
 * Props for the antd checkbox
 * @title checkbox
 */
export interface CheckboxSpec { 
    /**
     * @default "Checkbox"
     */
    inputType: 'Checkbox' 
    /**
     * 
     */
     defaultChecked?: boolean
}

/**
* Props for the antd checkbox group
* @title checkbox-group
*/
export interface CheckboxGroupSpec { 
    /**
     * @default "Checkbox.Group"
     */
    inputType: 'Checkbox.Group' 
    options: Array<string>
    defaultValue?: Array<string>
}

/**
* Props for the antd input field
* @title input
*/
export interface InputFieldSpec { // TODO: extend with more properties from inputHTML
    /**
     * @default "Input"
     */
    inputType: 'Input',
    size?: 'small' | 'middle' | 'large'
    type?: 'checkbox' | 'color' | 'date' | 'datetime-local' | 'email' | 'month' | 'number' | 'password' | 'radio' | 'range' | 'tel' | 'text' | 'time' | 'url' | 'week' | 'string'
    allowClear?: boolean,
    bordered?: boolean,
    defaultValue?: string,
    maxLength?: number,
    minLength?: number,
}

/**
* Props for the antd radio
* @title radio
*/
export interface RadioSpec
{ 
    /**
     * @default "Radio.Group"
     */
    inputType: 'Radio.Group'
    options: Array<string>
    size?: 'small' | 'middle' | 'large'
    optionType?: "default" | "button"
    buttonStyle?: "outline" | "solid"
    defaultValue?: string
}

/**
* Props for the antd slider
* @title slider
*/
export interface SliderSpec
{ 
    /**
     * @default "Slider"
     */
     inputType: 'Slider'
    /**
     * 	If true, the slider will be vertical
     */
    vertical?: boolean
    /**
     * The maximum value the slider can slide to
     * @default 7
     */
    max?: number
    /**
     * The minimum value the slider can slide to
     * @default 0
     */
    min?: number
    /**
     * The granularity the slider can step through values. Must greater than 0, and be divided by (max - min) . When marks no null, step can be null
     * @default 1
     */
    step?: number
    /**
     * @default {0: "0", 1: "1", 2: "2"}
     */
    marks?: {[key: number]: {
        label: string | number
    }}
    /**
     * Whether the thumb can drag over tick only
     */
    dots?: boolean
    /**
     * Initial slider value
     */
    defaultValue?: number
    /**
     * Dual thumb mode
     */
    range?: boolean
}


export type InputSpec = CheckboxSpec | CheckboxGroupSpec | InputFieldSpec | RadioSpec | SliderSpec

export interface FieldSpec {
    prompt: string
    input: InputSpec
}

export interface FormSpec {
    fields: Array<FieldSpec>
}

/**
* @TJS-additionalProperties false
*/
export interface QuestionnaireTaskSpec extends BaseTaskSpec {
    /**
     * @default "QuestionnaireTask"
     */
    type: 'QuestionnaireTask'
    /**
     * Media file to be displayed.
     */
    media: VideojsPlayerMedia | WavesurferPlayerMedia
    /**
     * Instructions to be displayed before the form
     */
    instructions: string
    /**
     * Specification of the form to be created.
     */
    form: FormSpec
    /**
     * If true, the form will only become active after the media playback ends
     */
    disabledUntilEnd?: boolean
}