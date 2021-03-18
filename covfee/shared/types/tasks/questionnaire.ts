import { BaseTaskSpec } from '../task'
import {CascaderProps, CheckboxOptionType, CheckboxProps, InputProps, RadioGroupProps, SliderSingleProps} from 'antd'
import { CheckboxGroupProps, CheckboxValueType } from 'antd/lib/checkbox/Group'
import {
    Cascader,
    Checkbox,
    DatePicker,
    Input,
    InputNumber,
    Radio,
    Rate,
    Select,
    Slider,
    Switch,
    TimePicker,
    TreeSelect} from 'antd'
import { SiderProps } from 'antd/lib/layout'

export type CascaderSpec = {
    inputType: 'Cascader'
    // TODO: complete spec
}

export type CheckboxSpec = { inputType: 'Checkbox' } & Pick<CheckboxProps, 
    "autoFocus" | "defaultChecked">

export type CheckboxGroupSpec = { inputType: 'Checkbox.Group' } & Pick<CheckboxGroupProps, 
    "options" | "defaultValue">

export type InputFieldSpec = { inputType: 'Input' } & Pick<InputProps, 
    "type" | "allowClear" | "bordered" | "defaultValue" | "maxLength" | "size">

export type RadioSpec = { inputType: 'Radio.Group' } & Pick<RadioGroupProps, 
    "options" | "optionType" | "defaultValue" | "buttonStyle" | "size">

export type SliderSpec = { inputType: 'Slider' } & Pick<SliderSingleProps, 
    "autoFocus" | "defaultValue" | "dots" | "included" | "marks" | "max" | "min" | "range" | "reverse" | "step" | "tooltipPlacement" | "tooltipVisible" | "vertical">

export type InputSpec = CascaderSpec | CheckboxSpec | CheckboxGroupSpec | InputFieldSpec | RadioSpec

export interface FieldSpec {
    prompt: string
    input: InputSpec
}

export interface FormSpec {
    fields: Array<FieldSpec>
}

export interface Spec extends BaseTaskSpec {
    /**
     * Specification of the form to be created.
     */
    form: FormSpec
    /**
     * If true, the form will only become active after the media playback ends
     */
    disabledUntilEnd?: boolean
}