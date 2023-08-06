export type StartCondition =
  | {
      type: "moment";
      datetime: string;
    }
  | {
      type: "all_journeys";
    }
  | {
      type: "n_journeys";
      n: number;
    };

export type StopCondition =
  | {
      type: "moment";
      datetime: string;
    }
  | {
      type: "timer";
      seconds: number;
    };
/**
 * @TJS-additionalProperties false
 */
export interface BaseNodeSpec {
  /**
   * Name of the task. It is displayed in covfee (eg. "Video 3")
   */
  name: string;
  // /**
  //  * ID of the task. Used (if provided) only to name the download (results) files
  //  */
  // id?: string;
  /**
   * If true, this node must have a valid submission before the HIT can be submitted
   * @default True
   */
  required?: boolean;
  /**
   * Node is marked as a prerrequisite
   * Prerrequisite nodes must be completed before the rests of the nodes in the HIT are revealed.
   * @default False
   */
  prerequisite?: boolean;
  /**
   * Maximum number of submissions a user can make for the task.
   * @default 0
   */
  maxSubmissions?: number;
  /**
   * Instructions to be displayed for the node
   */
  instructions?: string;
  /**
   * How the instructions will be displayed
   * @default 'default'
   */
  instructionsType?: "default" | "popped";

  start?: StartCondition[];

  stop?: StopCondition[];

  useSharedState?: boolean;
}
