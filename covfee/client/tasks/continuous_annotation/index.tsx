import {
  BorderOutlined,
  CheckSquareTwoTone,
  DownOutlined,
  ExclamationCircleOutlined,
  ExportOutlined,
} from "@ant-design/icons"
import Constants from "Constants"
import type { MenuProps } from "antd"
import { Button, Dropdown, MenuInfo, Modal, Progress, Space } from "antd"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { VideoJsPlayer } from "video.js"
import { nodeContext } from "../../journey/node_context"
import { useDispatch } from "../../journey/state"
import VideoJSFC from "../../players/videojsfc"
import { TaskExport } from "../../types/node"
import { AllPropsRequired } from "../../types/utils"
import { fetcher } from "../../utils"
import { CovfeeTaskProps } from "../base"
import CamViewSelection from "./camview_selection"
import styles from "./continous_annotation.module.css"
import { State, actions, slice } from "./slice"
import type { AnnotationDataSpec, ContinuousAnnotationTaskSpec } from "./spec"

// You can download this image and place it in the art folder from:
// @covfee.ewi.tudelft.nl:/home/kfunesmora/conflab-media/
// Do not commit to the repo for confidentiality reasons.
import ConflabGallery from "../../art/conflab-gallery.svg"
// Hardcoding the size of the viewport of the original svg, which couldn't find
// a way to retrieve by code.
const CONFLAB_SVG_ORIGINAL_SIZE = { width: 1427.578, height: 1496.532 }
const grid_size_x = 6
const grid_size_y = 8

interface Props extends CovfeeTaskProps<ContinuousAnnotationTaskSpec> {}

const REGISTER_ACTION_ANNOTATION_KEY: string = "s"
const UNINITIALIZED_ACTION_ANNOTATION_START_TIME: null = null
const CHANGE_VIEW_UP_KEY: string = "ArrowUp"
const CHANGE_VIEW_DOWN_KEY: string = "ArrowDown"
const CAMVIEW_SELECTION_LAYOUT_IS_VERTICAL: boolean = true
const CAMVIEW_SELECTION_NUMBER_OF_VIEWS: number = 5
const VIDEO_PLAYBACK_ASSUMED_FRAMERATE: number = 60.0

/**
 * We specify the data structure for the annotation data received from the server
 */
type AnnotationData = AnnotationDataSpec & {
  id: number
  data_json: number[]
}

type ActionAnnotationDataArray = {
  buffer: number[]
  needs_upload: boolean
}

const ContinuousAnnotationTask: React.FC<Props> = (props) => {
  // here we set the defaults for the task props
  // we could use useMemo to avoid recomputing on every render
  const args: AllPropsRequired<Props> = {
    ...props,
    spec: {
      userCanAdd: true,
      ...props.spec,
    },
  }

  // this is a custom dispatch function provided by Covfee
  const dispatch = useDispatch()
  const { node } = React.useContext(nodeContext)

  //*************************************************************//
  //------------------ States definition -------------------- //
  //*************************************************************//
  const [annotationsDataMirror, setAnnotationsDataMirror] =
    React.useState<AnnotationData[]>()
  // we read the state using useSelector
  const selectedAnnotationIndex: number = useSelector<State, number | null>(
    (state) => state.selectedAnnotationIndex
  )
  const [showingGallery, setShowingGallery] = useState(false)
  const [isAnnotating, setIsAnnotating] = useState(false)
  const [actionAnnotationStartTime, setActionAnnotationStartTime] = useState<
    number | null
  >(UNINITIALIZED_ACTION_ANNOTATION_START_TIME)
  const [selectedCamViewIndex, setSelectedCamViewIndex] = useState(0)
  const [activeAnnotationDataArray, setActiveAnnotationDataArray] =
    React.useState<ActionAnnotationDataArray>({
      buffer: [],
      needs_upload: false,
    })

  const validAnnotationsDataAndSelection: boolean =
    annotationsDataMirror !== undefined &&
    selectedAnnotationIndex !== null &&
    selectedAnnotationIndex >= 0 &&
    selectedAnnotationIndex < annotationsDataMirror.length

  var isEntireTaskCompleted = false
  var numberOfAnnotationsCompleted = 0
  var numberOfAnnotations = 0
  if (annotationsDataMirror !== undefined) {
    isEntireTaskCompleted = annotationsDataMirror.every(
      (annotationData: AnnotationData) => annotationData.data_json !== null
    )
    numberOfAnnotations = annotationsDataMirror.length
    numberOfAnnotationsCompleted = annotationsDataMirror.filter(
      (annotationData: AnnotationData) => annotationData.data_json !== null
    ).length
  }
  const [isMarkParticipantModalOpen, setIsMarkParticipantModalOpen] =
    useState(false)

  const selectFirstAvailableAnnotationIndexBasedOnParticipantName = (
    participant: string
  ) => {
    if (annotationsDataMirror === undefined) {
      return
    }
    // Finds the first annotation in the spec that has the participant
    const first_annotation_index_for_participant =
      annotationsDataMirror.findIndex((annotation) => {
        return annotation.participant === participant
      })
    if (first_annotation_index_for_participant !== -1) {
      dispatch(
        actions.setSelectedAnnotationIndex(
          first_annotation_index_for_participant
        )
      )
    }
  }

  //*************************************************************//
  //------------------ Server communication -------------------- //
  //*************************************************************//
  const fetchAnnotationsServerData = React.useCallback(async () => {
    const url =
      Constants.base_url +
      node.customApiBase +
      `/tasks/${node.id}/annotations/all`
    const res = await fetcher(url)
    setAnnotationsDataMirror(await res.json())
  }, [node.customApiBase, node.id])

  // We keep the annotationDataMirror up to date with the server data.
  // Note that given useEffect, this leads to a call immediately when
  // this component is instantiated.
  // Note that fetchAnnotationsServerData is a useCallback, so it is memoized
  // and that function reference is what is being monitored by the useEffect
  React.useEffect(() => {
    fetchAnnotationsServerData()
  }, [fetchAnnotationsServerData])

  const postActiveAnnotationDataArrayToServer = async () => {
    if (!validAnnotationsDataAndSelection) {
      return
    }
    if (!activeAnnotationDataArray.needs_upload) {
      return
    }
    console.log("Posting new data to server", activeAnnotationDataArray)
    const active_annotation_data_to_post = {
      ...annotationsDataMirror[selectedAnnotationIndex],
      data_json: activeAnnotationDataArray.buffer,
    }
    try {
      const url =
        Constants.base_url +
        node.customApiBase +
        "/annotations/" +
        active_annotation_data_to_post.id
      const res = await fetcher(url, {
        method: "UPDATE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(active_annotation_data_to_post),
      })
      if (res.ok) {
        fetchAnnotationsServerData()
      } else {
        console.error("Error posting new data:", res.status)
      }
    } catch (error) {
      console.error("Error posting new data:", error)
    }
    setActiveAnnotationDataArray((prevActiveAnnotationDataArray) => {
      return { ...prevActiveAnnotationDataArray, needs_upload: false }
    })
  }

  // When the activeAnnotationDataArray eventually is observed to have the needs_upload
  // flag set to True, we post the new data to the server
  useEffect(() => {
    if (activeAnnotationDataArray.needs_upload) {
      postActiveAnnotationDataArrayToServer()
    }
  }, [activeAnnotationDataArray, postActiveAnnotationDataArrayToServer])

  // update selectedAnnotationIndex to a reasonable state, for the case in which
  // annotationsDataMirror is undefined, or empty, or when is valid but selectedAnnotationIndex
  // was still uninitialized.
  useEffect(() => {
    if (annotationsDataMirror === undefined) {
      dispatch(actions.setSelectedAnnotationIndex(null))
    } else if (annotationsDataMirror.length === 0) {
      dispatch(actions.setSelectedAnnotationIndex(null))
    } else if (selectedAnnotationIndex === null) {
      dispatch(actions.setSelectedAnnotationIndex(0))
    }
  }, [selectedAnnotationIndex, annotationsDataMirror])

  //*************************************************************//
  //----------- Video playback fuctionality -------------------- //
  //*************************************************************//

  // We get a reference to the VideoJS player and assign event
  // listeners to it.
  const videoPlayerRef = useRef<VideoJsPlayer>(null)
  const handleVideoPlayerReady = (player: VideoJsPlayer) => {
    videoPlayerRef.current = player
  }
  useEffect(() => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.on("ended", handleVideoEnd)
      videoPlayerRef.current.on("loadstart", handleVideoSourceChange)
      return () => {
        videoPlayerRef.current.off("ended", handleVideoEnd)
        videoPlayerRef.current.off("loadstart", handleVideoSourceChange)
      }
    }
  })

  const handleVideoEnd = () => {
    handleAnnotationsOnVideoEndEvent()
    setIsAnnotating(false)
  }

  // We define the options, more specifically the sources, for the video player
  // Note: it's important to memoize the options object to avoid the videojs player
  //       to be reset on every render, except when the selectedCamViewIndex
  //       does change, which trigger a change in the sources, i.e., the video url
  //       being used.
  const videoPlayerOptions = useMemo(() => {
    return {
      autoplay: false,
      controls: false,
      responsive: true,
      fluid: true,
      sources: [props.spec.media[selectedCamViewIndex]],
    }
  }, [props.spec, selectedCamViewIndex])

  // ...and add logic that ensures that video playback status is kept in sync under
  // the selectedCamViewIndex changes. First, we keep track of the playback status.
  const [playbackStatus, setPlaybackStatus] = useState({
    paused: true,
    currentTime: 0.0,
  })
  useEffect(() => {
    // Note: this is triggered when the selectedCamViewIndex changes
    if (videoPlayerRef.current) {
      setPlaybackStatus({
        paused: videoPlayerRef.current.paused(),
        currentTime: videoPlayerRef.current.currentTime(),
      })
    }
  }, [selectedCamViewIndex])

  // ...and then we ensure that the video player is updated with the playback status
  // when the new video source becomes active.
  const handleVideoSourceChange = (newSrc: string) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime(playbackStatus.currentTime)
      if (playbackStatus.paused != videoPlayerRef.current.paused()) {
        if (playbackStatus.paused) {
          videoPlayerRef.current.pause()
        } else {
          videoPlayerRef.current.play()
        }
      }
    }
  }

  const numberOfVideoFrames = () => {
    if (videoPlayerRef.current) {
      return Math.ceil(
        videoPlayerRef.current.duration() * getCurrentVideoFramerate()
      )
    } else {
      return 0
    }
  }

  const startVideoPlayback = (startTimeInSeconds: number) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime(startTimeInSeconds)
      videoPlayerRef.current.play()
    }
  }

  const pauseVideoPlayback = () => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.pause()
    }
  }

  const getCurrentVideoTime = () => {
    if (videoPlayerRef.current) {
      return videoPlayerRef.current.currentTime()
    } else {
      return 0.0
    }
  }

  const getCurrentVideoFramerate = () => {
    if (videoPlayerRef.current) {
      return (
        videoPlayerRef.current.playbackRate() * VIDEO_PLAYBACK_ASSUMED_FRAMERATE
      )
    } else {
      return VIDEO_PLAYBACK_ASSUMED_FRAMERATE
    }
  }

  //********************************************************************//
  //------------- Participant and annnotation menus-------------------- //
  //********************************************************************//

  const participantCompleted = (participant: string) => {
    if (annotationsDataMirror === undefined) {
      return false
    }
    const participant_annotations = annotationsDataMirror.filter(
      (annotation) => annotation.participant === participant
    )
    return participant_annotations.every(
      (annotation) => annotation.data_json !== null
    )
  }

  const annotationCompleted = (index: number) => {
    if (annotationsDataMirror === undefined) {
      return false
    }
    return annotationsDataMirror[index].data_json !== null
  }

  // We prepare the participants options in the menu
  const participants_menu_items: MenuProps["items"] = [
    {
      key: "1",
      type: "group",
      label: "Select participant",
      children: annotationsDataMirror
        ? annotationsDataMirror
            // We filter unique ocurrences of participants
            .filter(
              (annotation, index, self) =>
                index ===
                self
                  .map((self_annotation) => self_annotation.participant)
                  .indexOf(annotation.participant)
            )
            // Those unique occurrences are then mapped into menu items
            .map(({ participant }) => ({
              key: participant,
              label: participant,
              icon: participantCompleted(participant) ? (
                <CheckSquareTwoTone />
              ) : (
                <BorderOutlined />
              ),
              onClick: (item: MenuInfo) => {
                selectFirstAvailableAnnotationIndexBasedOnParticipantName(
                  item.key
                )
              },
            }))
        : [],
    },
  ]

  // We prepare the annotations options
  const annotations_menu_items: MenuProps["items"] = [
    {
      key: "1",
      type: "group",
      label: "Select annotation",
      children: validAnnotationsDataAndSelection
        ? annotationsDataMirror
            // We extend the annotationDataMirror with the index for element
            .map((annotation, annotation_index) => ({
              annotation,
              annotation_index,
            }))
            // We pick the annotations for the currently selected participant (forwarding the original index)
            .filter(
              ({ annotation, annotation_index }) =>
                annotation.participant ===
                annotationsDataMirror[selectedAnnotationIndex].participant
            )
            // Now we transform those into entries for the menu, using the original index as unique identifier (key)
            .map(({ annotation, annotation_index }) => ({
              key: annotation_index,
              label: annotation.category,
              icon: annotationCompleted(annotation_index) ? (
                <CheckSquareTwoTone />
              ) : (
                <BorderOutlined />
              ),
              onClick: (item: MenuInfo) => {
                dispatch(actions.setSelectedAnnotationIndex(item.key))
              },
            }))
        : [],
    },
  ]

  const showAnnotationItems: boolean = validAnnotationsDataAndSelection
    ? annotationsDataMirror.filter(
        (annotation) =>
          annotation.participant ===
          annotationsDataMirror[selectedAnnotationIndex].participant
      ).length > 1
    : false

  //********************************************************************//
  //------------------- Gallery management ---------------------------- //
  //********************************************************************//

  // We use a Ref to know to which DOM element to redirect the keyboard focus
  // and as to capture key press events. Also, to retrieve the geometry of the
  // underlying gallery svg image.
  const galleryOverlayRef = useRef(null)
  useEffect(() => {
    if (showingGallery && galleryOverlayRef.current) {
      galleryOverlayRef.current.focus()
    }
  }, [showingGallery])

  React.useEffect(() => {
    console.log(annotationsDataMirror)
  }, [annotationsDataMirror])

  // TODO: Confider moving the gallery overlay into a unique component.
  const handleClickOnGalleryImage = (e: MouseEvent) => {
    // Based on the known gallery image of participants, we calculate in which
    // participant the click is falling in.
    if (galleryOverlayRef.current) {
      const galleryOverlayImageElement =
        galleryOverlayRef.current.querySelectorAll("svg")[0]
      if (galleryOverlayImageElement) {
        var imageRect = galleryOverlayImageElement.getBoundingClientRect()
        var cell_x = Math.floor(
          (grid_size_x * (e.clientX - imageRect.left)) / imageRect.width
        )
        var cell_y = Math.floor(
          (grid_size_y * (e.clientY - imageRect.top)) / imageRect.height
        )
        let participant_id: number = cell_y * grid_size_x + cell_x + 1
        if (participant_id >= 38) {
          participant_id += 2
        }
        selectFirstAvailableAnnotationIndexBasedOnParticipantName(
          "Participant_" + participant_id
        )
      }
      setShowingGallery(false)
    }
  }

  const computeViewBoxOnGalleryToCropSelectedParticipant = () => {
    const gallerySVGCellWidth = CONFLAB_SVG_ORIGINAL_SIZE.width / grid_size_x
    const gallerySVGCellHeight = CONFLAB_SVG_ORIGINAL_SIZE.height / grid_size_y
    var gallerySVGCellX = 0
    var gallerySVGCellY = 0
    if (validAnnotationsDataAndSelection) {
      const selectedParticipant =
        annotationsDataMirror[selectedAnnotationIndex].participant
      const participant_id = parseInt(selectedParticipant.split("_")[1])
      const cell_id =
        participant_id <= 37 ? participant_id - 1 : participant_id - 3
      const cell_x = cell_id % grid_size_x
      const cell_y = Math.floor(cell_id / grid_size_x)
      gallerySVGCellX = cell_x * gallerySVGCellWidth
      gallerySVGCellY = cell_y * gallerySVGCellHeight
    }
    return `${gallerySVGCellX} ${gallerySVGCellY} ${gallerySVGCellWidth} ${gallerySVGCellHeight}`
  }

  //********************************************************************//
  //----------------- Action annotation logic ------------------------- //
  //********************************************************************//
  const annotateStartEventOfActionAnnotation = () => {
    // If there isn't an ongoing annotation already... (note that
    // holding the key leads to multiple event calls)
    if (
      actionAnnotationStartTime === UNINITIALIZED_ACTION_ANNOTATION_START_TIME
    ) {
      const currentVideoTime = getCurrentVideoTime()
      setActionAnnotationStartTime(currentVideoTime)
    }
  }

  const annotateEndEventOfActionAnnotation = () => {
    // If we are annotating, we set the activeAnnotationDataArray to 1 for the
    // corresponding time range
    if (
      actionAnnotationStartTime !== UNINITIALIZED_ACTION_ANNOTATION_START_TIME
    ) {
      const currentVideoTime = getCurrentVideoTime()
      console.log("Annotation ended at", currentVideoTime)
      const currentVideoFramerate = getCurrentVideoFramerate()
      // Based on the registered annotation start time and framerate, we get
      // the corresponding frame time.
      const startFrameIndex = Math.round(
        actionAnnotationStartTime * currentVideoFramerate
      )
      // Similarly, we retrieve the current frame number
      const endFrameIndex = Math.min(
        Math.round(currentVideoTime * currentVideoFramerate),
        activeAnnotationDataArray.buffer.length
      )
      // We then update the data array for the elements in between start and end time
      if (
        startFrameIndex < activeAnnotationDataArray.buffer.length &&
        endFrameIndex > startFrameIndex
      ) {
        setActiveAnnotationDataArray((prevActiveAnnotationDataArray) => {
          const newActiveAnnotationDataArray =
            prevActiveAnnotationDataArray.buffer.slice()
          newActiveAnnotationDataArray.fill(1, startFrameIndex, endFrameIndex)
          return {
            buffer: newActiveAnnotationDataArray,
            needs_upload: prevActiveAnnotationDataArray.needs_upload,
          }
        })
      }
      // We clear out annotation start time
      setActionAnnotationStartTime(UNINITIALIZED_ACTION_ANNOTATION_START_TIME)
    }
  }

  const handleAnnotationStartOrStopButtonClick = () => {
    if (!isAnnotating) {
      if (!validAnnotationsDataAndSelection) {
        return
      }
      startVideoPlayback(0.0)
      setActiveAnnotationDataArray({
        buffer: Array.from({ length: numberOfVideoFrames() }, () => 0),
        needs_upload: false,
      })
    } else {
      pauseVideoPlayback()
    }
    setIsAnnotating(!isAnnotating)
  }

  const handleAnnotationsOnVideoEndEvent = () => {
    if (isAnnotating) {
      // TODO: Triple check that isAnnotating is not being set to false before this
      // function is called.
      annotateEndEventOfActionAnnotation()
      // Setting the need_upload will trigger the postActiveAnnotationDataArrayToServer
      // function given the useEffect hook with activeAnnotationDataArray as dependency
      setActiveAnnotationDataArray((prevActiveAnnotationDataArray) => {
        return { ...prevActiveAnnotationDataArray, needs_upload: true }
      })
    } else {
      console.log("Annotating is false")
    }
  }

  const handleClickOnParticipantNotAppearingInVideos = () => {
    setActiveAnnotationDataArray({
      buffer: Array.from({ length: 1 }, () => 0),
      needs_upload: true,
    })
    setIsMarkParticipantModalOpen(false)
  }

  //********************************************************************//
  //---------- Keyboard management for Action annotation--------------- //
  //********************************************************************//
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === REGISTER_ACTION_ANNOTATION_KEY) {
        annotateStartEventOfActionAnnotation()
      }
    },
    [actionAnnotationStartTime, getCurrentVideoTime, isAnnotating]
  )

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === REGISTER_ACTION_ANNOTATION_KEY) {
        annotateEndEventOfActionAnnotation()
      }
      // We use the arrow keys to change the selected camera view
      // FIXME: this leads to scrolling the page. However, we expect that the final
      // implementation will have a layout which won't generate a scrollbar while
      // annotating.
      if (event.key == CHANGE_VIEW_UP_KEY) {
        setSelectedCamViewIndex((prevSelectedViewIndex) => {
          return Math.max(0, prevSelectedViewIndex - 1)
        })
      }
      if (event.key == CHANGE_VIEW_DOWN_KEY) {
        setSelectedCamViewIndex((prevSelectedViewIndex) => {
          return Math.min(4, prevSelectedViewIndex + 1)
        })
      }
    },
    [isAnnotating, annotateEndEventOfActionAnnotation]
  )

  // Register the listeners for keyboard events
  React.useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  //********************************************************************//
  //----------------------- JSX rendering logic ------------------------//
  //********************************************************************//
  return (
    <form>
      {showingGallery && (
        <div
          className={styles["gallery-overlay"]}
          onKeyDown={(e) => {
            e.preventDefault()
            if (e.key === "Escape") {
              setShowingGallery(false)
            }
          }}
          tabIndex={-1}
          ref={galleryOverlayRef}
        >
          <h1>Click on the participant to select or Press ESC to close</h1>
          <ConflabGallery
            className={styles["gallery-overlay-image"]}
            onClick={handleClickOnGalleryImage}
          />
        </div>
      )}
      <Modal
        title={
          "Set " +
          (validAnnotationsDataAndSelection
            ? annotationsDataMirror[selectedAnnotationIndex].participant
            : "") +
          " as not appearing in the video(s)"
        }
        open={isMarkParticipantModalOpen}
        onOk={handleClickOnParticipantNotAppearingInVideos}
        onCancel={() => {
          setIsMarkParticipantModalOpen(false)
        }}
        footer={[
          <Button
            key="back"
            onClick={() => {
              setIsMarkParticipantModalOpen(false)
            }}
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleClickOnParticipantNotAppearingInVideos}
          >
            Yes! the participant is not found
          </Button>,
        ]}
      >
        <ul>
          <li>
            I checked all camera views and I can't find this participant .
          </li>
          <li>
            I am mostly certain this participant does not enter any view in the
            middle of playback.
          </li>
        </ul>
      </Modal>
      <div className={styles["action-annotation-task"]}>
        <div className={`${styles["sidebar"]} ${styles["left-sidebar"]}`}>
          <div
            className={styles["sidebar-block"]}
            style={{ borderWidth: isEntireTaskCompleted ? 5 : 1 }}
          >
            <h3 className={styles["action-task-progress-text"]}>
              Task progress
            </h3>
            <Progress
              percent={Math.round(
                (100 * numberOfAnnotationsCompleted) / numberOfAnnotations
              )}
              className={styles["action-task-progress-bar"]}
            />
            {isEntireTaskCompleted && (
              <>
                <p className={styles["action-task-progress-finished-message"]}>
                  Finished! &#x1F389; Your completion code is:
                </p>
                <p className={styles["action-task-progress-code"]}>
                  {props.spec.prolificCompletionCode}
                </p>
                <Button
                  type="primary"
                  icon={<ExportOutlined />}
                  className={styles["action-task-progress-completion-button"]}
                  onClick={(event: MouseEvent) => {
                    window.open(
                      "https://app.prolific.com/submissions/complete?cc=" +
                        props.spec.prolificCompletionCode,
                      "_blank"
                    )
                  }}
                >
                  Take me to Prolific Academic
                </Button>
              </>
            )}
          </div>
          <div className={styles["sidebar-block"]}>
            <h1>Instructions</h1>
            <h2>
              <strong>Step 1: </strong>
              {"Select the camera view where the person below is "}
              <strong>best visible</strong>
              {" using the UP or DOWN keys."}
            </h2>
            <svg
              viewBox={computeViewBoxOnGalleryToCropSelectedParticipant()}
              width="100%"
              className={styles["selected-participant-svg"]}
            >
              <ConflabGallery />
            </svg>
            <h2>
              <strong>Step 2: </strong>
              If you have found the participant and selected the best camera
              view, proceed to Step 3. If you
              <strong> can't find the person at all</strong>, click the button
              below which will open a pop-up asking to confirm that the person
              can't be found. If you confirm, proceed to Step{" "}
              {showAnnotationItems ? "5" : "4"}:
            </h2>
            <Button
              type="primary"
              onClick={() => {
                setIsMarkParticipantModalOpen(true)
              }}
              className={styles["gallery-button"]}
              icon={<ExclamationCircleOutlined />}
              disabled={isAnnotating}
            >
              I can't find this participant!
            </Button>
            {showAnnotationItems && (
              <>
                <h2>
                  <strong>Step 3: </strong> Select an action that hasn't been
                  annotated and continue to Step 4. If all have been annotated,
                  skip to Step 5.
                </h2>
                <Dropdown
                  menu={{ items: annotations_menu_items, selectable: true }}
                  disabled={isAnnotating}
                >
                  <Button
                    onClick={(e) => {
                      e.preventDefault()
                    }}
                    className={styles["action-task-dropwdown-button"]}
                  >
                    <span
                      className={styles["action-task-dropdown-button-text"]}
                    >
                      <Space>
                        {validAnnotationsDataAndSelection &&
                          (annotationCompleted(selectedAnnotationIndex) ? (
                            <CheckSquareTwoTone />
                          ) : (
                            <BorderOutlined />
                          ))}
                        {validAnnotationsDataAndSelection
                          ? annotationsDataMirror[selectedAnnotationIndex]
                              ?.category
                          : ""}
                      </Space>
                    </span>
                    <DownOutlined
                      className={styles["action-task-dropwdown-button-icon"]}
                    />
                  </Button>
                </Dropdown>
              </>
            )}
            <h2>
              <strong>Step {showAnnotationItems ? "4" : "3"}: </strong>
              Start the annotation process. <strong>Get ready! </strong>
              The video will start playing. During playback, press and{" "}
              <strong> hold </strong> the{" "}
              <strong>{`${REGISTER_ACTION_ANNOTATION_KEY.toUpperCase()}`}</strong>{" "}
              key to indicate the person is{" "}
              <strong>
                {validAnnotationsDataAndSelection
                  ? annotationsDataMirror[selectedAnnotationIndex]?.category
                  : ""}
              </strong>
              . Release while they are not (Press{" "}
              <strong>{`${REGISTER_ACTION_ANNOTATION_KEY.toUpperCase()}`}</strong>{" "}
              and try it!). When finished, go to Step{" "}
              {showAnnotationItems ? "3" : "4"}.
            </h2>
            <Button
              type="primary"
              className={styles["gallery-button"]}
              onClick={handleAnnotationStartOrStopButtonClick}
            >
              {isAnnotating ? "Stop Annotation" : "Start Annotation"}
            </Button>
            <h2>
              <strong>Step {showAnnotationItems ? "5" : "4"}: </strong> Select a
              participant that hasn't been annotated. Then, go to Step 1
            </h2>

            <Dropdown
              menu={{
                items: participants_menu_items,
                selectable: true,
                className: styles["action-task-dropdown-menu"],
              }}
              className={styles["action-task-dropdown"]}
              disabled={isAnnotating}
            >
              <Button
                onClick={(e) => {
                  e.preventDefault()
                }}
                className={styles["action-task-dropwdown-button"]}
              >
                <span className={styles["action-task-dropdown-button-text"]}>
                  <Space>
                    {validAnnotationsDataAndSelection &&
                      (participantCompleted(
                        annotationsDataMirror[selectedAnnotationIndex]
                          .participant
                      ) ? (
                        <CheckSquareTwoTone />
                      ) : (
                        <BorderOutlined />
                      ))}
                    {validAnnotationsDataAndSelection
                      ? annotationsDataMirror[selectedAnnotationIndex]
                          .participant
                      : ""}
                  </Space>
                </span>
                <DownOutlined
                  className={styles["action-task-dropwdown-button-icon"]}
                />
              </Button>
            </Dropdown>
            <Button
              type="primary"
              className={styles["gallery-button"]}
              onClick={() => {
                setShowingGallery(true)
              }}
              disabled={isAnnotating}
            >
              Select Participant on Gallery
            </Button>
          </div>
        </div>
        <div className={styles["main-content"]}>
          {/* <VideojsPlayer
            className={styles["main-content-video"]}
            ref={videoPlayerRef}
            // {...args.spec.media}
            {...my_video}
            // onEnded={actions.enableForm}
          /> */}
          <VideoJSFC
            options={videoPlayerOptions}
            onReady={handleVideoPlayerReady}
          />
          <div
            className={`${styles["action-annotation-flashscreen"]} ${
              validAnnotationsDataAndSelection
                ? actionAnnotationStartTime ===
                  UNINITIALIZED_ACTION_ANNOTATION_START_TIME
                  ? styles[
                      "action-annotation-flashscreen-active-key-not-pressed"
                    ]
                  : styles["action-annotation-flashscreen-active-key-pressed"]
                : ""
            }`}
          >
            <h1>
              {validAnnotationsDataAndSelection
                ? actionAnnotationStartTime ===
                  UNINITIALIZED_ACTION_ANNOTATION_START_TIME
                  ? "NOT " +
                    annotationsDataMirror[selectedAnnotationIndex].category
                  : annotationsDataMirror[selectedAnnotationIndex].category
                : ""}
            </h1>
          </div>
          {validAnnotationsDataAndSelection && isAnnotating && (
            <p className={styles["keyboard-action-register-instruction-text"]}>
              {"Press and HOLD the " +
                REGISTER_ACTION_ANNOTATION_KEY.toUpperCase() +
                " key to indicate the participant is " +
                annotationsDataMirror[selectedAnnotationIndex].category +
                ". RELEASE while they are not."}
            </p>
          )}
          {/* <>
            <h3>Node data:</h3>
            <p>{JSON.stringify(node)}</p>

            <p>
              URL of the task API is {Constants.api_url + node.customApiBase}
            </p>

            <h3>Annotations in the database:</h3>
            <p>{JSON.stringify(annotationsDataMirror)}</p>
          </> */}
        </div>
        <div className={`${styles["sidebar"]} ${styles["right-sidebar"]}`}>
          <div className={styles["sidebar-block"]}>
            <h1>Press UP or DOWN to select a camera view</h1>
            <CamViewSelection
              setSelectedView={setSelectedCamViewIndex}
              selectedView={selectedCamViewIndex}
              layoutIsVertical={CAMVIEW_SELECTION_LAYOUT_IS_VERTICAL}
              numberOfViews={CAMVIEW_SELECTION_NUMBER_OF_VIEWS}
            />
            <p style={{ marginTop: "10px" }}>
              Tip: you can change view during the annotation if a participant
              moves to another camera view
            </p>
          </div>
        </div>
      </div>
    </form>
  )
}

export default {
  taskComponent: ContinuousAnnotationTask,
  taskSlice: slice,
  useSharedState: false,
} as TaskExport
