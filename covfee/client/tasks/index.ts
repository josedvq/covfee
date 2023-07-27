// import ContinuousKeypointTask from './continuous_keypoint'
// import Continuous1DTask from './continuous_1d'
// import QuestionnaireTask from './questionnaire'
// import InstructionsTask from './instructions'
// import ThreeImagesTask from './three_images'
import { TaskExport } from "types/node";
import IncrementCounterTask from "./increment_counter";
// import VideocallTask from './videocall'

// these will be available in source code:
export {
  // ContinuousKeypointTask,
  // Continuous1DTask,
  // QuestionnaireTask,
  // InstructionsTask,
  // ThreeImagesTask,
  IncrementCounterTask,
};

// these will be visible to the covfee interface:
export default {
  // 'ContinuousKeypointTask': ContinuousKeypointTask,
  // 'Continuous1DTask': Continuous1DTask,
  // 'QuestionnaireTask': QuestionnaireTask,
  // 'InstructionsTask': InstructionsTask,
  // 'ThreeImagesTask': ThreeImagesTask,
  IncrementCounterTask: IncrementCounterTask,
} as Record<string, TaskExport>;
