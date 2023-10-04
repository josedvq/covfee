from typing import Union, Any, List, Tuple, Dict
from .dataclass import CovfeeTask

class Continuous1DTaskSpec(CovfeeTask):
    type: str = "Continuous1DTask"
    # sets the input button controls for the task
    controls: Any
    # Instructions to be displayed for the node
    instructions: str
    # sets the type of intensity input
    intensityInput: Union[Any,Any,Any,Any,Any,Any,Any]
    # Media file to be displayed.
    media: Any
    name: str
    # Enable player's countdown animation
    showCountdown: bool
    start: List[Union[Any,Any,Any]]
    stop: List[Union[Any,Any]]
    useSharedState: bool
    # How the instructions will be displayed
    instructions_type: str
    # Maximum number of submissions a user can make for the task.
    max_submissions: float
    # Node is marked as a prerrequisite
    # Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
    prerequisite: bool
    # If true, this node must have a valid submission before the HIT can be submitted
    required: bool
    # Uses requestAnimationFrame as trigger for data reads.
    # requestAnimationFrame normally fires at close to 60Hz
    # Setting to true can improve the quality for lower framerate media by capturing data points between frames.
    # If enabled, data annotations may not align with media frame times.
    useRequestAnimationFrame: bool
    def __init__(self, controls, instructions, intensityInput, media, name, showCountdown, start, stop, useSharedState, instructions_type = 'default', max_submissions = 0, prerequisite = False, required = True, useRequestAnimationFrame = False):
        """
        ### Parameters
        0. controls : Any
            - sets the input button controls for the task
        1. instructions : str
            - Instructions to be displayed for the node
        2. intensityInput : Union[Any,Any,Any,Any,Any,Any,Any]
            - sets the type of intensity input
        3. media : Any
            - Media file to be displayed.
        4. name : str
        5. showCountdown : bool
            - Enable player's countdown animation
        6. start : List[Union[Any,Any,Any]]
        7. stop : List[Union[Any,Any]]
        8. useSharedState : bool
        9. instructions_type : str
            - How the instructions will be displayed
        10. max_submissions : float
            - Maximum number of submissions a user can make for the task.
        11. prerequisite : bool
            - Node is marked as a prerrequisite
Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
        12. required : bool
            - If true, this node must have a valid submission before the HIT can be submitted
        13. useRequestAnimationFrame : bool
            - Uses requestAnimationFrame as trigger for data reads.
requestAnimationFrame normally fires at close to 60Hz
Setting to true can improve the quality for lower framerate media by capturing data points between frames.
If enabled, data annotations may not align with media frame times.
        """


        self.controls = controls
        self.instructions = instructions
        self.intensityInput = intensityInput
        self.media = media
        self.name = name
        self.showCountdown = showCountdown
        self.start = start
        self.stop = stop
        self.useSharedState = useSharedState
        self.instructions_type = instructions_type
        self.max_submissions = max_submissions
        self.prerequisite = prerequisite
        self.required = required
        self.useRequestAnimationFrame = useRequestAnimationFrame


class ContinuousKeypointTaskSpec(CovfeeTask):
    type: str = "ContinuousKeypointTask"
    # sets the input button controls for the task
    controls: Any
    # Instructions to be displayed for the node
    instructions: str
    # Media file to be displayed.
    media: Any
    name: str
    start: List[Union[Any,Any,Any]]
    stop: List[Union[Any,Any]]
    useSharedState: bool
    # How the instructions will be displayed
    instructions_type: str
    # Maximum number of submissions a user can make for the task.
    max_submissions: float
    # Node is marked as a prerrequisite
    # Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
    prerequisite: bool
    # If true, this node must have a valid submission before the HIT can be submitted
    required: bool
    def __init__(self, controls, instructions, media, name, start, stop, useSharedState, instructions_type = 'default', max_submissions = 0, prerequisite = False, required = True):
        """
        ### Parameters
        0. controls : Any
            - sets the input button controls for the task
        1. instructions : str
            - Instructions to be displayed for the node
        2. media : Any
            - Media file to be displayed.
        3. name : str
        4. start : List[Union[Any,Any,Any]]
        5. stop : List[Union[Any,Any]]
        6. useSharedState : bool
        7. instructions_type : str
            - How the instructions will be displayed
        8. max_submissions : float
            - Maximum number of submissions a user can make for the task.
        9. prerequisite : bool
            - Node is marked as a prerrequisite
Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
        10. required : bool
            - If true, this node must have a valid submission before the HIT can be submitted
        """


        self.controls = controls
        self.instructions = instructions
        self.media = media
        self.name = name
        self.start = start
        self.stop = stop
        self.useSharedState = useSharedState
        self.instructions_type = instructions_type
        self.max_submissions = max_submissions
        self.prerequisite = prerequisite
        self.required = required


class IncrementCounterTaskSpec(CovfeeTask):
    type: str = "IncrementCounterTask"
    # Instructions to be displayed for the node
    instructions: str
    name: str
    start: List[Union[Any,Any,Any]]
    stop: List[Union[Any,Any]]
    useSharedState: bool
    # How the instructions will be displayed
    instructions_type: str
    # Maximum number of submissions a user can make for the task.
    max_submissions: float
    # Node is marked as a prerrequisite
    # Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
    prerequisite: bool
    # If true, this node must have a valid submission before the HIT can be submitted
    required: bool
    def __init__(self, instructions, name, start, stop, useSharedState, instructions_type = 'default', max_submissions = 0, prerequisite = False, required = True):
        """
        ### Parameters
        0. instructions : str
            - Instructions to be displayed for the node
        1. name : str
        2. start : List[Union[Any,Any,Any]]
        3. stop : List[Union[Any,Any]]
        4. useSharedState : bool
        5. instructions_type : str
            - How the instructions will be displayed
        6. max_submissions : float
            - Maximum number of submissions a user can make for the task.
        7. prerequisite : bool
            - Node is marked as a prerrequisite
Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
        8. required : bool
            - If true, this node must have a valid submission before the HIT can be submitted
        """


        self.instructions = instructions
        self.name = name
        self.start = start
        self.stop = stop
        self.useSharedState = useSharedState
        self.instructions_type = instructions_type
        self.max_submissions = max_submissions
        self.prerequisite = prerequisite
        self.required = required


class InstructionsTaskSpec(CovfeeTask):
    type: str = "InstructionsTask"
    # Main static content of the page (eg. consent terms, instructions)
    content: Union[Any,Any]
    # a form to display after the content.
    form: Any
    # Instructions to be displayed for the node
    instructions: str
    name: str
    start: List[Union[Any,Any,Any]]
    stop: List[Union[Any,Any]]
    useSharedState: bool
    # How the instructions will be displayed
    instructions_type: str
    # Maximum number of submissions a user can make for the task.
    max_submissions: float
    # Node is marked as a prerrequisite
    # Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
    prerequisite: bool
    # If true, this node must have a valid submission before the HIT can be submitted
    required: bool
    def __init__(self, content, form, instructions, name, start, stop, useSharedState, instructions_type = 'default', max_submissions = 0, prerequisite = False, required = True):
        """
        ### Parameters
        0. content : Union[Any,Any]
            - Main static content of the page (eg. consent terms, instructions)
        1. form : Any
            - a form to display after the content.
        2. instructions : str
            - Instructions to be displayed for the node
        3. name : str
        4. start : List[Union[Any,Any,Any]]
        5. stop : List[Union[Any,Any]]
        6. useSharedState : bool
        7. instructions_type : str
            - How the instructions will be displayed
        8. max_submissions : float
            - Maximum number of submissions a user can make for the task.
        9. prerequisite : bool
            - Node is marked as a prerrequisite
Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
        10. required : bool
            - If true, this node must have a valid submission before the HIT can be submitted
        """


        self.content = content
        self.form = form
        self.instructions = instructions
        self.name = name
        self.start = start
        self.stop = stop
        self.useSharedState = useSharedState
        self.instructions_type = instructions_type
        self.max_submissions = max_submissions
        self.prerequisite = prerequisite
        self.required = required


class QuestionnaireTaskSpec(CovfeeTask):
    type: str = "QuestionnaireTask"
    # If true, the form will only become active after the media playback ends
    disabledUntilEnd: bool
    # Specification of the form to be created.
    form: Any
    # Media file to be displayed.
    media: Union[Any,Any]
    def __init__(self, disabledUntilEnd, form, media):
        """
        ### Parameters
        0. disabledUntilEnd : bool
            - If true, the form will only become active after the media playback ends
        1. form : Any
            - Specification of the form to be created.
        2. media : Union[Any,Any]
            - Media file to be displayed.
        """


        self.disabledUntilEnd = disabledUntilEnd
        self.form = form
        self.media = media


class ThreeImagesTaskSpec(CovfeeTask):
    type: str = "ThreeImagesTask"
    # Specification of the form to be created.
    form: Any
    # URLs to the 3 images to be displayed
    images: Tuple[str,str,str]
    # Instructions to be displayed for the node
    instructions: str
    name: str
    start: List[Union[Any,Any,Any]]
    stop: List[Union[Any,Any]]
    # Text to display before the images
    text: str
    useSharedState: bool
    # How the instructions will be displayed
    instructions_type: str
    # Maximum number of submissions a user can make for the task.
    max_submissions: float
    # Node is marked as a prerrequisite
    # Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
    prerequisite: bool
    # If true, this node must have a valid submission before the HIT can be submitted
    required: bool
    def __init__(self, form, images, instructions, name, start, stop, text, useSharedState, instructions_type = 'default', max_submissions = 0, prerequisite = False, required = True):
        """
        ### Parameters
        0. form : Any
            - Specification of the form to be created.
        1. images : Tuple[str,str,str]
            - URLs to the 3 images to be displayed
        2. instructions : str
            - Instructions to be displayed for the node
        3. name : str
        4. start : List[Union[Any,Any,Any]]
        5. stop : List[Union[Any,Any]]
        6. text : str
            - Text to display before the images
        7. useSharedState : bool
        8. instructions_type : str
            - How the instructions will be displayed
        9. max_submissions : float
            - Maximum number of submissions a user can make for the task.
        10. prerequisite : bool
            - Node is marked as a prerrequisite
Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
        11. required : bool
            - If true, this node must have a valid submission before the HIT can be submitted
        """


        self.form = form
        self.images = images
        self.instructions = instructions
        self.name = name
        self.start = start
        self.stop = stop
        self.text = text
        self.useSharedState = useSharedState
        self.instructions_type = instructions_type
        self.max_submissions = max_submissions
        self.prerequisite = prerequisite
        self.required = required

