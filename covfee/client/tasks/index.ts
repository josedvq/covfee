import { TaskExport } from "types/node"
import QuestionnaireTask from "./questionnaire"
import InstructionsTask from "./instructions"
import IncrementCounterTask from "./increment_counter"
import VideocallTask from "./videocall"
import TutorialTask from "./tutorial"
import ActionAnnotationTask from "./action_annotation"

// these will be available in source code:
export {
  VideocallTask,
  QuestionnaireTask,
  InstructionsTask,
  IncrementCounterTask,
  TutorialTask,
  ActionAnnotationTask
}

// these will be visible to the covfee interface:
export default {
  QuestionnaireTask,
  InstructionsTask,
  IncrementCounterTask,
  VideocallTask,
  TutorialTask,
  ActionAnnotationTask,
} as Record<string, TaskExport>
