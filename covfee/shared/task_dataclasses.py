from typing import Union, Any, List, Tuple, Dict
from .dataclass import CovfeeTask

class Continuous1DTaskSpec(CovfeeTask):
    type: str = "Continuous1DTask"
    # sets the type of intensity input
    intensityInput: Union[Any,Any,Any,Any,Any,Any,Any]
    # Media file to be displayed.
    media: Any
    name: str
    # sets the input button controls for the task
    controls: Any
    # Instructions to be displayed for the node
    instructions: str
    # How the instructions will be displayed
    instructions_type: str
    # Maximum number of submissions a user can make for the task.
    max_submissions: float
    # Conditions for task pause
    pause: str
    # Node is marked as a prerrequisite
    # Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
    prerequisite: bool
    # If true, this node must have a valid submission before the HIT can be submitted
    required: bool
    # Enable player's countdown animation
    showCountdown: bool
    # Condition for task start
    start: str
    # Conditions for task end
    stop: str
    # Uses requestAnimationFrame as trigger for data reads.
    # requestAnimationFrame normally fires at close to 60Hz
    # Setting to true can improve the quality for lower framerate media by capturing data points between frames.
    # If enabled, data annotations may not align with media frame times.
    useRequestAnimationFrame: bool
    # If true, the task state will be synced between clients.
    # This applies both to multiple clients in the same journey and across journeys.
    # Internally covfee uses socketio to synchronize task state.
    useSharedState: bool
    def __init__(self, intensityInput, media, name, controls = None, instructions = None, instructions_type = 'default', max_submissions = 0, pause = None, prerequisite = False, required = True, showCountdown = None, start = 'N >= NJOURNEYS', stop = None, useRequestAnimationFrame = False, useSharedState = False):
        """
        ### Parameters
        0. intensityInput : Union[Any,Any,Any,Any,Any,Any,Any]
            - sets the type of intensity input
        1. media : Any
            - Media file to be displayed.
        2. name : str
        3. controls : Any
            - sets the input button controls for the task
        4. instructions : str
            - Instructions to be displayed for the node
        5. instructions_type : str
            - How the instructions will be displayed
        6. max_submissions : float
            - Maximum number of submissions a user can make for the task.
        7. pause : str
            - Conditions for task pause
        8. prerequisite : bool
            - Node is marked as a prerrequisite
Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
        9. required : bool
            - If true, this node must have a valid submission before the HIT can be submitted
        10. showCountdown : bool
            - Enable player's countdown animation
        11. start : str
            - Condition for task start
        12. stop : str
            - Conditions for task end
        13. useRequestAnimationFrame : bool
            - Uses requestAnimationFrame as trigger for data reads.
requestAnimationFrame normally fires at close to 60Hz
Setting to true can improve the quality for lower framerate media by capturing data points between frames.
If enabled, data annotations may not align with media frame times.
        14. useSharedState : bool
            - If true, the task state will be synced between clients.
This applies both to multiple clients in the same journey and across journeys.
Internally covfee uses socketio to synchronize task state.
        """


        super().__init__()
        self.intensityInput = intensityInput
        self.media = media
        self.name = name
        self.controls = controls
        self.instructions = instructions
        self.instructions_type = instructions_type
        self.max_submissions = max_submissions
        self.pause = pause
        self.prerequisite = prerequisite
        self.required = required
        self.showCountdown = showCountdown
        self.start = start
        self.stop = stop
        self.useRequestAnimationFrame = useRequestAnimationFrame
        self.useSharedState = useSharedState


class ContinuousKeypointTaskSpec(CovfeeTask):
    type: str = "ContinuousKeypointTask"
    # Media file to be displayed.
    media: Any
    name: str
    # sets the input button controls for the task
    controls: Any
    # Instructions to be displayed for the node
    instructions: str
    # How the instructions will be displayed
    instructions_type: str
    # Maximum number of submissions a user can make for the task.
    max_submissions: float
    # Conditions for task pause
    pause: str
    # Node is marked as a prerrequisite
    # Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
    prerequisite: bool
    # If true, this node must have a valid submission before the HIT can be submitted
    required: bool
    # Condition for task start
    start: str
    # Conditions for task end
    stop: str
    # If true, the task state will be synced between clients.
    # This applies both to multiple clients in the same journey and across journeys.
    # Internally covfee uses socketio to synchronize task state.
    useSharedState: bool
    def __init__(self, media, name, controls = None, instructions = None, instructions_type = 'default', max_submissions = 0, pause = None, prerequisite = False, required = True, start = 'N >= NJOURNEYS', stop = None, useSharedState = False):
        """
        ### Parameters
        0. media : Any
            - Media file to be displayed.
        1. name : str
        2. controls : Any
            - sets the input button controls for the task
        3. instructions : str
            - Instructions to be displayed for the node
        4. instructions_type : str
            - How the instructions will be displayed
        5. max_submissions : float
            - Maximum number of submissions a user can make for the task.
        6. pause : str
            - Conditions for task pause
        7. prerequisite : bool
            - Node is marked as a prerrequisite
Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
        8. required : bool
            - If true, this node must have a valid submission before the HIT can be submitted
        9. start : str
            - Condition for task start
        10. stop : str
            - Conditions for task end
        11. useSharedState : bool
            - If true, the task state will be synced between clients.
This applies both to multiple clients in the same journey and across journeys.
Internally covfee uses socketio to synchronize task state.
        """


        super().__init__()
        self.media = media
        self.name = name
        self.controls = controls
        self.instructions = instructions
        self.instructions_type = instructions_type
        self.max_submissions = max_submissions
        self.pause = pause
        self.prerequisite = prerequisite
        self.required = required
        self.start = start
        self.stop = stop
        self.useSharedState = useSharedState


class IncrementCounterTaskSpec(CovfeeTask):
    type: str = "IncrementCounterTask"
    name: str
    # Instructions to be displayed for the node
    instructions: str
    # How the instructions will be displayed
    instructions_type: str
    # Maximum number of submissions a user can make for the task.
    max_submissions: float
    # Conditions for task pause
    pause: str
    # Node is marked as a prerrequisite
    # Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
    prerequisite: bool
    # If true, this node must have a valid submission before the HIT can be submitted
    required: bool
    # Condition for task start
    start: str
    # Conditions for task end
    stop: str
    # If true, the task state will be synced between clients.
    # This applies both to multiple clients in the same journey and across journeys.
    # Internally covfee uses socketio to synchronize task state.
    useSharedState: bool
    def __init__(self, name, instructions = None, instructions_type = 'default', max_submissions = 0, pause = None, prerequisite = False, required = True, start = 'N >= NJOURNEYS', stop = None, useSharedState = False):
        """
        ### Parameters
        0. name : str
        1. instructions : str
            - Instructions to be displayed for the node
        2. instructions_type : str
            - How the instructions will be displayed
        3. max_submissions : float
            - Maximum number of submissions a user can make for the task.
        4. pause : str
            - Conditions for task pause
        5. prerequisite : bool
            - Node is marked as a prerrequisite
Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
        6. required : bool
            - If true, this node must have a valid submission before the HIT can be submitted
        7. start : str
            - Condition for task start
        8. stop : str
            - Conditions for task end
        9. useSharedState : bool
            - If true, the task state will be synced between clients.
This applies both to multiple clients in the same journey and across journeys.
Internally covfee uses socketio to synchronize task state.
        """


        super().__init__()
        self.name = name
        self.instructions = instructions
        self.instructions_type = instructions_type
        self.max_submissions = max_submissions
        self.pause = pause
        self.prerequisite = prerequisite
        self.required = required
        self.start = start
        self.stop = stop
        self.useSharedState = useSharedState


class InstructionsTaskSpec(CovfeeTask):
    type: str = "InstructionsTask"
    # Main static content of the page (eg. consent terms, instructions)
    content: Union[Any,Any]
    name: str
    # a form to display after the content.
    form: Any
    # Instructions to be displayed for the node
    instructions: str
    # How the instructions will be displayed
    instructions_type: str
    # Maximum number of submissions a user can make for the task.
    max_submissions: float
    # Conditions for task pause
    pause: str
    # Node is marked as a prerrequisite
    # Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
    prerequisite: bool
    # If true, this node must have a valid submission before the HIT can be submitted
    required: bool
    # Condition for task start
    start: str
    # Conditions for task end
    stop: str
    # If true, the task state will be synced between clients.
    # This applies both to multiple clients in the same journey and across journeys.
    # Internally covfee uses socketio to synchronize task state.
    useSharedState: bool
    def __init__(self, content, name, form = None, instructions = None, instructions_type = 'default', max_submissions = 0, pause = None, prerequisite = False, required = True, start = 'N >= NJOURNEYS', stop = None, useSharedState = False):
        """
        ### Parameters
        0. content : Union[Any,Any]
            - Main static content of the page (eg. consent terms, instructions)
        1. name : str
        2. form : Any
            - a form to display after the content.
        3. instructions : str
            - Instructions to be displayed for the node
        4. instructions_type : str
            - How the instructions will be displayed
        5. max_submissions : float
            - Maximum number of submissions a user can make for the task.
        6. pause : str
            - Conditions for task pause
        7. prerequisite : bool
            - Node is marked as a prerrequisite
Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
        8. required : bool
            - If true, this node must have a valid submission before the HIT can be submitted
        9. start : str
            - Condition for task start
        10. stop : str
            - Conditions for task end
        11. useSharedState : bool
            - If true, the task state will be synced between clients.
This applies both to multiple clients in the same journey and across journeys.
Internally covfee uses socketio to synchronize task state.
        """


        super().__init__()
        self.content = content
        self.name = name
        self.form = form
        self.instructions = instructions
        self.instructions_type = instructions_type
        self.max_submissions = max_submissions
        self.pause = pause
        self.prerequisite = prerequisite
        self.required = required
        self.start = start
        self.stop = stop
        self.useSharedState = useSharedState


class QuestionnaireTaskSpec(CovfeeTask):
    type: str = "QuestionnaireTask"
    # Specification of the form to be created.
    form: Any
    name: str
    # If true, the form will only become active after the media playback ends
    disabledUntilEnd: bool
    # Instructions to be displayed for the node
    instructions: str
    # How the instructions will be displayed
    instructions_type: str
    # Maximum number of submissions a user can make for the task.
    max_submissions: float
    # Media file to be displayed.
    media: Union[Any,Any]
    # Conditions for task pause
    pause: str
    # Node is marked as a prerrequisite
    # Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
    prerequisite: bool
    # If true, this node must have a valid submission before the HIT can be submitted
    required: bool
    # Condition for task start
    start: str
    # Conditions for task end
    stop: str
    # If true, the task state will be synced between clients.
    # This applies both to multiple clients in the same journey and across journeys.
    # Internally covfee uses socketio to synchronize task state.
    useSharedState: bool
    def __init__(self, form, name, disabledUntilEnd = None, instructions = None, instructions_type = 'default', max_submissions = 0, media = None, pause = None, prerequisite = False, required = True, start = 'N >= NJOURNEYS', stop = None, useSharedState = False):
        """
        ### Parameters
        0. form : Any
            - Specification of the form to be created.
        1. name : str
        2. disabledUntilEnd : bool
            - If true, the form will only become active after the media playback ends
        3. instructions : str
            - Instructions to be displayed for the node
        4. instructions_type : str
            - How the instructions will be displayed
        5. max_submissions : float
            - Maximum number of submissions a user can make for the task.
        6. media : Union[Any,Any]
            - Media file to be displayed.
        7. pause : str
            - Conditions for task pause
        8. prerequisite : bool
            - Node is marked as a prerrequisite
Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
        9. required : bool
            - If true, this node must have a valid submission before the HIT can be submitted
        10. start : str
            - Condition for task start
        11. stop : str
            - Conditions for task end
        12. useSharedState : bool
            - If true, the task state will be synced between clients.
This applies both to multiple clients in the same journey and across journeys.
Internally covfee uses socketio to synchronize task state.
        """


        super().__init__()
        self.form = form
        self.name = name
        self.disabledUntilEnd = disabledUntilEnd
        self.instructions = instructions
        self.instructions_type = instructions_type
        self.max_submissions = max_submissions
        self.media = media
        self.pause = pause
        self.prerequisite = prerequisite
        self.required = required
        self.start = start
        self.stop = stop
        self.useSharedState = useSharedState


class ThreeImagesTaskSpec(CovfeeTask):
    type: str = "ThreeImagesTask"
    # Specification of the form to be created.
    form: Any
    # URLs to the 3 images to be displayed
    images: Tuple[str,str,str]
    name: str
    # Instructions to be displayed for the node
    instructions: str
    # How the instructions will be displayed
    instructions_type: str
    # Maximum number of submissions a user can make for the task.
    max_submissions: float
    # Conditions for task pause
    pause: str
    # Node is marked as a prerrequisite
    # Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
    prerequisite: bool
    # If true, this node must have a valid submission before the HIT can be submitted
    required: bool
    # Condition for task start
    start: str
    # Conditions for task end
    stop: str
    # Text to display before the images
    text: str
    # If true, the task state will be synced between clients.
    # This applies both to multiple clients in the same journey and across journeys.
    # Internally covfee uses socketio to synchronize task state.
    useSharedState: bool
    def __init__(self, form, images, name, instructions = None, instructions_type = 'default', max_submissions = 0, pause = None, prerequisite = False, required = True, start = 'N >= NJOURNEYS', stop = None, text = None, useSharedState = False):
        """
        ### Parameters
        0. form : Any
            - Specification of the form to be created.
        1. images : Tuple[str,str,str]
            - URLs to the 3 images to be displayed
        2. name : str
        3. instructions : str
            - Instructions to be displayed for the node
        4. instructions_type : str
            - How the instructions will be displayed
        5. max_submissions : float
            - Maximum number of submissions a user can make for the task.
        6. pause : str
            - Conditions for task pause
        7. prerequisite : bool
            - Node is marked as a prerrequisite
Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
        8. required : bool
            - If true, this node must have a valid submission before the HIT can be submitted
        9. start : str
            - Condition for task start
        10. stop : str
            - Conditions for task end
        11. text : str
            - Text to display before the images
        12. useSharedState : bool
            - If true, the task state will be synced between clients.
This applies both to multiple clients in the same journey and across journeys.
Internally covfee uses socketio to synchronize task state.
        """


        super().__init__()
        self.form = form
        self.images = images
        self.name = name
        self.instructions = instructions
        self.instructions_type = instructions_type
        self.max_submissions = max_submissions
        self.pause = pause
        self.prerequisite = prerequisite
        self.required = required
        self.start = start
        self.stop = stop
        self.text = text
        self.useSharedState = useSharedState


class VideocallTaskSpec(CovfeeTask):
    # Layout mode
    layout: str = "grid"
    type: str = "VideocallTask"
    name: str
    # Allow the user to mute their own audio
    allowMute: bool
    # Allow the user to share their screen
    allowScreenShare: bool
    # Allow the user to stop their own video
    allowStopVideo: bool
    # Instructions to be displayed for the node
    instructions: str
    # How the instructions will be displayed
    instructions_type: str
    # Maximum number of submissions a user can make for the task.
    max_submissions: float
    # Videocall is muted
    muted: bool
    # Conditions for task pause
    pause: str
    # Node is marked as a prerrequisite
    # Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
    prerequisite: bool
    # If true, this node must have a valid submission before the HIT can be submitted
    required: bool
    # Condition for task start
    start: str
    # Conditions for task end
    stop: str
    # If true, the task state will be synced between clients.
    # This applies both to multiple clients in the same journey and across journeys.
    # Internally covfee uses socketio to synchronize task state.
    useSharedState: bool
    # Call is audio only
    # video is always off
    videoOff: bool
    def __init__(self, name, allowMute = True, allowScreenShare = True, allowStopVideo = True, instructions = None, instructions_type = 'default', max_submissions = 0, muted = False, pause = None, prerequisite = False, required = True, start = 'N >= NJOURNEYS', stop = None, useSharedState = False, videoOff = False):
        """
        ### Parameters
        0. name : str
        1. allowMute : bool
            - Allow the user to mute their own audio
        2. allowScreenShare : bool
            - Allow the user to share their screen
        3. allowStopVideo : bool
            - Allow the user to stop their own video
        4. instructions : str
            - Instructions to be displayed for the node
        5. instructions_type : str
            - How the instructions will be displayed
        6. max_submissions : float
            - Maximum number of submissions a user can make for the task.
        7. muted : bool
            - Videocall is muted
        8. pause : str
            - Conditions for task pause
        9. prerequisite : bool
            - Node is marked as a prerrequisite
Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
        10. required : bool
            - If true, this node must have a valid submission before the HIT can be submitted
        11. start : str
            - Condition for task start
        12. stop : str
            - Conditions for task end
        13. useSharedState : bool
            - If true, the task state will be synced between clients.
This applies both to multiple clients in the same journey and across journeys.
Internally covfee uses socketio to synchronize task state.
        14. videoOff : bool
            - Call is audio only
video is always off
        """


        super().__init__()
        self.name = name
        self.allowMute = allowMute
        self.allowScreenShare = allowScreenShare
        self.allowStopVideo = allowStopVideo
        self.instructions = instructions
        self.instructions_type = instructions_type
        self.max_submissions = max_submissions
        self.muted = muted
        self.pause = pause
        self.prerequisite = prerequisite
        self.required = required
        self.start = start
        self.stop = stop
        self.useSharedState = useSharedState
        self.videoOff = videoOff

