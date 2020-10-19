import ContinuousKeypointTask from './continuous_keypoint'
import Continuous1DTask from './continuous_1d'
import QuestionnaireTask from './questionnaire'
import InstructionsTask from './instructions'
import Task from './task'

// these will be available in source code:
export { 
    Task, 
    ContinuousKeypointTask, 
    Continuous1DTask,
    QuestionnaireTask,
    InstructionsTask
}

// these will be visible to the covfee interface:
export default {
    'ContinuousKeypointTask': ContinuousKeypointTask,
    'Continuous1DTask': Continuous1DTask,
    'QuestionnaireTask': QuestionnaireTask,
    'InstructionsTask': InstructionsTask
}