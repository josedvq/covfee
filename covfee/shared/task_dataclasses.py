from typing import Union, Any, List, Tuple, Dict
from .dataclass import CovfeeTask

class IncrementCounterTaskSpec(CovfeeTask):
    type: str = "IncrementCounterTask"
    name: str
    # Instructions to be displayed for the node
    instructions: str
    # How the instructions will be displayed
    instructions_type: str
    # Maximum number of submissions a user can make for the task.
    max_submissions: float
    # If the number of subjects is n_pause or less, the task will be paused
    n_pause: float
    # Number of jorneys required to start task
    n_start: float
    # Node is marked as a prerrequisite
    # Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
    prerequisite: bool
    # If true, this node must have a valid submission before the HIT can be submitted
    required: bool
    # Time to complete the task
    timer: float
    # Empty timer is started everytime the task is empty (no journeys online)
    # If the timer reaches zero, the task is set to finished state.
    timer_empty: float
    # Pause timer is started every time the task enters paused state
    # If timer reaches zero, the task is set to finished state.
    timer_pause: float
    # If true, the task state will be synced between clients.
    # This applies both to multiple clients in the same journey and across journeys.
    # Internally covfee uses socketio to synchronize task state.
    useSharedState: bool
    def __init__(self, name, instructions = None, instructions_type = 'default', max_submissions = 0, n_pause = None, n_start = None, prerequisite = False, required = True, timer = None, timer_empty = None, timer_pause = None, useSharedState = False):
        """
        ### Parameters
        0. name : str
        1. instructions : str
            - Instructions to be displayed for the node
        2. instructions_type : str
            - How the instructions will be displayed
        3. max_submissions : float
            - Maximum number of submissions a user can make for the task.
        4. n_pause : float
            - If the number of subjects is n_pause or less, the task will be paused
        5. n_start : float
            - Number of jorneys required to start task
        6. prerequisite : bool
            - Node is marked as a prerrequisite
Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
        7. required : bool
            - If true, this node must have a valid submission before the HIT can be submitted
        8. timer : float
            - Time to complete the task
        9. timer_empty : float
            - Empty timer is started everytime the task is empty (no journeys online)
If the timer reaches zero, the task is set to finished state.
        10. timer_pause : float
            - Pause timer is started every time the task enters paused state
If timer reaches zero, the task is set to finished state.
        11. useSharedState : bool
            - If true, the task state will be synced between clients.
This applies both to multiple clients in the same journey and across journeys.
Internally covfee uses socketio to synchronize task state.
        """


        super().__init__()
        self.name = name
        self.instructions = instructions
        self.instructions_type = instructions_type
        self.max_submissions = max_submissions
        self.n_pause = n_pause
        self.n_start = n_start
        self.prerequisite = prerequisite
        self.required = required
        self.timer = timer
        self.timer_empty = timer_empty
        self.timer_pause = timer_pause
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
    # If the number of subjects is n_pause or less, the task will be paused
    n_pause: float
    # Number of jorneys required to start task
    n_start: float
    # Node is marked as a prerrequisite
    # Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
    prerequisite: bool
    # If true, this node must have a valid submission before the HIT can be submitted
    required: bool
    # Time to complete the task
    timer: float
    # Empty timer is started everytime the task is empty (no journeys online)
    # If the timer reaches zero, the task is set to finished state.
    timer_empty: float
    # Pause timer is started every time the task enters paused state
    # If timer reaches zero, the task is set to finished state.
    timer_pause: float
    # If true, the task state will be synced between clients.
    # This applies both to multiple clients in the same journey and across journeys.
    # Internally covfee uses socketio to synchronize task state.
    useSharedState: bool
    def __init__(self, content, name, form = None, instructions = None, instructions_type = 'default', max_submissions = 0, n_pause = None, n_start = None, prerequisite = False, required = True, timer = None, timer_empty = None, timer_pause = None, useSharedState = False):
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
        6. n_pause : float
            - If the number of subjects is n_pause or less, the task will be paused
        7. n_start : float
            - Number of jorneys required to start task
        8. prerequisite : bool
            - Node is marked as a prerrequisite
Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
        9. required : bool
            - If true, this node must have a valid submission before the HIT can be submitted
        10. timer : float
            - Time to complete the task
        11. timer_empty : float
            - Empty timer is started everytime the task is empty (no journeys online)
If the timer reaches zero, the task is set to finished state.
        12. timer_pause : float
            - Pause timer is started every time the task enters paused state
If timer reaches zero, the task is set to finished state.
        13. useSharedState : bool
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
        self.n_pause = n_pause
        self.n_start = n_start
        self.prerequisite = prerequisite
        self.required = required
        self.timer = timer
        self.timer_empty = timer_empty
        self.timer_pause = timer_pause
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
    # If the number of subjects is n_pause or less, the task will be paused
    n_pause: float
    # Number of jorneys required to start task
    n_start: float
    # Node is marked as a prerrequisite
    # Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
    prerequisite: bool
    # If true, this node must have a valid submission before the HIT can be submitted
    required: bool
    # Time to complete the task
    timer: float
    # Empty timer is started everytime the task is empty (no journeys online)
    # If the timer reaches zero, the task is set to finished state.
    timer_empty: float
    # Pause timer is started every time the task enters paused state
    # If timer reaches zero, the task is set to finished state.
    timer_pause: float
    # If true, the task state will be synced between clients.
    # This applies both to multiple clients in the same journey and across journeys.
    # Internally covfee uses socketio to synchronize task state.
    useSharedState: bool
    def __init__(self, form, name, disabledUntilEnd = None, instructions = None, instructions_type = 'default', max_submissions = 0, media = None, n_pause = None, n_start = None, prerequisite = False, required = True, timer = None, timer_empty = None, timer_pause = None, useSharedState = False):
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
        7. n_pause : float
            - If the number of subjects is n_pause or less, the task will be paused
        8. n_start : float
            - Number of jorneys required to start task
        9. prerequisite : bool
            - Node is marked as a prerrequisite
Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
        10. required : bool
            - If true, this node must have a valid submission before the HIT can be submitted
        11. timer : float
            - Time to complete the task
        12. timer_empty : float
            - Empty timer is started everytime the task is empty (no journeys online)
If the timer reaches zero, the task is set to finished state.
        13. timer_pause : float
            - Pause timer is started every time the task enters paused state
If timer reaches zero, the task is set to finished state.
        14. useSharedState : bool
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
        self.n_pause = n_pause
        self.n_start = n_start
        self.prerequisite = prerequisite
        self.required = required
        self.timer = timer
        self.timer_empty = timer_empty
        self.timer_pause = timer_pause
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
    # If the number of subjects is n_pause or less, the task will be paused
    n_pause: float
    # Number of jorneys required to start task
    n_start: float
    # Node is marked as a prerrequisite
    # Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
    prerequisite: bool
    # If true, this node must have a valid submission before the HIT can be submitted
    required: bool
    # Time to complete the task
    timer: float
    # Empty timer is started everytime the task is empty (no journeys online)
    # If the timer reaches zero, the task is set to finished state.
    timer_empty: float
    # Pause timer is started every time the task enters paused state
    # If timer reaches zero, the task is set to finished state.
    timer_pause: float
    # If true, the task state will be synced between clients.
    # This applies both to multiple clients in the same journey and across journeys.
    # Internally covfee uses socketio to synchronize task state.
    useSharedState: bool
    # Call is audio only
    # video is always off
    videoOff: bool
    def __init__(self, name, allowMute = True, allowScreenShare = True, allowStopVideo = True, instructions = None, instructions_type = 'default', max_submissions = 0, muted = False, n_pause = None, n_start = None, prerequisite = False, required = True, timer = None, timer_empty = None, timer_pause = None, useSharedState = False, videoOff = False):
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
        8. n_pause : float
            - If the number of subjects is n_pause or less, the task will be paused
        9. n_start : float
            - Number of jorneys required to start task
        10. prerequisite : bool
            - Node is marked as a prerrequisite
Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
        11. required : bool
            - If true, this node must have a valid submission before the HIT can be submitted
        12. timer : float
            - Time to complete the task
        13. timer_empty : float
            - Empty timer is started everytime the task is empty (no journeys online)
If the timer reaches zero, the task is set to finished state.
        14. timer_pause : float
            - Pause timer is started every time the task enters paused state
If timer reaches zero, the task is set to finished state.
        15. useSharedState : bool
            - If true, the task state will be synced between clients.
This applies both to multiple clients in the same journey and across journeys.
Internally covfee uses socketio to synchronize task state.
        16. videoOff : bool
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
        self.n_pause = n_pause
        self.n_start = n_start
        self.prerequisite = prerequisite
        self.required = required
        self.timer = timer
        self.timer_empty = timer_empty
        self.timer_pause = timer_pause
        self.useSharedState = useSharedState
        self.videoOff = videoOff

