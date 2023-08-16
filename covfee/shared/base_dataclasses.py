from typing import Any, List, Union

from statham.schema.constants import Maybe
from statham.schema.elements import (
    AllOf,
    AnyOf,
    Array,
    Boolean,
    Element,
    Number,
    Object,
    OneOf,
    String,
)
from statham.schema.property import Property


class BasicAudio(Object, additionalProperties=False):
    """Identifies a single audio file"""

    type: str = Property(String(default="audio", enum=["audio"]), required=True)

    url: str = Property(String(description="URL to hosted video file"), required=True)


a = BasicAudio()


class BasicVideo(Object, additionalProperties=False):
    """Identifies a single video file"""

    canMute: Maybe[bool] = Property(
        Boolean(description="User is able to mute the video")
    )

    fps: Maybe[float] = Property(
        Number(
            description="Frames per second of the video file.\nSome tasks use it to collect data once per frame."
        )
    )

    muted: Maybe[bool] = Property(
        Boolean(description="Video should be played without audio")
    )

    speed: Maybe[float] = Property(
        Number(
            description="Speed of the video in multiples of real time (1x)\n0 will allow the user to change speed (starting at 1x)"
        )
    )

    type: str = Property(String(default="video", enum=["video"]), required=True)

    url: str = Property(String(description="URL to hosted video file"), required=True)


class CheckboxGroupOption(Object):
    label: str = Property(String(), required=True)

    value: Union[str, float] = Property(AnyOf(String(), Number()), required=True)


class CheckboxGroupSpec(Object, additionalProperties=False):
    """Props for the antd checkbox group"""

    defaultValue: Maybe[List[str]] = Property(Array(String()))

    inputType: str = Property(
        String(default="Checkbox.Group", enum=["Checkbox.Group"]), required=True
    )

    options: List[CheckboxGroupOption] = Property(
        Array(CheckboxGroupOption), required=True
    )


class ContinuousMousemoveInputSpec(Object, additionalProperties=False):
    bounds: List[Any] = Property(
        Array(
            [Number(), Number()],
            default=[0, 1],
            minItems=2,
            maxItems=2,
            description="Range of the continuous values",
        )
    )

    mode: str = Property(
        String(default="continuous-mousemove", enum=["continuous-mousemove"]),
        required=True,
    )


class ContinuousValueControls(Object):
    down: str = Property(String(default="a", description="Decrease intensity"))

    up: str = Property(String(default="s", description="Increase intensity"))


class ContinuousKeyboardInputSpec(Object, additionalProperties=False):
    bounds: List[Any] = Property(
        Array(
            [Number(), Number()],
            default=[0, 1],
            minItems=2,
            maxItems=2,
            description="Range of the continuous values",
        )
    )

    controls: Maybe[ContinuousValueControls] = Property(ContinuousValueControls)

    mode: str = Property(
        String(default="continuous-keyboard", enum=["continuous-keyboard"]),
        required=True,
    )


class GtraceInputSpec(Object, additionalProperties=False):
    bounds: List[Any] = Property(
        Array(
            [Number(), Number()],
            default=None,
            minItems=2,
            maxItems=2,
            description="Range of the continuous values",
        )
    )

    controls: Maybe[ContinuousValueControls] = Property(ContinuousValueControls)

    mode: str = Property(String(default="gtrace", enum=["gtrace"]), required=True)


class InputFieldSpec(Object, additionalProperties=False):
    """Props for the antd input field"""

    allowClear: Maybe[bool] = Property(Boolean())

    bordered: Maybe[bool] = Property(Boolean())

    defaultValue: Maybe[str] = Property(String())

    inputType: str = Property(String(default="Input", enum=["Input"]), required=True)

    maxLength: Maybe[float] = Property(Number())

    minLength: Maybe[float] = Property(Number())

    size: Maybe[str] = Property(String(enum=["large", "middle", "small"]))

    type: Maybe[str] = Property(
        String(
            enum=[
                "checkbox",
                "color",
                "date",
                "datetime-local",
                "email",
                "month",
                "number",
                "password",
                "radio",
                "range",
                "string",
                "tel",
                "text",
                "time",
                "url",
                "week",
            ]
        )
    )


class InputNumberSpec(Object, additionalProperties=False):
    """Props for the antd input number field"""

    controls: Maybe[bool] = Property(Boolean())

    decimalSeparator: Maybe[str] = Property(String())

    defaultValue: Maybe[float] = Property(Number())

    inputType: str = Property(
        String(default="InputNumber", enum=["InputNumber"]), required=True
    )

    max: Maybe[float] = Property(Number())

    min: Maybe[float] = Property(Number())

    precision: Maybe[float] = Property(Number())

    size: Maybe[str] = Property(String(enum=["large", "middle", "small"]))

    step: Maybe[float] = Property(Number())


class JourneyInterfaceSpec(Object):
    showProgress: Maybe[bool] = Property(
        Boolean(
            description="Display a bar indicating progress as fraction of completed tasks"
        )
    )

    showSubmitButton: Maybe[bool] = Property(
        Boolean(description="Show the button to submit the HIT")
    )


class JourneySpec(Object):
    interface: Maybe[JourneyInterfaceSpec] = Property(JourneyInterfaceSpec)

    nodes: List[float] = Property(
        Array(
            Number(), description="path followed by the journey, as a list of node IDs"
        ),
        required=True,
    )


class MarkdownContentLinkSpec(Object, additionalProperties=False):
    """Supplied is a link to a Markdown/HTML file."""

    type: str = Property(String(default="link", enum=["link"]), required=True)

    url: str = Property(
        String(description="A url pointing to a valid Markdown/HTML file."),
        required=True,
    )


class MarkdownContentRawSpec(Object, additionalProperties=False):
    """Props for raw Markdown/HTML data"""

    content: str = Property(
        String(description="A valid Markdown/HTML string"), required=True
    )

    type: str = Property(String(default="raw", enum=["raw"]), required=True)


class OpencvFlowPlayerMedia(Object):
    canMute: Maybe[bool] = Property(
        Boolean(description="User is able to mute the video")
    )

    fps: float = Property(
        Number(
            description="Video fps. Required to obtain frame number from time (since frame number is not directly accesible in browsers)."
        ),
        required=True,
    )

    hasFlow: Maybe[bool] = Property(
        Boolean(
            description="If true, the video file is assumed to include an optical flow video stacked horizontally, such that:\n- the left half of the video contains the video to be displayed\n- the right half of the video contains the optical flow video (hidden)"
        )
    )

    muted: Maybe[bool] = Property(
        Boolean(description="Video should be played without audio")
    )

    resolution: List[Any] = Property(
        Array(
            [Number(), Number()], minItems=2, maxItems=2, description="Video resolution"
        ),
        required=True,
    )

    speed: Maybe[float] = Property(
        Number(
            description="Speed of the video in multiples of real time (1x)\n0 will allow the user to change speed (starting at 1x)"
        )
    )

    type: str = Property(String(default="video", enum=["video"]), required=True)

    url: str = Property(String(description="URL to hosted video file"), required=True)


class RankTraceInputSpec(Object, additionalProperties=False):
    bounds: List[Any] = Property(
        Array(
            [Number(), Number()],
            default=None,
            minItems=2,
            maxItems=2,
            description="Range of the continuous values",
        )
    )

    controls: Maybe[ContinuousValueControls] = Property(ContinuousValueControls)

    mode: str = Property(String(default="ranktrace", enum=["ranktrace"]), required=True)


class RankTraceNewInputSpec(Object, additionalProperties=False):
    bounds: List[Any] = Property(
        Array(
            [Number(), Number()],
            default=None,
            minItems=2,
            maxItems=2,
            description="Range of the continuous values",
        )
    )

    controls: Maybe[ContinuousValueControls] = Property(ContinuousValueControls)

    mode: str = Property(
        String(default="ranktrace-new", enum=["ranktrace-new"]), required=True
    )


class TextareaSpec(Object, additionalProperties=False):
    """Props for the antd textarea field"""

    allowClear: Maybe[bool] = Property(
        Boolean(description="Allows the content to be cleared via clear icon")
    )

    autoSize: Maybe[bool] = Property(
        Boolean(description="Adjusts height based on content")
    )

    bordered: Maybe[bool] = Property(
        Boolean(description="If true, adds a border style")
    )

    defaultValue: Maybe[str] = Property(String(description="Initial content"))

    inputType: str = Property(
        String(default="Input.TextArea", enum=["Input.TextArea"]), required=True
    )

    maxLength: Maybe[float] = Property(
        Number(description="Max length of content (in chars)")
    )

    showCount: Maybe[bool] = Property(
        Boolean(description="If true, shows the char count")
    )


class CompletionInfo(Object):
    completionCode: Maybe[str] = Property(
        String(
            description="Completion code to give back to participants. Used for crowdsourcing in eg. Prolific"
        )
    )

    redirectName: Maybe[str] = Property(
        String(description="Name/label of the website to redirect to")
    )

    redirectUrl: Maybe[str] = Property(
        String(
            description="Redirect URL. URL to redirect participants to after completing the HIT."
        )
    )


class StartItem0(Object):
    datetime: str = Property(String(), required=True)

    type: str = Property(String(enum=["moment"]), required=True)


class StartItem1(Object):
    type: str = Property(String(enum=["all_journeys"]), required=True)


class StartItem2(Object):
    n: float = Property(Number(), required=True)

    type: str = Property(String(enum=["n_journeys"]), required=True)


class StopItem0(Object):
    datetime: str = Property(String(), required=True)

    type: str = Property(String(enum=["moment"]), required=True)


class StopItem1(Object):
    seconds: float = Property(Number(), required=True)

    type: str = Property(String(enum=["timer"]), required=True)


class BaseNodeSpec(Object, additionalProperties=False):
    instructions: Maybe[str] = Property(
        String(description="Instructions to be displayed for the node")
    )

    instructions_type: str = Property(
        String(
            default="'default'",
            enum=["default", "popped"],
            description="How the instructions will be displayed",
        )
    )

    max_submissions: float = Property(
        Number(
            default=0,
            description="Maximum number of submissions a user can make for the task.",
        )
    )

    name: str = Property(String(), required=True)

    prerequisite: bool = Property(
        Boolean(
            default="False",
            description="Node is marked as a prerrequisite\nPrerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.",
        )
    )

    required: bool = Property(
        Boolean(
            default="True",
            description="If true, this node must have a valid submission before the HIT can be submitted",
        )
    )

    start: Maybe[List[Union[StartItem0, StartItem1, StartItem2]]] = Property(
        Array(AnyOf(StartItem0, StartItem1, StartItem2))
    )

    stop: Maybe[List[Union[StopItem0, StopItem1]]] = Property(
        Array(AnyOf(StopItem0, StopItem1))
    )

    useSharedState: Maybe[bool] = Property(Boolean())


class IncrementCounterTaskSpec(Object, additionalProperties=False):
    instructions: Maybe[str] = Property(
        String(description="Instructions to be displayed for the node")
    )

    instructions_type: str = Property(
        String(
            default="'default'",
            enum=["default", "popped"],
            description="How the instructions will be displayed",
        )
    )

    max_submissions: float = Property(
        Number(
            default=0,
            description="Maximum number of submissions a user can make for the task.",
        )
    )

    name: str = Property(String(), required=True)

    prerequisite: bool = Property(
        Boolean(
            default="False",
            description="Node is marked as a prerrequisite\nPrerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.",
        )
    )

    required: bool = Property(
        Boolean(
            default="True",
            description="If true, this node must have a valid submission before the HIT can be submitted",
        )
    )

    start: Maybe[List[Union[StartItem0, StartItem1, StartItem2]]] = Property(
        Array(AnyOf(StartItem0, StartItem1, StartItem2))
    )

    stop: Maybe[List[Union[StopItem0, StopItem1]]] = Property(
        Array(AnyOf(StopItem0, StopItem1))
    )

    type: str = Property(
        String(default="IncrementCounterTask", enum=["IncrementCounterTask"]),
        required=True,
    )

    useSharedState: Maybe[bool] = Property(Boolean())


class Controls(Object):
    """Button controls"""

    up: str = Property(String(default="a", description="Activate"))


class BinaryInputSpec(Object, additionalProperties=False):
    controls: Maybe[Controls] = Property(Controls)

    mode: str = Property(String(default="binary", enum=["binary"]), required=True)


class Controls_1(Object):
    """sets the input button controls for the task"""

    back10s: Maybe[str] = Property(String())

    back2s: Maybe[str] = Property(String())

    play_pause: Maybe[str] = Property(String(), source="play-pause")


class Controls_2(Object):
    up: str = Property(String(default="a", description="Increase intensity"))


class GravityKeyboardInputSpec(Object, additionalProperties=False):
    acceleration_constant: float = Property(
        Number(default=0.0025, description="Acceleration constant.")
    )

    bounds: List[Any] = Property(
        Array(
            [Number(), Number()],
            default=[0, 1],
            minItems=2,
            maxItems=2,
            description="Range of the continuous values",
        )
    )

    controls: Maybe[Controls_2] = Property(Controls_2)

    jump_speed: float = Property(
        Number(default=0.1, description="Initial speed when a key is pressed")
    )

    mode: str = Property(
        String(default="gravity-keyboard", enum=["gravity-keyboard"]), required=True
    )


class Continuous1DTaskSpec(Object, additionalProperties=False):
    controls: Maybe[Controls_1] = Property(Controls_1)

    instructions: Maybe[str] = Property(
        String(description="Instructions to be displayed for the node")
    )

    instructions_type: str = Property(
        String(
            default="'default'",
            enum=["default", "popped"],
            description="How the instructions will be displayed",
        )
    )

    intensityInput: Union[
        BinaryInputSpec,
        ContinuousMousemoveInputSpec,
        GravityKeyboardInputSpec,
        ContinuousKeyboardInputSpec,
        RankTraceInputSpec,
        RankTraceNewInputSpec,
        GtraceInputSpec,
    ] = Property(
        AllOf(
            Element(required=["mode"], description="sets the type of intensity input"),
            OneOf(
                BinaryInputSpec,
                ContinuousMousemoveInputSpec,
                GravityKeyboardInputSpec,
                ContinuousKeyboardInputSpec,
                RankTraceInputSpec,
                RankTraceNewInputSpec,
                GtraceInputSpec,
            ),
        ),
        required=True,
    )

    max_submissions: float = Property(
        Number(
            default=0,
            description="Maximum number of submissions a user can make for the task.",
        )
    )

    media: BasicVideo = Property(BasicVideo, required=True)

    name: str = Property(String(), required=True)

    prerequisite: bool = Property(
        Boolean(
            default="False",
            description="Node is marked as a prerrequisite\nPrerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.",
        )
    )

    required: bool = Property(
        Boolean(
            default="True",
            description="If true, this node must have a valid submission before the HIT can be submitted",
        )
    )

    showCountdown: Maybe[bool] = Property(
        Boolean(description="Enable player's countdown animation")
    )

    start: Maybe[List[Union[StartItem0, StartItem1, StartItem2]]] = Property(
        Array(AnyOf(StartItem0, StartItem1, StartItem2))
    )

    stop: Maybe[List[Union[StopItem0, StopItem1]]] = Property(
        Array(AnyOf(StopItem0, StopItem1))
    )

    type: str = Property(
        String(default="Continuous1DTask", enum=["Continuous1DTask"]), required=True
    )

    useRequestAnimationFrame: bool = Property(
        Boolean(
            default=False,
            description="Uses requestAnimationFrame as trigger for data reads.\nrequestAnimationFrame normally fires at close to 60Hz\nSetting to true can improve the quality for lower framerate media by capturing data points between frames.\nIf enabled, data annotations may not align with media frame times.",
        )
    )

    useSharedState: Maybe[bool] = Property(Boolean())


class Controls_3(Object):
    """sets the input button controls for the task"""

    back10s: Maybe[str] = Property(String(description="go back 10s in video time"))

    back2s: Maybe[str] = Property(String(description="go back 2s in video time"))

    play_pause: Maybe[str] = Property(
        String(description="toggle play/pause"), source="play-pause"
    )

    speed_down: Maybe[str] = Property(
        String(description="slow down video playback"), source="speed-down"
    )

    speed_up: str = Property(
        String(description="speed up video playback"), required=True, source="speed-up"
    )

    toggle_occluded: Maybe[str] = Property(
        String(description="toggle the occlusion flag (for occluded objects/parts)"),
        source="toggle-occluded",
    )

    toggle_of: Maybe[str] = Property(
        String(description="toggle the optical-flow-based speed adjustment"),
        source="toggle-of",
    )


class ContinuousKeypointTaskSpec(Object, additionalProperties=False):
    controls: Maybe[Controls_3] = Property(Controls_3)

    instructions: Maybe[str] = Property(
        String(description="Instructions to be displayed for the node")
    )

    instructions_type: str = Property(
        String(
            default="'default'",
            enum=["default", "popped"],
            description="How the instructions will be displayed",
        )
    )

    max_submissions: float = Property(
        Number(
            default=0,
            description="Maximum number of submissions a user can make for the task.",
        )
    )

    media: OpencvFlowPlayerMedia = Property(OpencvFlowPlayerMedia, required=True)

    name: str = Property(String(), required=True)

    prerequisite: bool = Property(
        Boolean(
            default="False",
            description="Node is marked as a prerrequisite\nPrerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.",
        )
    )

    required: bool = Property(
        Boolean(
            default="True",
            description="If true, this node must have a valid submission before the HIT can be submitted",
        )
    )

    start: Maybe[List[Union[StartItem0, StartItem1, StartItem2]]] = Property(
        Array(AnyOf(StartItem0, StartItem1, StartItem2))
    )

    stop: Maybe[List[Union[StopItem0, StopItem1]]] = Property(
        Array(AnyOf(StopItem0, StopItem1))
    )

    type: str = Property(
        String(default="ContinuousKeypointTask", enum=["ContinuousKeypointTask"]),
        required=True,
    )

    useSharedState: Maybe[bool] = Property(Boolean())


class Input0(Object, additionalProperties=False):
    checkedChildren: Maybe[str] = Property(
        String(description="The text to be shown when the state is checked")
    )

    defaultChecked: bool = Property(Boolean(default=False, description="Initial state"))

    inputType: str = Property(String(default="Switch", enum=["Switch"]), required=True)

    size: str = Property(
        String(
            default="default",
            enum=["default", "small"],
            description="The size of the Switch",
        )
    )

    unCheckedChildren: Maybe[str] = Property(
        String(description="The text to be shown when the state is unchecked")
    )


class Input1(Object, additionalProperties=False):
    allowClear: bool = Property(
        Boolean(default=True, description="Whether to allow clear when click again")
    )

    allowHalf: bool = Property(
        Boolean(default=False, description="Allow selection of a half-start")
    )

    character: str = Property(
        String(
            default="StarFilled", description="Custom character to use in place of star"
        )
    )

    count: float = Property(
        Number(default=5, description="Number of characters (default: 5)")
    )

    defaultValue: float = Property(
        Number(default=0, description="Default value selected")
    )

    inputType: str = Property(String(default="Rate", enum=["Rate"]), required=True)

    tooltips: Maybe[List[str]] = Property(
        Array(String(), description="Customize tooltip for each character")
    )


class Input2(Object, additionalProperties=False):
    allowClear: bool = Property(Boolean(default=False, description="Show clear button"))

    autoClearSearchValue: bool = Property(
        Boolean(
            default=True,
            description="Whether the current search will be cleared on selecting an item. Only applies when mode is set to multiple or tags",
        )
    )

    bordered: bool = Property(Boolean(default=True, description="Adds border style"))

    defaultActiveFirstOption: bool = Property(
        Boolean(default=True, description="Whether active first option by default")
    )

    defaultOpen: Maybe[bool] = Property(
        Boolean(description="Initial open state of dropdown")
    )

    defaultValue: Maybe[Union[List[str], List[float], Union[str, float]]] = Property(
        AllOf(
            Element(description="Initial selected option"),
            AnyOf(Array(String()), Array(Number()), AnyOf(String(), Number())),
        )
    )

    filterOption: bool = Property(
        Boolean(default=True, description="If true, filter options by input")
    )

    inputType: str = Property(String(default="Select", enum=["Select"]), required=True)

    labelInValue: bool = Property(
        Boolean(
            default=False,
            description="Whether to embed label in value, turn the format of value from string to { value: string, label: ReactNode }",
        )
    )

    listHeight: float = Property(Number(default=256, description="Config popup height"))

    maxTagCount: Maybe[Union[str, float]] = Property(
        AllOf(
            Element(
                description="Max tag count to show. responsive will cost render performance"
            ),
            AnyOf(String(enum=["responsive"]), Number()),
        )
    )

    maxTagTextLength: Maybe[float] = Property(
        Number(description="Max tag text length to show")
    )

    mode: Maybe[str] = Property(
        String(enum=["multiple", "tags"], description="Set mode of Select")
    )

    optionFilterProp: str = Property(
        String(
            default="value",
            description="Which prop value of option will be used for filter if filterOption is true. If options is set, it should be set to label",
        )
    )

    optionLabelProp: str = Property(
        String(
            default="children",
            description="Which prop value of option will render as content of select",
        )
    )

    options: Any = Property(Element(description="Select options."), required=True)

    showArrow: Maybe[bool] = Property(
        Boolean(description="Whether to show the drop-down arrow")
    )

    showSearch: bool = Property(
        Boolean(default=False, description="Whether show search input in single mode")
    )

    size: str = Property(
        String(
            default="middle",
            enum=["large", "middle", "small"],
            description="Size of Select input",
        )
    )

    tokenSeparators: Maybe[List[str]] = Property(
        Array(
            String(), description="Separator used to tokenize on tag and multiple mode"
        )
    )

    virtual: bool = Property(
        Boolean(default=True, description="Disable virtual scroll when set to false")
    )


class Options2Item(Object):
    disabled: Maybe[bool] = Property(Boolean())

    label: str = Property(String(), required=True)

    value: str = Property(String(), required=True)


class RadioSpec(Object, additionalProperties=False):
    """Props for the antd radio"""

    buttonStyle: Maybe[str] = Property(String(enum=["outline", "solid"]))

    defaultValue: Maybe[str] = Property(String())

    inputType: str = Property(
        String(default="Radio.Group", enum=["Radio.Group"]), required=True
    )

    optionType: Maybe[str] = Property(String(enum=["button", "default"]))

    options: Union[List[str], List[float], List[Options2Item]] = Property(
        AnyOf(Array(String()), Array(Number()), Array(Options2Item)), required=True
    )

    size: Maybe[str] = Property(String(enum=["large", "middle", "small"]))


class Marks(Object, default='{0: "0", 1: "1", 2: "2"}'):
    pass


class SliderSpec(Object, additionalProperties=False):
    """Props for the antd slider"""

    defaultValue: Maybe[float] = Property(Number(description="Initial slider value"))

    dots: Maybe[bool] = Property(
        Boolean(description="Whether the thumb can drag over tick only")
    )

    included: Maybe[bool] = Property(
        Boolean(
            description="Make effect when marks not null, true means containment and false means coordinative"
        )
    )

    inputType: str = Property(String(default="Slider", enum=["Slider"]), required=True)

    marks: Marks = Property(Marks)

    max: float = Property(
        Number(default=7, description="The maximum value the slider can slide to")
    )

    min: float = Property(
        Number(default=0, description="The minimum value the slider can slide to")
    )

    range: Maybe[bool] = Property(Boolean(description="Dual thumb mode"))

    step: float = Property(
        Number(
            default=1,
            description="The granularity the slider can step through values. Must greater than 0, and be divided by (max - min) . When marks no null, step can be null",
        )
    )

    tooltipPlacement: Maybe[str] = Property(
        String(
            enum=[
                "bottom",
                "bottomLeft",
                "bottomRight",
                "left",
                "leftBottom",
                "leftTop",
                "right",
                "rightBottom",
                "rightTop",
                "top",
                "topLeft",
                "topRight",
            ],
            description="Position of the tooltip",
        )
    )

    tooltipVisible: Maybe[bool] = Property(
        Boolean(
            description="If true, Tooltip will show always, or it will not show anyway, even if dragging or hovering"
        )
    )

    vertical: Maybe[bool] = Property(
        Boolean(description="If true, the slider will be vertical")
    )


class FieldSpecInputSpec(Object):
    condition: Maybe[str] = Property(
        String(
            description="If given the field will only be available when the condition is true"
        )
    )

    input: Union[
        Input0,
        Input1,
        Input2,
        CheckboxGroupSpec,
        InputFieldSpec,
        InputNumberSpec,
        TextareaSpec,
        RadioSpec,
        SliderSpec,
    ] = Property(
        AllOf(
            Element(
                required=["inputType"],
                description="input props for a single input element",
            ),
            OneOf(
                Input0,
                Input1,
                Input2,
                CheckboxGroupSpec,
                InputFieldSpec,
                InputNumberSpec,
                TextareaSpec,
                RadioSpec,
                SliderSpec,
            ),
        ),
        required=True,
    )

    label: str = Property(
        String(
            description="Label for the field.\nUsually displayed next to or on top of the field."
        ),
        required=True,
    )

    name: str = Property(
        String(
            description="Name of the field.\nThe results will refer to the field by this name."
        ),
        required=True,
    )

    required: Maybe[bool] = Property(
        Boolean(
            description="If true the field will be required to be filled before submission."
        )
    )

    tooltip: Maybe[str] = Property(
        String(description="Text for a tooltip with more information")
    )


class FormSpecInputSpec(Object):
    fields: List[FieldSpecInputSpec] = Property(
        Array(FieldSpecInputSpec, description="For field specification"), required=True
    )

    layout: Maybe[str] = Property(
        String(
            enum=["horizontal", "inline", "vertical"], description="Layout of the form"
        )
    )


class InstructionsTaskSpec(Object, additionalProperties=False):
    content: Union[MarkdownContentRawSpec, MarkdownContentLinkSpec] = Property(
        AllOf(
            Element(
                required=["type"],
                description="Main static content of the page (eg. consent terms, instructions)",
            ),
            OneOf(MarkdownContentRawSpec, MarkdownContentLinkSpec),
        ),
        required=True,
    )

    form: Maybe[FormSpecInputSpec] = Property(FormSpecInputSpec)

    instructions: Maybe[str] = Property(
        String(description="Instructions to be displayed for the node")
    )

    instructions_type: str = Property(
        String(
            default="'default'",
            enum=["default", "popped"],
            description="How the instructions will be displayed",
        )
    )

    max_submissions: float = Property(
        Number(
            default=0,
            description="Maximum number of submissions a user can make for the task.",
        )
    )

    name: str = Property(String(), required=True)

    prerequisite: bool = Property(
        Boolean(
            default="False",
            description="Node is marked as a prerrequisite\nPrerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.",
        )
    )

    required: bool = Property(
        Boolean(
            default="True",
            description="If true, this node must have a valid submission before the HIT can be submitted",
        )
    )

    start: Maybe[List[Union[StartItem0, StartItem1, StartItem2]]] = Property(
        Array(AnyOf(StartItem0, StartItem1, StartItem2))
    )

    stop: Maybe[List[Union[StopItem0, StopItem1]]] = Property(
        Array(AnyOf(StopItem0, StopItem1))
    )

    type: str = Property(
        String(default="InstructionsTask", enum=["InstructionsTask"]), required=True
    )

    useSharedState: Maybe[bool] = Property(Boolean())


class QuestionnaireTaskSpec(Object, additionalProperties=False):
    disabledUntilEnd: Maybe[bool] = Property(
        Boolean(
            description="If true, the form will only become active after the media playback ends"
        )
    )

    form: FormSpecInputSpec = Property(FormSpecInputSpec, required=True)

    media: Maybe[Union[BasicVideo, BasicAudio]] = Property(
        AllOf(
            Element(required=["type"], description="Media file to be displayed."),
            OneOf(BasicVideo, BasicAudio),
        )
    )

    type: str = Property(
        String(default="QuestionnaireTask", enum=["QuestionnaireTask"]), required=True
    )


class ThreeImagesTaskSpec(Object, additionalProperties=False):
    form: FormSpecInputSpec = Property(FormSpecInputSpec, required=True)

    images: List[Any] = Property(
        Array(
            [String(), String(), String()],
            minItems=3,
            maxItems=3,
            description="URLs to the 3 images to be displayed",
        ),
        required=True,
    )

    instructions: Maybe[str] = Property(
        String(description="Instructions to be displayed for the node")
    )

    instructions_type: str = Property(
        String(
            default="'default'",
            enum=["default", "popped"],
            description="How the instructions will be displayed",
        )
    )

    max_submissions: float = Property(
        Number(
            default=0,
            description="Maximum number of submissions a user can make for the task.",
        )
    )

    name: str = Property(String(), required=True)

    prerequisite: bool = Property(
        Boolean(
            default="False",
            description="Node is marked as a prerrequisite\nPrerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.",
        )
    )

    required: bool = Property(
        Boolean(
            default="True",
            description="If true, this node must have a valid submission before the HIT can be submitted",
        )
    )

    start: Maybe[List[Union[StartItem0, StartItem1, StartItem2]]] = Property(
        Array(AnyOf(StartItem0, StartItem1, StartItem2))
    )

    stop: Maybe[List[Union[StopItem0, StopItem1]]] = Property(
        Array(AnyOf(StopItem0, StopItem1))
    )

    text: Maybe[str] = Property(String(description="Text to display before the images"))

    type: str = Property(
        String(default="ThreeImagesTask", enum=["ThreeImagesTask"]), required=True
    )

    useSharedState: Maybe[bool] = Property(Boolean())


class HitSpec(Object, additionalProperties=False):
    config: Maybe[CompletionInfo] = Property(CompletionInfo)

    extra: Maybe[Union[MarkdownContentRawSpec, MarkdownContentLinkSpec]] = Property(
        AllOf(
            Element(
                required=["type"], description="Extra hit-level information to display"
            ),
            OneOf(MarkdownContentRawSpec, MarkdownContentLinkSpec),
        )
    )

    id: str = Property(String(description="unique ID of the hit"), required=True)

    journeys: JourneySpec = Property(JourneySpec, required=True)

    name: str = Property(String(description="HIT name (for display)"), required=True)

    nodes: List[
        Union[
            Continuous1DTaskSpec,
            ContinuousKeypointTaskSpec,
            InstructionsTaskSpec,
            QuestionnaireTaskSpec,
            ThreeImagesTaskSpec,
            IncrementCounterTaskSpec,
        ]
    ] = Property(
        Array(
            AllOf(
                Element(
                    required=["type"], description="One of the supported task specs"
                ),
                OneOf(
                    Continuous1DTaskSpec,
                    ContinuousKeypointTaskSpec,
                    InstructionsTaskSpec,
                    QuestionnaireTaskSpec,
                    ThreeImagesTaskSpec,
                    IncrementCounterTaskSpec,
                ),
            ),
            description="list of tasks in the HIT",
        ),
        required=True,
    )

    repeat: Maybe[float] = Property(
        Number(description="number of copies or instances of the HIT")
    )

    requireLogin: Maybe[bool] = Property(
        Boolean(
            description="If true, the user will be required to log in before starting the task"
        )
    )


class ProjectSpec(Object, additionalProperties=False):
    email: str = Property(
        String(description="email of the contact person for the project."),
        required=True,
    )

    hits: List[HitSpec] = Property(
        Array(
            HitSpec,
            description="List of HIT specifications, one for each Human Intelligence Task in this project.",
        ),
        required=True,
    )

    id: float = Property(Number(description="unique ID of the project"), required=True)

    name: str = Property(
        String(
            description="name of the project, used to identify it in the covfee interface."
        ),
        required=True,
    )
