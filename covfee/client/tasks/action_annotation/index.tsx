import React from "react";
import { slice, actions, State } from "./slice";
import { TaskExport } from "../../types/node";
import { CovfeeTaskProps } from "../base";
import type { ActionAnnotationTaskSpec } from "./spec";
import { AllPropsRequired } from "../../types/utils";
import { useDispatch } from "../../journey/state";
import { useSelector } from "react-redux";
import VideojsPlayer from "../../players/videojs";
import AnnotationTypeDropdown from "../../input/annotation_type_dropdown";
import { MenuProps } from "antd";
import styles from "./action_annotation.module.css";

interface Props extends CovfeeTaskProps<ActionAnnotationTaskSpec> {}

const annotation_types: string[] = ["speaking", "laughing"];

const ActionAnnotationTask: React.FC<Props> = (props) => {
  // here we set the defaults for the task props
  // we could use useMemo to avoid recomputing on every render
  const args: AllPropsRequired<Props> = {
    ...props,
    spec: {
      media: null,
      input: null,
      ...props.spec,
    },
  };

  // we read the state using useSelector
  const mediaPaused = useSelector<State, boolean>((state) => state.mediaPaused);
  const annotations = useSelector<State, Record<string, boolean[]>>(
    (state) => state.annotations
  );
  const active_annotation = useSelector<State, string>(
    (state) => state.active_annotation
  );

  // this is a custom dispatch function provided by Covfee
  const dispatch = useDispatch();

  const my_video = {
    type: "video",
    url: "https://mdn.github.io/learning-area/html/multimedia-and-embedding/video-and-audio-content/rabbit320.mp4",
  };

  // and we render the component
  return (
    <form>
      <div className={styles.action_annotation_task}>
        <div className={styles.sidebar}>
          <AnnotationTypeDropdown
            annotation_types={annotation_types}
            itemClick={(item_key: string) =>
              dispatch(actions.setActiveAnnotation(item_key))
            }
            selected_annotation={active_annotation}
          />
          <div>
            <button
              id="speaking"
              value="speaking"
              onClick={() => dispatch(actions.setActiveAnnotation("speaking"))}
              disabled={active_annotation == "speaking"}
            >
              Speaking
            </button>
          </div>
          <div>
            <button
              id="laughing"
              value="laughing"
              onClick={() => {
                dispatch(actions.setActiveAnnotation("laughing"));
              }}
              disabled={active_annotation == "laughing"}
            >
              Laughing
            </button>
          </div>
        </div>
        <div className={styles.main_content}>
          <VideojsPlayer
            className={styles.videoPlayer}
            // {...args.spec.media}
            {...my_video}
            // onEnded={actions.enableForm}
          />
        </div>
      </div>
    </form>
  );
};

export default {
  taskComponent: ActionAnnotationTask,
  taskSlice: slice,
  useSharedState: false,
} as TaskExport;
