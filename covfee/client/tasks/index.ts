import { TaskExport } from "types/node";
// import ContinuousKeypointTask from './continuous_keypoint'
// import Continuous1DTask from './continuous_1d'
// import ThreeImagesTask from './three_images'
import QuestionnaireTask from "./questionnaire";
import InstructionsTask from "./instructions";
import IncrementCounterTask from "./increment_counter";
// import VideocallTask from './videocall'

// these will be available in source code:
export {
  // ContinuousKeypointTask,
  // Continuous1DTask,
  // ThreeImagesTask,
  QuestionnaireTask,
  InstructionsTask,
  IncrementCounterTask,
};

// these will be visible to the covfee interface:
export default {
  // 'ContinuousKeypointTask': ContinuousKeypointTask,
  // 'Continuous1DTask': Continuous1DTask,
  QuestionnaireTask,
  InstructionsTask,
  // ThreeImagesTask: ThreeImagesTask,
  IncrementCounterTask,
} as Record<string, TaskExport>;
