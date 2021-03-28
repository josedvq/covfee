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
export type CheckboxSpec = Pick<CheckboxProps, "defaultChecked"> & { 
    /**
     * @default "Checkbox"
     */
    inputType: 'Checkbox' 
}

/**
* Props for the antd checkbox group
* @title checkbox-group
*/
export type CheckboxGroupSpec = { 
    /**
     * @default "Checkbox.Group"
     */
    inputType: 'Checkbox.Group' 
    options: Array<string>
    defaultValue: Array<string>
}

/**
* Props for the antd input field
* @title input
*/
export type InputFieldSpec = Pick<InputProps, "type" | "allowClear" | "bordered" | "defaultValue" | "maxLength" | "size"> &
{
    /**
     * @default "Input"
     */
    inputType: 'Input' 
}

/**
* Props for the antd radio
* @title radio
*/
export type RadioSpec = Pick<RadioGroupProps, "optionType" | "buttonStyle" | "size"> &
{ 
    /**
     * @default "Radio.Group"
     */
    inputType: 'Radio.Group'
    options: Array<string>
    defaultValue?: string
}

/**
* Props for the antd slider
* @title slider
*/
export type SliderSpec = Pick<SliderSingleProps, "autoFocus" | "defaultValue" | "dots" | "included" | "range" | "reverse" | "tooltipPlacement" | "tooltipVisible" | "vertical"> &
{ 
    /**
     * The maximum value the slider can slide to
     * @default 7
     */
    max: number
    /**
     * The minimum value the slider can slide to
     * @default 0
     */
    min: number
    /**
     * The granularity the slider can step through values. Must greater than 0, and be divided by (max - min) . When marks no null, step can be null
     * @default 1
     */
    step: number
    /**
     * @default "Slider"
     */
    inputType: 'Slider'
    /**
     * @default {0: "0", 1: "1", 2: "2"}
     */
    marks: {[key: number]: {
        label: string | number
    }}
}


export type InputSpec = CheckboxSpec | CheckboxGroupSpec | InputFieldSpec | RadioSpec | SliderSpec

export interface FieldSpec {
    prompt: string
    input: InputSpec
}

export interface FormSpec {
    fields: Array<FieldSpec>
}

export interface QuestionnaireTaskSpec extends BaseTaskSpec {
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