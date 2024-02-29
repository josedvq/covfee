from typing import Union, Any, List, Tuple, Dict
from .dataclass import CovfeeTask

class ActionAnnotationTaskSpec(CovfeeTask):
    type: str = "ActionAnnotationTask"
    # base of the custom API of this task
    customApiBase: str
    # The annotations
    input: Any
    # Media file to be displayed.
    media: Any
    name: str
    # Seconds countdown after start condition met.
    countdown: float
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
    # If true, the timer will pause when the task is paused.
    timer_pausable: bool
    # Pause timer is started every time the task enters paused state
    # If timer reaches zero, the task is set to finished state.
    timer_pause: float
    # If true, the task state will be synced between clients.
    # This applies both to multiple clients in the same journey and across journeys.
    # Internally covfee uses socketio to synchronize task state.
    useSharedState: bool
    # If true, all journeys must click ready to start the task
    wait_for_ready: bool
    def __init__(self, customApiBase, input, media, name, countdown = 0, instructions = None, instructions_type = 'default', max_submissions = 0, n_pause = None, n_start = None, prerequisite = False, required = True, timer = None, timer_empty = None, timer_pausable = None, timer_pause = None, useSharedState = None, wait_for_ready = None):
        """
        ### Parameters
        0. customApiBase : str
            - base of the custom API of this task
        1. input : Any
            - The annotations
        2. media : Any
            - Media file to be displayed.
        3. name : str
        4. countdown : float
            - Seconds countdown after start condition met.
        5. instructions : str
            - Instructions to be displayed for the node
        6. instructions_type : str
            - How the instructions will be displayed
        7. max_submissions : float
            - Maximum number of submissions a user can make for the task.
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
        14. timer_pausable : bool
            - If true, the timer will pause when the task is paused.
        15. timer_pause : float
            - Pause timer is started every time the task enters paused state
If timer reaches zero, the task is set to finished state.
        16. useSharedState : bool
            - If true, the task state will be synced between clients.
This applies both to multiple clients in the same journey and across journeys.
Internally covfee uses socketio to synchronize task state.
        17. wait_for_ready : bool
            - If true, all journeys must click ready to start the task
        """


        super().__init__()
        self.customApiBase = customApiBase
        self.input = input
        self.media = media
        self.name = name
        self.countdown = countdown
        self.instructions = instructions
        self.instructions_type = instructions_type
        self.max_submissions = max_submissions
        self.n_pause = n_pause
        self.n_start = n_start
        self.prerequisite = prerequisite
        self.required = required
        self.timer = timer
        self.timer_empty = timer_empty
        self.timer_pausable = timer_pausable
        self.timer_pause = timer_pause
        self.useSharedState = useSharedState
        self.wait_for_ready = wait_for_ready


class ContinuousAnnotationTaskSpec(CovfeeTask):
    type: str = "ContinuousAnnotationTask"
    annotations: List[Any]
    # base of the custom API of this task
    customApiBase: str
    media: Any
    name: str
    userCanAdd: bool
    # Seconds countdown after start condition met.
    countdown: float
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
    # If true, the timer will pause when the task is paused.
    timer_pausable: bool
    # Pause timer is started every time the task enters paused state
    # If timer reaches zero, the task is set to finished state.
    timer_pause: float
    # If true, the task state will be synced between clients.
    # This applies both to multiple clients in the same journey and across journeys.
    # Internally covfee uses socketio to synchronize task state.
    useSharedState: bool
    # If true, all journeys must click ready to start the task
    wait_for_ready: bool
    def __init__(self, annotations, customApiBase, media, name, userCanAdd, countdown = 0, instructions = None, instructions_type = 'default', max_submissions = 0, n_pause = None, n_start = None, prerequisite = False, required = True, timer = None, timer_empty = None, timer_pausable = None, timer_pause = None, useSharedState = None, wait_for_ready = None):
        """
        ### Parameters
        0. annotations : List[Any]
        1. customApiBase : str
            - base of the custom API of this task
        2. media : Any
        3. name : str
        4. userCanAdd : bool
        5. countdown : float
            - Seconds countdown after start condition met.
        6. instructions : str
            - Instructions to be displayed for the node
        7. instructions_type : str
            - How the instructions will be displayed
        8. max_submissions : float
            - Maximum number of submissions a user can make for the task.
        9. n_pause : float
            - If the number of subjects is n_pause or less, the task will be paused
        10. n_start : float
            - Number of jorneys required to start task
        11. prerequisite : bool
            - Node is marked as a prerrequisite
Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
        12. required : bool
            - If true, this node must have a valid submission before the HIT can be submitted
        13. timer : float
            - Time to complete the task
        14. timer_empty : float
            - Empty timer is started everytime the task is empty (no journeys online)
If the timer reaches zero, the task is set to finished state.
        15. timer_pausable : bool
            - If true, the timer will pause when the task is paused.
        16. timer_pause : float
            - Pause timer is started every time the task enters paused state
If timer reaches zero, the task is set to finished state.
        17. useSharedState : bool
            - If true, the task state will be synced between clients.
This applies both to multiple clients in the same journey and across journeys.
Internally covfee uses socketio to synchronize task state.
        18. wait_for_ready : bool
            - If true, all journeys must click ready to start the task
        """


        super().__init__()
        self.annotations = annotations
        self.customApiBase = customApiBase
        self.media = media
        self.name = name
        self.userCanAdd = userCanAdd
        self.countdown = countdown
        self.instructions = instructions
        self.instructions_type = instructions_type
        self.max_submissions = max_submissions
        self.n_pause = n_pause
        self.n_start = n_start
        self.prerequisite = prerequisite
        self.required = required
        self.timer = timer
        self.timer_empty = timer_empty
        self.timer_pausable = timer_pausable
        self.timer_pause = timer_pause
        self.useSharedState = useSharedState
        self.wait_for_ready = wait_for_ready


class IncrementCounterTaskSpec(CovfeeTask):
    type: str = "IncrementCounterTask"
    # base of the custom API of this task
    customApiBase: str
    name: str
    # Seconds countdown after start condition met.
    countdown: float
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
    # If true, the timer will pause when the task is paused.
    timer_pausable: bool
    # Pause timer is started every time the task enters paused state
    # If timer reaches zero, the task is set to finished state.
    timer_pause: float
    # If true, the task state will be synced between clients.
    # This applies both to multiple clients in the same journey and across journeys.
    # Internally covfee uses socketio to synchronize task state.
    useSharedState: bool
    # If true, all journeys must click ready to start the task
    wait_for_ready: bool
    def __init__(self, customApiBase, name, countdown = 0, instructions = None, instructions_type = 'default', max_submissions = 0, n_pause = None, n_start = None, prerequisite = False, required = True, timer = None, timer_empty = None, timer_pausable = None, timer_pause = None, useSharedState = None, wait_for_ready = None):
        """
        ### Parameters
        0. customApiBase : str
            - base of the custom API of this task
        1. name : str
        2. countdown : float
            - Seconds countdown after start condition met.
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
        12. timer_pausable : bool
            - If true, the timer will pause when the task is paused.
        13. timer_pause : float
            - Pause timer is started every time the task enters paused state
If timer reaches zero, the task is set to finished state.
        14. useSharedState : bool
            - If true, the task state will be synced between clients.
This applies both to multiple clients in the same journey and across journeys.
Internally covfee uses socketio to synchronize task state.
        15. wait_for_ready : bool
            - If true, all journeys must click ready to start the task
        """


        super().__init__()
        self.customApiBase = customApiBase
        self.name = name
        self.countdown = countdown
        self.instructions = instructions
        self.instructions_type = instructions_type
        self.max_submissions = max_submissions
        self.n_pause = n_pause
        self.n_start = n_start
        self.prerequisite = prerequisite
        self.required = required
        self.timer = timer
        self.timer_empty = timer_empty
        self.timer_pausable = timer_pausable
        self.timer_pause = timer_pause
        self.useSharedState = useSharedState
        self.wait_for_ready = wait_for_ready


class InstructionsTaskSpec(CovfeeTask):
    type: str = "InstructionsTask"
    # Main static content of the page (eg. consent terms, instructions)
    content: Union[Any,Any]
    # base of the custom API of this task
    customApiBase: str
    name: str
    # Seconds countdown after start condition met.
    countdown: float
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
    # If true, the timer will pause when the task is paused.
    timer_pausable: bool
    # Pause timer is started every time the task enters paused state
    # If timer reaches zero, the task is set to finished state.
    timer_pause: float
    # If true, the task state will be synced between clients.
    # This applies both to multiple clients in the same journey and across journeys.
    # Internally covfee uses socketio to synchronize task state.
    useSharedState: bool
    # If true, all journeys must click ready to start the task
    wait_for_ready: bool
    def __init__(self, content, customApiBase, name, countdown = 0, form = None, instructions = None, instructions_type = 'default', max_submissions = 0, n_pause = None, n_start = None, prerequisite = False, required = True, timer = None, timer_empty = None, timer_pausable = None, timer_pause = None, useSharedState = None, wait_for_ready = None):
        """
        ### Parameters
        0. content : Union[Any,Any]
            - Main static content of the page (eg. consent terms, instructions)
        1. customApiBase : str
            - base of the custom API of this task
        2. name : str
        3. countdown : float
            - Seconds countdown after start condition met.
        4. form : Any
            - a form to display after the content.
        5. instructions : str
            - Instructions to be displayed for the node
        6. instructions_type : str
            - How the instructions will be displayed
        7. max_submissions : float
            - Maximum number of submissions a user can make for the task.
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
        14. timer_pausable : bool
            - If true, the timer will pause when the task is paused.
        15. timer_pause : float
            - Pause timer is started every time the task enters paused state
If timer reaches zero, the task is set to finished state.
        16. useSharedState : bool
            - If true, the task state will be synced between clients.
This applies both to multiple clients in the same journey and across journeys.
Internally covfee uses socketio to synchronize task state.
        17. wait_for_ready : bool
            - If true, all journeys must click ready to start the task
        """


        super().__init__()
        self.content = content
        self.customApiBase = customApiBase
        self.name = name
        self.countdown = countdown
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
        self.timer_pausable = timer_pausable
        self.timer_pause = timer_pause
        self.useSharedState = useSharedState
        self.wait_for_ready = wait_for_ready


class QuestionnaireTaskSpec(CovfeeTask):
    type: str = "QuestionnaireTask"
    # base of the custom API of this task
    customApiBase: str
    # Specification of the form to be created.
    form: Any
    name: str
    # Seconds countdown after start condition met.
    countdown: float
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
    # If true, the timer will pause when the task is paused.
    timer_pausable: bool
    # Pause timer is started every time the task enters paused state
    # If timer reaches zero, the task is set to finished state.
    timer_pause: float
    # If true, the task state will be synced between clients.
    # This applies both to multiple clients in the same journey and across journeys.
    # Internally covfee uses socketio to synchronize task state.
    useSharedState: bool
    # If true, all journeys must click ready to start the task
    wait_for_ready: bool
    def __init__(self, customApiBase, form, name, countdown = 0, disabledUntilEnd = None, instructions = None, instructions_type = 'default', max_submissions = 0, media = None, n_pause = None, n_start = None, prerequisite = False, required = True, timer = None, timer_empty = None, timer_pausable = None, timer_pause = None, useSharedState = None, wait_for_ready = None):
        """
        ### Parameters
        0. customApiBase : str
            - base of the custom API of this task
        1. form : Any
            - Specification of the form to be created.
        2. name : str
        3. countdown : float
            - Seconds countdown after start condition met.
        4. disabledUntilEnd : bool
            - If true, the form will only become active after the media playback ends
        5. instructions : str
            - Instructions to be displayed for the node
        6. instructions_type : str
            - How the instructions will be displayed
        7. max_submissions : float
            - Maximum number of submissions a user can make for the task.
        8. media : Union[Any,Any]
            - Media file to be displayed.
        9. n_pause : float
            - If the number of subjects is n_pause or less, the task will be paused
        10. n_start : float
            - Number of jorneys required to start task
        11. prerequisite : bool
            - Node is marked as a prerrequisite
Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
        12. required : bool
            - If true, this node must have a valid submission before the HIT can be submitted
        13. timer : float
            - Time to complete the task
        14. timer_empty : float
            - Empty timer is started everytime the task is empty (no journeys online)
If the timer reaches zero, the task is set to finished state.
        15. timer_pausable : bool
            - If true, the timer will pause when the task is paused.
        16. timer_pause : float
            - Pause timer is started every time the task enters paused state
If timer reaches zero, the task is set to finished state.
        17. useSharedState : bool
            - If true, the task state will be synced between clients.
This applies both to multiple clients in the same journey and across journeys.
Internally covfee uses socketio to synchronize task state.
        18. wait_for_ready : bool
            - If true, all journeys must click ready to start the task
        """


        super().__init__()
        self.customApiBase = customApiBase
        self.form = form
        self.name = name
        self.countdown = countdown
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
        self.timer_pausable = timer_pausable
        self.timer_pause = timer_pause
        self.useSharedState = useSharedState
        self.wait_for_ready = wait_for_ready


class TutorialTaskSpec(CovfeeTask):
    type: str = "TutorialTask"
    # base of the custom API of this task
    customApiBase: str
    name: str
    # Seconds countdown after start condition met.
    countdown: float
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
    # Media file to be displayed.
    showPhoneField: bool
    # Time to complete the task
    timer: float
    # Empty timer is started everytime the task is empty (no journeys online)
    # If the timer reaches zero, the task is set to finished state.
    timer_empty: float
    # If true, the timer will pause when the task is paused.
    timer_pausable: bool
    # Pause timer is started every time the task enters paused state
    # If timer reaches zero, the task is set to finished state.
    timer_pause: float
    # If true, the task state will be synced between clients.
    # This applies both to multiple clients in the same journey and across journeys.
    # Internally covfee uses socketio to synchronize task state.
    useSharedState: bool
    # If true, all journeys must click ready to start the task
    wait_for_ready: bool
    def __init__(self, customApiBase, name, countdown = 0, instructions = None, instructions_type = 'default', max_submissions = 0, n_pause = None, n_start = None, prerequisite = False, required = True, showPhoneField = None, timer = None, timer_empty = None, timer_pausable = None, timer_pause = None, useSharedState = None, wait_for_ready = None):
        """
        ### Parameters
        0. customApiBase : str
            - base of the custom API of this task
        1. name : str
        2. countdown : float
            - Seconds countdown after start condition met.
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
        10. showPhoneField : bool
            - Media file to be displayed.
        11. timer : float
            - Time to complete the task
        12. timer_empty : float
            - Empty timer is started everytime the task is empty (no journeys online)
If the timer reaches zero, the task is set to finished state.
        13. timer_pausable : bool
            - If true, the timer will pause when the task is paused.
        14. timer_pause : float
            - Pause timer is started every time the task enters paused state
If timer reaches zero, the task is set to finished state.
        15. useSharedState : bool
            - If true, the task state will be synced between clients.
This applies both to multiple clients in the same journey and across journeys.
Internally covfee uses socketio to synchronize task state.
        16. wait_for_ready : bool
            - If true, all journeys must click ready to start the task
        """


        super().__init__()
        self.customApiBase = customApiBase
        self.name = name
        self.countdown = countdown
        self.instructions = instructions
        self.instructions_type = instructions_type
        self.max_submissions = max_submissions
        self.n_pause = n_pause
        self.n_start = n_start
        self.prerequisite = prerequisite
        self.required = required
        self.showPhoneField = showPhoneField
        self.timer = timer
        self.timer_empty = timer_empty
        self.timer_pausable = timer_pausable
        self.timer_pause = timer_pause
        self.useSharedState = useSharedState
        self.wait_for_ready = wait_for_ready


class VideocallTaskSpec(CovfeeTask):
    # Layout mode
    layout: str = "grid"
    type: str = "VideocallTask"
    # base of the custom API of this task
    customApiBase: str
    name: str
    # Allow the user to mute their own audio
    allowMute: bool
    # Allow the user to share their screen
    allowScreenShare: bool
    # Allow the user to stop their own video
    allowStopVideo: bool
    # Seconds countdown after start condition met.
    countdown: float
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
    # If true, the timer will pause when the task is paused.
    timer_pausable: bool
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
    # If true, all journeys must click ready to start the task
    wait_for_ready: bool
    def __init__(self, customApiBase, name, allowMute = True, allowScreenShare = True, allowStopVideo = True, countdown = 0, instructions = None, instructions_type = 'default', max_submissions = 0, muted = False, n_pause = None, n_start = None, prerequisite = False, required = True, timer = None, timer_empty = None, timer_pausable = None, timer_pause = None, useSharedState = None, videoOff = False, wait_for_ready = None):
        """
        ### Parameters
        0. customApiBase : str
            - base of the custom API of this task
        1. name : str
        2. allowMute : bool
            - Allow the user to mute their own audio
        3. allowScreenShare : bool
            - Allow the user to share their screen
        4. allowStopVideo : bool
            - Allow the user to stop their own video
        5. countdown : float
            - Seconds countdown after start condition met.
        6. instructions : str
            - Instructions to be displayed for the node
        7. instructions_type : str
            - How the instructions will be displayed
        8. max_submissions : float
            - Maximum number of submissions a user can make for the task.
        9. muted : bool
            - Videocall is muted
        10. n_pause : float
            - If the number of subjects is n_pause or less, the task will be paused
        11. n_start : float
            - Number of jorneys required to start task
        12. prerequisite : bool
            - Node is marked as a prerrequisite
Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
        13. required : bool
            - If true, this node must have a valid submission before the HIT can be submitted
        14. timer : float
            - Time to complete the task
        15. timer_empty : float
            - Empty timer is started everytime the task is empty (no journeys online)
If the timer reaches zero, the task is set to finished state.
        16. timer_pausable : bool
            - If true, the timer will pause when the task is paused.
        17. timer_pause : float
            - Pause timer is started every time the task enters paused state
If timer reaches zero, the task is set to finished state.
        18. useSharedState : bool
            - If true, the task state will be synced between clients.
This applies both to multiple clients in the same journey and across journeys.
Internally covfee uses socketio to synchronize task state.
        19. videoOff : bool
            - Call is audio only
video is always off
        20. wait_for_ready : bool
            - If true, all journeys must click ready to start the task
        """


        super().__init__()
        self.customApiBase = customApiBase
        self.name = name
        self.allowMute = allowMute
        self.allowScreenShare = allowScreenShare
        self.allowStopVideo = allowStopVideo
        self.countdown = countdown
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
        self.timer_pausable = timer_pausable
        self.timer_pause = timer_pause
        self.useSharedState = useSharedState
        self.videoOff = videoOff
        self.wait_for_ready = wait_for_ready

