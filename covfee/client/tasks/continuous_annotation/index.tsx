import Constants from "Constants"

import { CloseOutlined } from "@ant-design/icons"
import { Button, Checkbox, Modal } from "antd"
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
import ActionAnnotationFlashscreen from "./action_annotation_flashscreen"
import CamViewSelection from "./camview_selection"
import { ModalParticipantSelectionGallery } from "./conflab_participant_selection"

import {
  ABORT_ONGOING_ANNOTATION_KEY,
  CHANGE_VIEW_NEXT_KEY,
  CHANGE_VIEW_PREV_KEY,
  REGISTER_ACTION_ANNOTATION_KEY,
  TIP_EMOJI,
} from "./constants"
import styles from "./continous_annotation.module.css"
import {
  AnnotationOption,
  InstructionsSidebar,
  ParticipantOption,
} from "./instructions_sidebar"
import { State, actions, slice } from "./slice"
import type { AnnotationDataSpec, ContinuousAnnotationTaskSpec } from "./spec"
import TaskProgress from "./task_progress"

interface Props extends CovfeeTaskProps<ContinuousAnnotationTaskSpec> {}

const UNINITIALIZED_ACTION_ANNOTATION_START_TIME: null = null
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
  const [showAnnotationTipsOnStart, setShowAnnotationTipsOnStart] =
    useState(true)
  const [showingAnnotationTips, setShowingAnnotationTips] = useState(false)

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
  var taskCompletionPercentage = 0
  if (annotationsDataMirror !== undefined) {
    isEntireTaskCompleted = annotationsDataMirror.every(
      (annotationData: AnnotationData) => annotationData.data_json !== null
    )
    numberOfAnnotations = annotationsDataMirror.length
    numberOfAnnotationsCompleted = annotationsDataMirror.filter(
      (annotationData: AnnotationData) => annotationData.data_json !== null
    ).length
    taskCompletionPercentage =
      (100 * numberOfAnnotationsCompleted) / numberOfAnnotations
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

  useEffect(() => {
    props.onUpdateProgress(taskCompletionPercentage)
  }, [annotationsDataMirror])

  //*************************************************************//
  //----------- Video playback fuctionality -------------------- //
  //*************************************************************//

  // We get a reference to the VideoJS player and assign event
  // listeners to it.
  const videoPlayerRef = useRef<VideoJsPlayer>(null)
  const handleVideoPlayerReady = (player: VideoJsPlayer) => {
    videoPlayerRef.current = player
    videoPlayerRef.current.volume(0)
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
          videoPlayerRef.current.play().catch((error) => {
            console.log("Error playing video: ", error)
          })
        }
      }
    }
  }

  const numberOfVideoFrames = () => {
    if (videoPlayerRef.current) {
      return Math.round(
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
      if (event.key.toUpperCase() === REGISTER_ACTION_ANNOTATION_KEY) {
        annotateStartEventOfActionAnnotation()
      }
      if (isAnnotating && event.key === ABORT_ONGOING_ANNOTATION_KEY) {
        handleAnnotationStartOrStopButtonClick()
      }
    },
    [actionAnnotationStartTime, getCurrentVideoTime, isAnnotating]
  )

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (event.key.toUpperCase() === REGISTER_ACTION_ANNOTATION_KEY) {
        annotateEndEventOfActionAnnotation()
      }
      // We use the arrow keys to change the selected camera view
      // FIXME: this leads to scrolling the page. However, we expect that the final
      // implementation will have a layout which won't generate a scrollbar while
      // annotating.
      if (event.key.toUpperCase() == CHANGE_VIEW_PREV_KEY) {
        setSelectedCamViewIndex((prevSelectedViewIndex) => {
          return Math.max(0, prevSelectedViewIndex - 1)
        })
      }
      if (event.key.toUpperCase() == CHANGE_VIEW_NEXT_KEY) {
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
  // Participant and annotations for participant options

  let participant_options: ParticipantOption[] = []
  let annotation_options: AnnotationOption[] = []
  if (validAnnotationsDataAndSelection) {
    participant_options = annotationsDataMirror
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
        name: participant,
        completed: participantCompleted(participant),
      }))

    annotation_options = annotationsDataMirror
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
        category: annotation.category,
        index: annotation_index,
        completed: annotationCompleted(annotation_index),
      }))
  }

  React.useEffect(() => {
    if (isAnnotating) {
      setShowingAnnotationTips(showAnnotationTipsOnStart)
    }
  }, [isAnnotating])

  // ********************************************************************//
  //----------------------- JSX rendering logic ------------------------//
  //********************************************************************//
  if (!validAnnotationsDataAndSelection) {
    // We assume that a first selection is done automatically and that the user
    // can't get the component into a state in which there is no valid selection.
    return <h1>Loading...</h1>
  }

  return (
    <form>
      <ModalParticipantSelectionGallery
        /* This is the modal for selecting the participant */
        open={showingGallery}
        onCancel={() => {
          setShowingGallery(false)
        }}
        onParticipantSelected={(participant: string) => {
          selectFirstAvailableAnnotationIndexBasedOnParticipantName(participant)
          setShowingGallery(false)
        }}
      />
      <Modal
        title={
          "Set " +
          annotationsDataMirror[selectedAnnotationIndex].participant +
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
        <div
          className={`${styles["sidebar"]} ${styles["left-sidebar"]} ${
            isAnnotating ? styles["left-sidebar-hidden"] : ""
          }`}
        >
          <TaskProgress
            finished={isEntireTaskCompleted}
            percent={taskCompletionPercentage}
            completionCode={props.spec.prolificCompletionCode}
            renderSubmitButton={props.renderSubmitButton}
          />

          <InstructionsSidebar
            // Current content to display
            selected_participant={{
              name: annotationsDataMirror[selectedAnnotationIndex].participant,
              completed: participantCompleted(
                annotationsDataMirror[selectedAnnotationIndex].participant
              ),
            }}
            selected_annotation={{
              category: annotationsDataMirror[selectedAnnotationIndex].category,
              completed: annotationCompleted(selectedAnnotationIndex),
            }}
            participant_options={participant_options}
            annotation_options={annotation_options}
            // Callbacks
            onCantFindParticipantClick={() => {
              setIsMarkParticipantModalOpen(true)
            }}
            onParticipantSelected={(participant: string) => {
              selectFirstAvailableAnnotationIndexBasedOnParticipantName(
                participant
              )
            }}
            onAnnotationSelected={(index: number) => {
              dispatch(actions.setSelectedAnnotationIndex(index))
            }}
            onStartStopAnnotationClick={handleAnnotationStartOrStopButtonClick}
            onOpenParticipantSelectionClick={() => {
              setShowingGallery(true)
            }}
          />
        </div>
        <div style={{ backgroundColor: "blue" }} /> {/* <--- Filler div */}
        <div className={styles["main-content"]}>
          <div className={styles["main-content-video-and-guide"]}>
            <VideoJSFC
              options={videoPlayerOptions}
              onReady={handleVideoPlayerReady}
            />
            {showingAnnotationTips && (
              <div className={styles["instructions-box-overlay"]}>
                {/* These are the tips we want to make sure the annotator sees while the annotation process is ongoing */}
                <Button
                  type="text"
                  icon={<CloseOutlined style={{ color: "white" }} />}
                  style={{ position: "absolute", top: 0, right: 0 }}
                  onClick={() => {
                    setShowingAnnotationTips(false)
                  }}
                />
                <h2 className={styles["instruction-text-during-annotation"]}>
                  {TIP_EMOJI} Press ESC to abort the ongoing annotation. Don't
                  worry you can start over.
                </h2>
                <h2 className={styles["instruction-text-during-annotation"]}>
                  {TIP_EMOJI} Press {CHANGE_VIEW_PREV_KEY.toUpperCase()} or{" "}
                  {CHANGE_VIEW_NEXT_KEY.toUpperCase()} to change camera if the
                  participant of interest moves out of view.
                </h2>

                <Checkbox
                  style={{
                    color: "white",
                    fontSize: "18px",
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                  }}
                  onChange={(e) =>
                    setShowAnnotationTipsOnStart(!e.target.checked)
                  }
                >
                  Don't show this again
                </Checkbox>
              </div>
            )}
          </div>
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
            <h1>
              Press {CHANGE_VIEW_PREV_KEY.toUpperCase()} or{" "}
              {CHANGE_VIEW_NEXT_KEY.toUpperCase()} to select a camera view
            </h1>
            <CamViewSelection
              setSelectedView={setSelectedCamViewIndex}
              selectedView={selectedCamViewIndex}
              layoutIsVertical={CAMVIEW_SELECTION_LAYOUT_IS_VERTICAL}
              numberOfViews={CAMVIEW_SELECTION_NUMBER_OF_VIEWS}
            />
          </div>
          <div className={styles["sidebar-block"]}>
            <ActionAnnotationFlashscreen
              active={
                actionAnnotationStartTime !==
                UNINITIALIZED_ACTION_ANNOTATION_START_TIME
              }
              annotation_category={
                annotationsDataMirror[selectedAnnotationIndex].category
              }
            />
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
