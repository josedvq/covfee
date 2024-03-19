from typing import Union, Any, List, Tuple, Dict
from .dataclass import CovfeeTask

class ContinuousAnnotationTaskSpec(CovfeeTask):
    type: str = "ContinuousAnnotationTask"
    annotations: List[Any]
    media: List[Any]
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
    prolificCompletionCode: str
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
    def __init__(self, annotations, media, name, userCanAdd, countdown = 0, instructions = None, instructions_type = 'default', max_submissions = 0, n_pause = None, n_start = None, prerequisite = False, prolificCompletionCode = None, required = True, timer = None, timer_empty = None, timer_pausable = None, timer_pause = None, useSharedState = None, wait_for_ready = None):
        """
        ### Parameters
        0. annotations : List[Any]
        1. media : List[Any]
        2. name : str
        3. userCanAdd : bool
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
        11. prolificCompletionCode : str
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
        self.prolificCompletionCode = prolificCompletionCode
        self.required = required
        self.timer = timer
        self.timer_empty = timer_empty
        self.timer_pausable = timer_pausable
        self.timer_pause = timer_pause
        self.useSharedState = useSharedState
        self.wait_for_ready = wait_for_ready


class IncrementCounterTaskSpec(CovfeeTask):
    type: str = "IncrementCounterTask"
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
    def __init__(self, name, countdown = 0, instructions = None, instructions_type = 'default', max_submissions = 0, n_pause = None, n_start = None, prerequisite = False, required = True, timer = None, timer_empty = None, timer_pausable = None, timer_pause = None, useSharedState = None, wait_for_ready = None):
        """
        ### Parameters
        0. name : str
        1. countdown : float
            - Seconds countdown after start condition met.
        2. instructions : str
            - Instructions to be displayed for the node
        3. instructions_type : str
            - How the instructions will be displayed
        4. max_submissions : float
            - Maximum number of submissions a user can make for the task.
        5. n_pause : float
            - If the number of subjects is n_pause or less, the task will be paused
        6. n_start : float
            - Number of jorneys required to start task
        7. prerequisite : bool
            - Node is marked as a prerrequisite
Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
        8. required : bool
            - If true, this node must have a valid submission before the HIT can be submitted
        9. timer : float
            - Time to complete the task
        10. timer_empty : float
            - Empty timer is started everytime the task is empty (no journeys online)
If the timer reaches zero, the task is set to finished state.
        11. timer_pausable : bool
            - If true, the timer will pause when the task is paused.
        12. timer_pause : float
            - Pause timer is started every time the task enters paused state
If timer reaches zero, the task is set to finished state.
        13. useSharedState : bool
            - If true, the task state will be synced between clients.
This applies both to multiple clients in the same journey and across journeys.
Internally covfee uses socketio to synchronize task state.
        14. wait_for_ready : bool
            - If true, all journeys must click ready to start the task
        """


        super().__init__()
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
    def __init__(self, content, name, countdown = 0, form = None, instructions = None, instructions_type = 'default', max_submissions = 0, n_pause = None, n_start = None, prerequisite = False, required = True, timer = None, timer_empty = None, timer_pausable = None, timer_pause = None, useSharedState = None, wait_for_ready = None):
        """
        ### Parameters
        0. content : Union[Any,Any]
            - Main static content of the page (eg. consent terms, instructions)
        1. name : str
        2. countdown : float
            - Seconds countdown after start condition met.
        3. form : Any
            - a form to display after the content.
        4. instructions : str
            - Instructions to be displayed for the node
        5. instructions_type : str
            - How the instructions will be displayed
        6. max_submissions : float
            - Maximum number of submissions a user can make for the task.
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
        self.content = content
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
    def __init__(self, form, name, countdown = 0, disabledUntilEnd = None, instructions = None, instructions_type = 'default', max_submissions = 0, media = None, n_pause = None, n_start = None, prerequisite = False, required = True, timer = None, timer_empty = None, timer_pausable = None, timer_pause = None, useSharedState = None, wait_for_ready = None):
        """
        ### Parameters
        0. form : Any
            - Specification of the form to be created.
        1. name : str
        2. countdown : float
            - Seconds countdown after start condition met.
        3. disabledUntilEnd : bool
            - If true, the form will only become active after the media playback ends
        4. instructions : str
            - Instructions to be displayed for the node
        5. instructions_type : str
            - How the instructions will be displayed
        6. max_submissions : float
            - Maximum number of submissions a user can make for the task.
        7. media : Union[Any,Any]
            - Media file to be displayed.
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
    def __init__(self, name, countdown = 0, instructions = None, instructions_type = 'default', max_submissions = 0, n_pause = None, n_start = None, prerequisite = False, required = True, showPhoneField = None, timer = None, timer_empty = None, timer_pausable = None, timer_pause = None, useSharedState = None, wait_for_ready = None):
        """
        ### Parameters
        0. name : str
        1. countdown : float
            - Seconds countdown after start condition met.
        2. instructions : str
            - Instructions to be displayed for the node
        3. instructions_type : str
            - How the instructions will be displayed
        4. max_submissions : float
            - Maximum number of submissions a user can make for the task.
        5. n_pause : float
            - If the number of subjects is n_pause or less, the task will be paused
        6. n_start : float
            - Number of jorneys required to start task
        7. prerequisite : bool
            - Node is marked as a prerrequisite
Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
        8. required : bool
            - If true, this node must have a valid submission before the HIT can be submitted
        9. showPhoneField : bool
            - Media file to be displayed.
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
    def __init__(self, name, allowMute = True, allowScreenShare = True, allowStopVideo = True, countdown = 0, instructions = None, instructions_type = 'default', max_submissions = 0, muted = False, n_pause = None, n_start = None, prerequisite = False, required = True, timer = None, timer_empty = None, timer_pausable = None, timer_pause = None, useSharedState = None, videoOff = False, wait_for_ready = None):
        """
        ### Parameters
        0. name : str
        1. allowMute : bool
            - Allow the user to mute their own audio
        2. allowScreenShare : bool
            - Allow the user to share their screen
        3. allowStopVideo : bool
            - Allow the user to stop their own video
        4. countdown : float
            - Seconds countdown after start condition met.
        5. instructions : str
            - Instructions to be displayed for the node
        6. instructions_type : str
            - How the instructions will be displayed
        7. max_submissions : float
            - Maximum number of submissions a user can make for the task.
        8. muted : bool
            - Videocall is muted
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
        18. videoOff : bool
            - Call is audio only
video is always off
        19. wait_for_ready : bool
            - If true, all journeys must click ready to start the task
        """


        super().__init__()
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

