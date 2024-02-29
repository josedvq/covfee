import React, { useState, useRef, useEffect } from "react";
import { slice, actions, State } from "./slice";
import { TaskExport } from "../../types/node";
import { CovfeeTaskProps } from "../base";
import type { ActionAnnotationTaskSpec } from "./spec";
import { AllPropsRequired } from "../../types/utils";
import { useDispatch } from "../../journey/state";
import { useSelector } from "react-redux";
import VideojsPlayer from "../../players/videojs";
import type { MenuProps } from "antd";
import { Dropdown, Menu, Space, MenuInfo, Button } from "antd";
import { DownOutlined } from "@ant-design/icons";
import styles from "./action_annotation.module.css";

// You can download this image and place it in the art folder from:
// @helix.ewi.tudelft.nl:/home/kfunesmora/mingle/media
// Do not commit to the repo for confidentiality reasons.
import ConflabGallery from "../../art/conflab-gallery.svg";

interface Props extends CovfeeTaskProps<ActionAnnotationTaskSpec> {}

// Declare constants with the participants expected in the task, as well
// as the annotation types to be made
const ANNOTATION_TYPES: string[] = ["speaking", "laughing"];
const PARTICIPANTS_LIST: string[] = [];
for (let i = 1; i < 51; i++) {
  PARTICIPANTS_LIST.push("Participant_" + i);
}

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

  // this is a custom dispatch function provided by Covfee
  const dispatch = useDispatch();

  // we read the state using useSelector
  const mediaPaused = useSelector<State, boolean>((state) => state.mediaPaused);
  const annotations = useSelector<State, Record<string, boolean[]>>(
    (state) => state.annotations
  );
  const active_annotation = useSelector<State, string>(
    (state) => state.active_annotation
  );
  const active_participant = useSelector<State, string>(
    (state) => state.active_participant
  );
  const [showingGallery, setShowingGallery] = useState(false);

  const my_video = {
    type: "video",
    url: "https://mdn.github.io/learning-area/html/multimedia-and-embedding/video-and-audio-content/rabbit320.mp4",
  };

  // We prepare the annotations options
  const annotations_menu_items: MenuProps["items"] = [
    {
      key: "1",
      type: "group",
      label: "Select annotation",
      children: ANNOTATION_TYPES.map((annotation_type) => ({
        key: annotation_type,
        label: annotation_type,
        onClick: (item: MenuInfo) => {
          dispatch(actions.setActiveAnnotation(item.key));
        },
      })),
    },
  ];

  // We prepare the annotations options
  const participants_menu_items: MenuProps["items"] = [
    {
      key: "1",
      type: "group",
      label: "Select participant",
      children: PARTICIPANTS_LIST.map((participant_available) => ({
        key: participant_available,
        label: participant_available,
        onClick: (item: MenuInfo) => {
          dispatch(actions.setActiveParticipant(item.key));
        },
      })),
    },
  ];

  // We use a Ref to know to which DOM element to redirect the keyboard focus
  // and as to capture key press events. Also, to retrieve the geometry of the
  // underlying gallery svg image.
  const galleryOverlayRef = useRef(null);
  useEffect(() => {
    if (showingGallery && galleryOverlayRef.current) {
      galleryOverlayRef.current.focus();
    }
  }, [showingGallery]);

  // TODO: Confider moving the gallery overlay into a unique component.
  const handleClickOnGalleryImage = (e: MouseEvent) => {
    // Based on the known gallery image of participants, we calculate in which
    // participant the click is falling in.
    if (galleryOverlayRef.current) {
      const galleryOverlayImageElement =
        galleryOverlayRef.current.querySelectorAll("svg")[0];
      if (galleryOverlayImageElement) {
        const grid_size_x = 6;
        const grid_size_y = 8;
        var imageRect = galleryOverlayImageElement.getBoundingClientRect();
        var cell_x = Math.floor(
          (grid_size_x * (e.clientX - imageRect.left)) / imageRect.width
        );
        var cell_y = Math.floor(
          (grid_size_y * (e.clientY - imageRect.top)) / imageRect.height
        );
        let participant_id: number = cell_y * grid_size_x + cell_x + 1;
        if (participant_id >= 38) {
          participant_id += 2;
        }
        dispatch(actions.setActiveParticipant("Participant_" + participant_id));
      }
      setShowingGallery(false);
    }
  };

  // and we render the component
  return (
    <form>
      {showingGallery && (
        <div
          className={styles["gallery-overlay"]}
          onKeyDown={(e) => {
            e.preventDefault();
            if (e.key === "Escape") {
              setShowingGallery(false);
            }
          }}
          tabIndex={-1}
          ref={galleryOverlayRef}
        >
          <h1>Press ESC to close or click on the participant to annotate</h1>
          <ConflabGallery
            className={styles["gallery-overlay-image"]}
            onClick={handleClickOnGalleryImage}
          />
        </div>
      )}
      <div className={styles.action_annotation_task}>
        <div className={styles.sidebar}>
          <h1>Select a participant:</h1>
          <Dropdown
            menu={{
              items: participants_menu_items,
              selectable: true,
              className: styles["action-task-dropdown-menu"],
            }}
            className={styles["action-task-dropdown"]}
          >
            <a
              onClick={(e) => {
                e.preventDefault();
              }}
              className={styles["action-task-dropwdown-button"]}
            >
              <Space>
                {active_participant}
                <DownOutlined />
              </Space>
            </a>
          </Dropdown>
          <h1>Select an action to annotate:</h1>
          <Dropdown menu={{ items: annotations_menu_items, selectable: true }}>
            <a
              onClick={(e) => {
                e.preventDefault();
              }}
              className={styles["action-task-dropwdown-button"]}
            >
              <Space>
                {active_annotation}
                <DownOutlined />
              </Space>
            </a>
          </Dropdown>
          <div className={styles.sidebarBottom}>
            <Button
              type="primary"
              className={styles["gallery-button"]}
              onClick={() => {
                setShowingGallery(true);
              }}
            >
              Gallery
            </Button>
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
