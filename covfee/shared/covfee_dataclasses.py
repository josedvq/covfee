from dataclasses import dataclass
from typing import Any, List, Union, Optional, Literal


@dataclass
class BasicAudio():
    """Identifies a single audio file"""
    type: Literal["audio"] = "audio"
    '''
    URL to hosted video file
    '''
    url: str


@dataclass
class BasicVideo():
    """Identifies a single video file"""
    '''
    User is able to mute the video
    '''
    canMute: Optional[bool]
    '''
    Frames per second of the video file.
Some tasks use it to collect data once per frame.
    '''
    fps: Optional[float]
    '''
    Video should be played without audio
    '''
    muted: Optional[bool]
    '''
    Speed of the video in multiples of real time (1x)
0 will allow the user to change speed (starting at 1x)
    '''
    speed: Optional[float]
    type: Literal["video"] = "video"
    '''
    URL to hosted video file
    '''
    url: str


@dataclass
class CheckboxGroupOption():
    label: str
    value: Union[str, float]


@dataclass
class CheckboxGroupSpec():
    """Props for the antd checkbox group"""
    defaultValue: Optional[List[str]]
    inputType: Literal["Checkbox.Group"] = "Checkbox.Group"
    options: List[CheckboxGroupOption]


@dataclass
class ContinuousMousemoveInputSpec():
    '''
    Range of the continuous values
    '''
    bounds: List[Any] = ['0', '1']
    mode: Literal["continuous-mousemove"] = "continuous-mousemove"


@dataclass
class ContinuousValueControls():
    '''
    Decrease intensity
    '''
    down: str = "a"
    '''
    Increase intensity
    '''
    up: str = "s"


@dataclass
class ContinuousKeyboardInputSpec():
    '''
    Range of the continuous values
    '''
    bounds: List[Any] = ['0', '1']
    controls: Optional[ContinuousValueControls]
    mode: Literal["continuous-keyboard"] = "continuous-keyboard"


@dataclass
class GtraceInputSpec():
    '''
    Range of the continuous values
    '''
    bounds: List[Any]
    controls: Optional[ContinuousValueControls]
    mode: Literal["gtrace"] = "gtrace"


@dataclass
class InputFieldSpec():
    """Props for the antd input field"""
    allowClear: Optional[bool]
    bordered: Optional[bool]
    defaultValue: Optional[str]
    inputType: Literal["Input"] = "Input"
    maxLength: Optional[float]
    minLength: Optional[float]
    size: Optional[Literal["large","middle","small"]]
    type: Optional[Literal["checkbox","color","date","datetime-local","email","month","number","password","radio","range","string","tel","text","time","url","week"]]


@dataclass
class InputNumberSpec():
    """Props for the antd input number field"""
    controls: Optional[bool]
    decimalSeparator: Optional[str]
    defaultValue: Optional[float]
    inputType: Literal["InputNumber"] = "InputNumber"
    max: Optional[float]
    min: Optional[float]
    precision: Optional[float]
    size: Optional[Literal["large","middle","small"]]
    step: Optional[float]


@dataclass
class JourneyInterfaceSpec():
    '''
    Display a bar indicating progress as fraction of completed tasks
    '''
    showProgress: Optional[bool]
    '''
    Show the button to submit the HIT
    '''
    showSubmitButton: Optional[bool]


@dataclass
class JourneySpec():
    interface: Optional[JourneyInterfaceSpec]
    '''
    path followed by the journey, as a list of node IDs
    '''
    nodes: List[float]


@dataclass
class MarkdownContentLinkSpec():
    """Supplied is a link to a Markdown/HTML file."""
    type: Literal["link"] = "link"
    '''
    A url pointing to a valid Markdown/HTML file.
    '''
    url: str


@dataclass
class MarkdownContentRawSpec():
    """Props for raw Markdown/HTML data"""
    '''
    A valid Markdown/HTML string
    '''
    content: str
    type: Literal["raw"] = "raw"


@dataclass
class OpencvFlowPlayerMedia():
    '''
    User is able to mute the video
    '''
    canMute: Optional[bool]
    '''
    Video fps. Required to obtain frame number from time (since frame number is not directly accesible in browsers).
    '''
    fps: float
    '''
    If true, the video file is assumed to include an optical flow video stacked horizontally, such that:
- the left half of the video contains the video to be displayed
- the right half of the video contains the optical flow video (hidden)
    '''
    hasFlow: Optional[bool]
    '''
    Video should be played without audio
    '''
    muted: Optional[bool]
    '''
    Video resolution
    '''
    resolution: List[Any]
    '''
    Speed of the video in multiples of real time (1x)
0 will allow the user to change speed (starting at 1x)
    '''
    speed: Optional[float]
    type: Literal["video"] = "video"
    '''
    URL to hosted video file
    '''
    url: str


@dataclass
class RankTraceInputSpec():
    '''
    Range of the continuous values
    '''
    bounds: List[Any]
    controls: Optional[ContinuousValueControls]
    mode: Literal["ranktrace"] = "ranktrace"


@dataclass
class RankTraceNewInputSpec():
    '''
    Range of the continuous values
    '''
    bounds: List[Any]
    controls: Optional[ContinuousValueControls]
    mode: Literal["ranktrace-new"] = "ranktrace-new"


@dataclass
class TextareaSpec():
    """Props for the antd textarea field"""
    '''
    Allows the content to be cleared via clear icon
    '''
    allowClear: Optional[bool]
    '''
    Adjusts height based on content
    '''
    autoSize: Optional[bool]
    '''
    If true, adds a border style
    '''
    bordered: Optional[bool]
    '''
    Initial content
    '''
    defaultValue: Optional[str]
    inputType: Literal["Input.TextArea"] = "Input.TextArea"
    '''
    Max length of content (in chars)
    '''
    maxLength: Optional[float]
    '''
    If true, shows the char count
    '''
    showCount: Optional[bool]


@dataclass
class CompletionInfo():
    '''
    Completion code to give back to participants. Used for crowdsourcing in eg. Prolific
    '''
    completionCode: Optional[str]
    '''
    Name/label of the website to redirect to
    '''
    redirectName: Optional[str]
    '''
    Redirect URL. URL to redirect participants to after completing the HIT.
    '''
    redirectUrl: Optional[str]


@dataclass
class StartItem0():
    datetime: str
    type: Literal["moment"]


@dataclass
class StartItem1():
    type: Literal["all_journeys"]


@dataclass
class StartItem2():
    n: float
    type: Literal["n_journeys"]


@dataclass
class StopItem0():
    datetime: str
    type: Literal["moment"]


@dataclass
class StopItem1():
    seconds: float
    type: Literal["timer"]


@dataclass
class BaseNodeSpec():
    '''
    Instructions to be displayed for the node
    '''
    instructions: Optional[str]
    '''
    How the instructions will be displayed
    '''
    instructions_type: Literal["default","popped"] = "'default'"
    '''
    Maximum number of submissions a user can make for the task.
    '''
    max_submissions: float = 0
    name: str
    '''
    Node is marked as a prerrequisite
Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
    '''
    prerequisite: bool = "False"
    '''
    If true, this node must have a valid submission before the HIT can be submitted
    '''
    required: bool = "True"
    start: Optional[List[Union[StartItem0, StartItem1, StartItem2]]]
    stop: Optional[List[Union[StopItem0, StopItem1]]]
    useSharedState: Optional[bool]


@dataclass
class IncrementCounterTaskSpec():
    '''
    Instructions to be displayed for the node
    '''
    instructions: Optional[str]
    '''
    How the instructions will be displayed
    '''
    instructions_type: Literal["default","popped"] = "'default'"
    '''
    Maximum number of submissions a user can make for the task.
    '''
    max_submissions: float = 0
    name: str
    '''
    Node is marked as a prerrequisite
Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
    '''
    prerequisite: bool = "False"
    '''
    If true, this node must have a valid submission before the HIT can be submitted
    '''
    required: bool = "True"
    start: Optional[List[Union[StartItem0, StartItem1, StartItem2]]]
    stop: Optional[List[Union[StopItem0, StopItem1]]]
    type: Literal["IncrementCounterTask"] = "IncrementCounterTask"
    useSharedState: Optional[bool]


@dataclass
class Controls():
    """Button controls"""
    '''
    Activate
    '''
    up: str = "a"


@dataclass
class BinaryInputSpec():
    '''
    Button controls
    '''
    controls: Optional[Controls]
    mode: Literal["binary"] = "binary"


@dataclass
class Controls_1():
    """sets the input button controls for the task"""
    back10s: Optional[str]
    back2s: Optional[str]
    play_pause: Optional[str]


@dataclass
class Controls_2():
    '''
    Increase intensity
    '''
    up: str = "a"


@dataclass
class GravityKeyboardInputSpec():
    '''
    Acceleration constant.
    '''
    acceleration_constant: float = 0.0025
    '''
    Range of the continuous values
    '''
    bounds: List[Any] = ['0', '1']
    controls: Optional[Controls_2]
    '''
    Initial speed when a key is pressed
    '''
    jump_speed: float = 0.1
    mode: Literal["gravity-keyboard"] = "gravity-keyboard"


@dataclass
class Continuous1DTaskSpec():
    '''
    sets the input button controls for the task
    '''
    controls: Optional[Controls_1]
    '''
    Instructions to be displayed for the node
    '''
    instructions: Optional[str]
    '''
    How the instructions will be displayed
    '''
    instructions_type: Literal["default","popped"] = "'default'"
    intensityInput: Union[BinaryInputSpec, ContinuousMousemoveInputSpec, GravityKeyboardInputSpec, ContinuousKeyboardInputSpec, RankTraceInputSpec, RankTraceNewInputSpec, GtraceInputSpec]
    '''
    Maximum number of submissions a user can make for the task.
    '''
    max_submissions: float = 0
    '''
    Identifies a single video file
    '''
    media: BasicVideo
    name: str
    '''
    Node is marked as a prerrequisite
Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
    '''
    prerequisite: bool = "False"
    '''
    If true, this node must have a valid submission before the HIT can be submitted
    '''
    required: bool = "True"
    '''
    Enable player's countdown animation
    '''
    showCountdown: Optional[bool]
    start: Optional[List[Union[StartItem0, StartItem1, StartItem2]]]
    stop: Optional[List[Union[StopItem0, StopItem1]]]
    type: Literal["Continuous1DTask"] = "Continuous1DTask"
    '''
    Uses requestAnimationFrame as trigger for data reads.
requestAnimationFrame normally fires at close to 60Hz
Setting to true can improve the quality for lower framerate media by capturing data points between frames.
If enabled, data annotations may not align with media frame times.
    '''
    useRequestAnimationFrame: bool = False
    useSharedState: Optional[bool]


@dataclass
class Controls_3():
    """sets the input button controls for the task"""
    '''
    go back 10s in video time
    '''
    back10s: Optional[str]
    '''
    go back 2s in video time
    '''
    back2s: Optional[str]
    '''
    toggle play/pause
    '''
    play_pause: Optional[str]
    '''
    slow down video playback
    '''
    speed_down: Optional[str]
    '''
    speed up video playback
    '''
    speed_up: str
    '''
    toggle the occlusion flag (for occluded objects/parts)
    '''
    toggle_occluded: Optional[str]
    '''
    toggle the optical-flow-based speed adjustment
    '''
    toggle_of: Optional[str]


@dataclass
class ContinuousKeypointTaskSpec():
    '''
    sets the input button controls for the task
    '''
    controls: Optional[Controls_3]
    '''
    Instructions to be displayed for the node
    '''
    instructions: Optional[str]
    '''
    How the instructions will be displayed
    '''
    instructions_type: Literal["default","popped"] = "'default'"
    '''
    Maximum number of submissions a user can make for the task.
    '''
    max_submissions: float = 0
    media: OpencvFlowPlayerMedia
    name: str
    '''
    Node is marked as a prerrequisite
Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
    '''
    prerequisite: bool = "False"
    '''
    If true, this node must have a valid submission before the HIT can be submitted
    '''
    required: bool = "True"
    start: Optional[List[Union[StartItem0, StartItem1, StartItem2]]]
    stop: Optional[List[Union[StopItem0, StopItem1]]]
    type: Literal["ContinuousKeypointTask"] = "ContinuousKeypointTask"
    useSharedState: Optional[bool]


@dataclass
class Input0():
    '''
    The text to be shown when the state is checked
    '''
    checkedChildren: Optional[str]
    '''
    Initial state
    '''
    defaultChecked: bool = False
    inputType: Literal["Switch"] = "Switch"
    '''
    The size of the Switch
    '''
    size: Literal["default","small"] = "default"
    '''
    The text to be shown when the state is unchecked
    '''
    unCheckedChildren: Optional[str]


@dataclass
class Input1():
    '''
    Whether to allow clear when click again
    '''
    allowClear: bool = True
    '''
    Allow selection of a half-start
    '''
    allowHalf: bool = False
    '''
    Custom character to use in place of star
    '''
    character: str = "StarFilled"
    '''
    Number of characters (default: 5)
    '''
    count: float = 5
    '''
    Default value selected
    '''
    defaultValue: float = 0
    inputType: Literal["Rate"] = "Rate"
    '''
    Customize tooltip for each character
    '''
    tooltips: Optional[List[str]]


@dataclass
class Input2():
    '''
    Show clear button
    '''
    allowClear: bool = False
    '''
    Whether the current search will be cleared on selecting an item. Only applies when mode is set to multiple or tags
    '''
    autoClearSearchValue: bool = True
    '''
    Adds border style
    '''
    bordered: bool = True
    '''
    Whether active first option by default
    '''
    defaultActiveFirstOption: bool = True
    '''
    Initial open state of dropdown
    '''
    defaultOpen: Optional[bool]
    defaultValue: Optional[Union[List[str], List[float], Union[str, float]]]
    '''
    If true, filter options by input
    '''
    filterOption: bool = True
    inputType: Literal["Select"] = "Select"
    '''
    Whether to embed label in value, turn the format of value from string to { value: string, label: ReactNode }
    '''
    labelInValue: bool = False
    '''
    Config popup height
    '''
    listHeight: float = 256
    maxTagCount: Optional[Union[str, float]]
    '''
    Max tag text length to show
    '''
    maxTagTextLength: Optional[float]
    '''
    Set mode of Select
    '''
    mode: Optional[Literal["multiple","tags"]]
    '''
    Which prop value of option will be used for filter if filterOption is true. If options is set, it should be set to label
    '''
    optionFilterProp: str = "value"
    '''
    Which prop value of option will render as content of select
    '''
    optionLabelProp: str = "children"
    '''
    Select options.
    '''
    options: Any
    '''
    Whether to show the drop-down arrow
    '''
    showArrow: Optional[bool]
    '''
    Whether show search input in single mode
    '''
    showSearch: bool = False
    '''
    Size of Select input
    '''
    size: Literal["large","middle","small"] = "middle"
    '''
    Separator used to tokenize on tag and multiple mode
    '''
    tokenSeparators: Optional[List[str]]
    '''
    Disable virtual scroll when set to false
    '''
    virtual: bool = True


@dataclass
class Options2Item():
    disabled: Optional[bool]
    label: str
    value: str


@dataclass
class RadioSpec():
    """Props for the antd radio"""
    buttonStyle: Optional[Literal["outline","solid"]]
    defaultValue: Optional[str]
    inputType: Literal["Radio.Group"] = "Radio.Group"
    optionType: Optional[Literal["button","default"]]
    options: Union[List[str], List[float], List[Options2Item]]
    size: Optional[Literal["large","middle","small"]]


@dataclass
class Marks():
    pass


@dataclass
class SliderSpec():
    """Props for the antd slider"""
    '''
    Initial slider value
    '''
    defaultValue: Optional[float]
    '''
    Whether the thumb can drag over tick only
    '''
    dots: Optional[bool]
    '''
    Make effect when marks not null, true means containment and false means coordinative
    '''
    included: Optional[bool]
    inputType: Literal["Slider"] = "Slider"
    marks: Marks = "{0: \"0\", 1: \"1\", 2: \"2\"}"
    '''
    The maximum value the slider can slide to
    '''
    max: float = 7
    '''
    The minimum value the slider can slide to
    '''
    min: float = 0
    '''
    Dual thumb mode
    '''
    range: Optional[bool]
    '''
    The granularity the slider can step through values. Must greater than 0, and be divided by (max - min) . When marks no null, step can be null
    '''
    step: float = 1
    '''
    Position of the tooltip
    '''
    tooltipPlacement: Optional[Literal["bottom","bottomLeft","bottomRight","left","leftBottom","leftTop","right","rightBottom","rightTop","top","topLeft","topRight"]]
    '''
    If true, Tooltip will show always, or it will not show anyway, even if dragging or hovering
    '''
    tooltipVisible: Optional[bool]
    '''
    If true, the slider will be vertical
    '''
    vertical: Optional[bool]


@dataclass
class FieldSpecInputSpec():
    '''
    If given the field will only be available when the condition is true
    '''
    condition: Optional[str]
    input: Union[Input0, Input1, Input2, CheckboxGroupSpec, InputFieldSpec, InputNumberSpec, TextareaSpec, RadioSpec, SliderSpec]
    '''
    Label for the field.
Usually displayed next to or on top of the field.
    '''
    label: str
    '''
    Name of the field.
The results will refer to the field by this name.
    '''
    name: str
    '''
    If true the field will be required to be filled before submission.
    '''
    required: Optional[bool]
    '''
    Text for a tooltip with more information
    '''
    tooltip: Optional[str]


@dataclass
class FormSpecInputSpec():
    '''
    For field specification
    '''
    fields: List[FieldSpecInputSpec]
    '''
    Layout of the form
    '''
    layout: Optional[Literal["horizontal","inline","vertical"]]


@dataclass
class InstructionsTaskSpec():
    content: Union[MarkdownContentRawSpec, MarkdownContentLinkSpec]
    form: Optional[FormSpecInputSpec]
    '''
    Instructions to be displayed for the node
    '''
    instructions: Optional[str]
    '''
    How the instructions will be displayed
    '''
    instructions_type: Literal["default","popped"] = "'default'"
    '''
    Maximum number of submissions a user can make for the task.
    '''
    max_submissions: float = 0
    name: str
    '''
    Node is marked as a prerrequisite
Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
    '''
    prerequisite: bool = "False"
    '''
    If true, this node must have a valid submission before the HIT can be submitted
    '''
    required: bool = "True"
    start: Optional[List[Union[StartItem0, StartItem1, StartItem2]]]
    stop: Optional[List[Union[StopItem0, StopItem1]]]
    type: Literal["InstructionsTask"] = "InstructionsTask"
    useSharedState: Optional[bool]


@dataclass
class QuestionnaireTaskSpec():
    '''
    If true, the form will only become active after the media playback ends
    '''
    disabledUntilEnd: Optional[bool]
    form: FormSpecInputSpec
    media: Optional[Union[BasicVideo, BasicAudio]]
    type: Literal["QuestionnaireTask"] = "QuestionnaireTask"


@dataclass
class ThreeImagesTaskSpec():
    form: FormSpecInputSpec
    '''
    URLs to the 3 images to be displayed
    '''
    images: List[Any]
    '''
    Instructions to be displayed for the node
    '''
    instructions: Optional[str]
    '''
    How the instructions will be displayed
    '''
    instructions_type: Literal["default","popped"] = "'default'"
    '''
    Maximum number of submissions a user can make for the task.
    '''
    max_submissions: float = 0
    name: str
    '''
    Node is marked as a prerrequisite
Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
    '''
    prerequisite: bool = "False"
    '''
    If true, this node must have a valid submission before the HIT can be submitted
    '''
    required: bool = "True"
    start: Optional[List[Union[StartItem0, StartItem1, StartItem2]]]
    stop: Optional[List[Union[StopItem0, StopItem1]]]
    '''
    Text to display before the images
    '''
    text: Optional[str]
    type: Literal["ThreeImagesTask"] = "ThreeImagesTask"
    useSharedState: Optional[bool]


@dataclass
class HitSpec():
    config: Optional[CompletionInfo]
    extra: Optional[Union[MarkdownContentRawSpec, MarkdownContentLinkSpec]]
    '''
    unique ID of the hit
    '''
    id: str
    journeys: JourneySpec
    '''
    HIT name (for display)
    '''
    name: str
    '''
    list of tasks in the HIT
    '''
    nodes: List[Union[Continuous1DTaskSpec, ContinuousKeypointTaskSpec, InstructionsTaskSpec, QuestionnaireTaskSpec, ThreeImagesTaskSpec, IncrementCounterTaskSpec]]
    '''
    number of copies or instances of the HIT
    '''
    repeat: Optional[float]
    '''
    If true, the user will be required to log in before starting the task
    '''
    requireLogin: Optional[bool]


@dataclass
class ProjectSpec():
    '''
    email of the contact person for the project.
    '''
    email: str
    '''
    List of HIT specifications, one for each Human Intelligence Task in this project.
    '''
    hits: List[HitSpec]
    '''
    unique ID of the project
    '''
    id: float
    '''
    name of the project, used to identify it in the covfee interface.
    '''
    name: str
