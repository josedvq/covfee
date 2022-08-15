export type SwitchSpec = {
    /**
     * @default "Switch"
     */
    inputType: 'Switch'
    /**
     * Initial state
     * @default false
     */
    defaultChecked?: boolean
    /**
     * 	The size of the Switch
     * @default "default"
     */
    size?: 'default' | 'small'
    /**
     * The text to be shown when the state is checked
     */
    checkedChildren?: string
    /**
     * 	The text to be shown when the state is unchecked
     */
    unCheckedChildren?: string
}

export type RateSpec = {
    /**
     * @default "Rate"
     */
     inputType: 'Rate'
    /**
     * Whether to allow clear when click again
     * @default true
     */
    allowClear?: boolean
    /**
     * Allow selection of a half-start
     * @default false
     */
    allowHalf?: boolean
    /**
     * Custom character to use in place of star
     * @default "StarFilled"
     */
    character?: string
    /**
     * Number of characters (default: 5)
     * @default 5
     */
    count?: number
    /**
     * Default value selected
     * @default 0
     */
    defaultValue?: number
    /**
     * Customize tooltip for each character
     */
    tooltips?: string[]
}

export type SelectSpec = {
    /**
     * @default "Select"
     */
     inputType: 'Select'
    /**
     * Show clear button
     * @default false
     */
    allowClear?: boolean
    /**
     * Whether the current search will be cleared on selecting an item. Only applies when mode is set to multiple or tags
     * @default true
     */
    autoClearSearchValue?: boolean
    /**
     * Adds border style
     * @default true
     */
    bordered?: boolean
    /**
     * Whether active first option by default
     * @default true
     */
    defaultActiveFirstOption?: boolean
    /**
     * Initial open state of dropdown
     */
    defaultOpen?: boolean
    /**
     * 	Initial selected option
     */
    defaultValue?: string | string[] | number | number[]
    /**
     * If true, filter options by input
     * @default true
     */
    filterOption?: boolean
    /**
     * Whether to embed label in value, turn the format of value from string to { value: string, label: ReactNode }
     * @default false
     */
    labelInValue?: boolean
    /**
     * Config popup height
     * @default 256
     */
    listHeight?: number
    /**
     * 	Max tag count to show. responsive will cost render performance
     */
    maxTagCount?: number | 'responsive'
    /**
     * Max tag text length to show
     */
    maxTagTextLength?: number
    /**
     * 	Set mode of Select
     */
    mode?: 'multiple' | 'tags'
    /**
     * Which prop value of option will be used for filter if filterOption is true. If options is set, it should be set to label
     * @default "value"
     */
    optionFilterProp?: string
    /**
     * Which prop value of option will render as content of select
     * @default "children"
     */
    optionLabelProp?: string
    /**
     * Select options.
     */
    options: any
    /**
     * Whether to show the drop-down arrow
     */
    showArrow?: boolean
    /**
     * Whether show search input in single mode
     * @default false
     */
    showSearch?: boolean
    /**
     * Size of Select input
     * @default "middle"
     */
    size?: 'large' | 'middle' | 'small'
    /**
     * Separator used to tokenize on tag and multiple mode
     */
    tokenSeparators?: string[]
    /**
     * Disable virtual scroll when set to false
     * @default true
     */
    virtual?: boolean
}

export type CascaderSpec = {
    /**
     * @default "Cascader"
     */
    inputType: 'Cascader'
    // TODO: complete spec
}

export interface CheckboxGroupOption {
    label: string
    value: string | number
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
    options: Array<CheckboxGroupOption>
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
* Props for the antd input number field
* @title input-number
*/
export interface InputNumberSpec { // TODO: extend with more properties from inputHTML
    /**
     * @default "InputNumber"
     */
    inputType: 'InputNumber',
    size?: 'small' | 'middle' | 'large'
    controls?: boolean,
    decimalSeparator?: string,
    defaultValue?: number,
    max?: number,
    min?: number,
    step?: number,
    precision?: number
}

/**
* Props for the antd textarea field
* @title textarea
*/
export interface TextareaSpec { // TODO: extend with more properties from inputHTML
    /**
     * @default "Input.TextArea"
     */
    inputType: 'Input.TextArea',
    /**
     * Allows the content to be cleared via clear icon
     */
    allowClear?: boolean,
    /**
     * Adjusts height based on content
     */
    autoSize?: boolean
    /**
     * If true, adds a border style
     */
    bordered?: boolean
    /**
     * Initial content
     */
    defaultValue?: string
    /**
     * Max length of content (in chars)
     */
    maxLength?: number
    /**
     * If true, shows the char count
     */
    showCount?: boolean
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
    marks?: object
    /**
     * Make effect when marks not null, true means containment and false means coordinative
     */
    included?: boolean
    /**
     * If true, Tooltip will show always, or it will not show anyway, even if dragging or hovering
     */
    tooltipVisible?: boolean
    /**
     * Position of the tooltip
     */
    tooltipPlacement?: 'top' | 'left' | 'right' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom'
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


export type InputSpec = SwitchSpec | SelectSpec | RateSpec | CheckboxGroupSpec | InputFieldSpec | InputNumberSpec | TextareaSpec | RadioSpec | SliderSpec

export interface FieldSpec<T> {
    /**
     * Name of the field.
     * The results will refer to the field by this name.
     */
    name: string
    /**
     * Label for the field.
     * Usually displayed next to or on top of the field.
     */
    label: string
    /**
     * Text for a tooltip with more information
     */
    tooltip?: string
    /**
     * input props for a single input element
     */
    input: T
    /**
     * If true the field will be required to be filled before submission.
     */
    required?: boolean
    /**
     * If given the field will only be available when the condition is true
     */
    condition?: string
}

export interface FormSpec<T> {
    /**
     * Layout of the form
     */
    layout?: 'horizontal' | 'vertical' | 'inline'
    /**
     * For field specification
     */
    fields: Array<FieldSpec<T>>
}