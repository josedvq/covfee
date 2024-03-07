import { DownOutlined } from "@ant-design/icons"
import Constants from "Constants"
import type { MenuProps } from "antd"
import { Button, Dropdown, MenuInfo, Space } from "antd"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { nodeContext } from "../../journey/node_context"
import { useDispatch } from "../../journey/state"
import VideojsPlayer from "../../players/videojs"
import { TaskExport } from "../../types/node"
import { AllPropsRequired } from "../../types/utils"
import { fetcher } from "../../utils"
import { CovfeeTaskProps } from "../base"
import styles from "./continous_annotation.module.css"
import { State, actions, slice } from "./slice"
import type { AnnotationDataSpec, ContinuousAnnotationTaskSpec } from "./spec"

// You can download this image and place it in the art folder from:
// @helix.ewi.tudelft.nl:/home/kfunesmora/mingle/media
// Do not commit to the repo for confidentiality reasons.
import ConflabGallery from "../../art/conflab-gallery.svg"

interface Props extends CovfeeTaskProps<ContinuousAnnotationTaskSpec> {}

const REGISTER_ACTION_ANNOTATION_KEY: string = "s"
const UNINITIALIZED_ACTION_ANNOTATION_START_TIME: null = null

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

  const dispatch = useDispatch()

  const { node } = React.useContext(nodeContext)

  // Holds the annotations data for this task instance
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

  //-------------------- Server communication -------------------- //
  const fetchAnnotationsServerData = React.useCallback(async () => {
    const url =
      Constants.base_url +
      node.customApiBase +
      `/tasks/${node.id}/annotations/all`
    const res = await fetcher(url)
    setAnnotationsDataMirror(await res.json())
  }, [node.customApiBase, node.id])

  const postActiveAnnotationDataArrayToServer = React.useCallback(async () => {
    if (!validAnnotationsDataAndSelection) {
      return
    }
    if (!activeAnnotationDataArray.needs_upload) {
      return
    }
    console.log("Posting new data to server")
    console.log(activeAnnotationDataArray)
    const active_annotation_data_to_post = {
      ...annotationsDataMirror[selectedAnnotationIndex],
      data_json: activeAnnotationDataArray.buffer,
    }
    try {
      const url =
        Constants.base_url +
        node.customApiBase +
        `/annotations/` +
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
  }, [
    node.customApiBase,
    node.id,
    annotationsDataMirror,
    selectedAnnotationIndex,
    activeAnnotationDataArray,
    validAnnotationsDataAndSelection,
  ])

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

  //-------------------- Video playback -------------------- //

  // this is a custom dispatch function provided by Covfee

  const numberOfVideoFrames = 30 * 1 // TODO: Initialize me on video load

  /******************************************************/
  /***** Logic to create a dummy video playback *********/
  /******************************************************/
  // This is temporary, just to test the annotation flow,
  // and pushing back and forth annotations to the server
  // through the API endpoints
  const DUMMY_VIDEO_NUMBER_OF_FRAMES: number = numberOfVideoFrames
  const [frameNumber, setFrameNumber] = useState(0)
  useEffect(() => {
    let videoPlaybackInterval: NodeJS.Timeout | undefined

    if (isAnnotating) {
      setFrameNumber(0)
      videoPlaybackInterval = setInterval(() => {
        // Increment the seconds state every second
        setFrameNumber((prevFrameNumber) => prevFrameNumber + 1)
      }, 33)
    }

    // Clean up the interval when the component unmounts or when the timer stops
    return () => clearInterval(videoPlaybackInterval)
  }, [isAnnotating]) // Run the effect whenever isRunning changes

  // TODO: Implement these functions video playback logic
  const getCurrentVideoTime = React.useCallback(() => {
    return frameNumber / 30.0
  }, [frameNumber])

  const getCurrentVideoFramerate = React.useCallback(() => {
    return 30.0
  }, [])
  /******************************************************/
  /******************************************************/

  const my_video = {
    type: "video",
    url: "https://mdn.github.io/learning-area/html/multimedia-and-embedding/video-and-audio-content/rabbit320.mp4",
  }

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
    console.log("Index ", first_annotation_index_for_participant)
    if (first_annotation_index_for_participant !== -1) {
      dispatch(
        actions.setSelectedAnnotationIndex(
          first_annotation_index_for_participant
        )
      )
    }
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
              onClick: (item: MenuInfo) => {
                dispatch(actions.setSelectedAnnotationIndex(item.key))
              },
            }))
        : [],
    },
  ]

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
    fetchAnnotationsServerData()
  }, [fetchAnnotationsServerData])

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
        const grid_size_x = 6
        const grid_size_y = 8
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

  /****************** Annotation process logic *************** */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (isAnnotating && event.key === REGISTER_ACTION_ANNOTATION_KEY) {
        // If there isn't an ongoing annotation already... (note that
        // holding the key leads to multiple event calls)
        if (
          actionAnnotationStartTime ===
          UNINITIALIZED_ACTION_ANNOTATION_START_TIME
        ) {
          const currentVideoTime = getCurrentVideoTime()
          setActionAnnotationStartTime(currentVideoTime)
          console.log("Annotation started at", currentVideoTime)
        }
      }
    },
    [actionAnnotationStartTime, getCurrentVideoTime, isAnnotating]
  )

  const registerActionAnnotationStopped = useCallback(() => {
    // If we are annotating, we set the activeAnnotationDataArray to 1 for the
    // corresponding time range
    console.log(
      "Registering action annotation stopped",
      actionAnnotationStartTime
    )
    if (
      actionAnnotationStartTime !== UNINITIALIZED_ACTION_ANNOTATION_START_TIME
    ) {
      const currentVideoTime = getCurrentVideoTime()
      console.log("Annotation ended at", currentVideoTime)
      // Based on the registered annotation start time and framerate, we get
      // the corresponding frame time.
      const startFrameIndex = Math.round(
        actionAnnotationStartTime * getCurrentVideoFramerate()
      )
      // Similarly, we retrieve the current frame number
      const endFrameIndex = Math.min(
        Math.round(getCurrentVideoTime() * getCurrentVideoFramerate()),
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
        // We similarly clear out annotation start time
        setActionAnnotationStartTime(-1)
      }
    }
  }, [
    actionAnnotationStartTime,
    activeAnnotationDataArray,
    getCurrentVideoTime,
    getCurrentVideoFramerate,
  ])

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (isAnnotating && event.key === REGISTER_ACTION_ANNOTATION_KEY) {
        registerActionAnnotationStopped()
      }
    },
    [isAnnotating, registerActionAnnotationStopped]
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

  // ---- Higher level annotation status logic ------ //
  const toggleAnnotatingStatus = () => {
    if (!isAnnotating) {
      if (!validAnnotationsDataAndSelection) {
        return
      }
      setActiveAnnotationDataArray({
        buffer: Array.from({ length: numberOfVideoFrames }, () => 0),
        needs_upload: false,
      })
    }
    setIsAnnotating(!isAnnotating)
  }

  const handleVideoEnded = useCallback(() => {
    if (isAnnotating) {
      console.log("Video ended. Stopping annotation")
      registerActionAnnotationStopped()
      setActiveAnnotationDataArray((prevActiveAnnotationDataArray) => {
        return { ...prevActiveAnnotationDataArray, needs_upload: true }
      })
    }
  }, [isAnnotating, registerActionAnnotationStopped])

  useEffect(() => {
    if (activeAnnotationDataArray.needs_upload) {
      postActiveAnnotationDataArrayToServer()
    }
  }, [activeAnnotationDataArray, postActiveAnnotationDataArrayToServer])

  // Dummy video logic
  useEffect(() => {
    if (frameNumber >= DUMMY_VIDEO_NUMBER_OF_FRAMES) {
      console.log("Stopping the video playback")
      handleVideoEnded()
      setIsAnnotating(false)
    }
  }, [frameNumber, handleVideoEnded])

  const handleNewFrameIndex = (frame_index: number) => {}

  useEffect(() => {
    handleNewFrameIndex(frameNumber)
  }, [frameNumber])

  // and we render the component
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
            <Button
              onClick={(e) => {
                e.preventDefault()
              }}
              className={styles["action-task-dropwdown-button"]}
            >
              <span className={styles["action-task-dropdown-button-text"]}>
                <Space>
                  {validAnnotationsDataAndSelection
                    ? annotationsDataMirror[selectedAnnotationIndex].participant
                    : ""}
                </Space>
              </span>
              <DownOutlined
                className={styles["action-task-dropwdown-button-icon"]}
              />
            </Button>
          </Dropdown>
          <h1>Select an action to annotate:</h1>
          <Dropdown menu={{ items: annotations_menu_items, selectable: true }}>
            <Button
              onClick={(e) => {
                e.preventDefault()
              }}
              className={styles["action-task-dropwdown-button"]}
            >
              <span className={styles["action-task-dropdown-button-text"]}>
                <Space>
                  {/* <CheckOutlined /> */}
                  {validAnnotationsDataAndSelection
                    ? annotationsDataMirror[selectedAnnotationIndex]?.category
                    : ""}
                </Space>
              </span>
              <DownOutlined
                className={styles["action-task-dropwdown-button-icon"]}
              />
            </Button>
          </Dropdown>
          <div className={styles.sidebarBottom}>
            <p>{frameNumber}</p>
            <Button
              type="primary"
              className={styles["gallery-button"]}
              onClick={toggleAnnotatingStatus}
            >
              {isAnnotating ? "Stop Annotation" : "Start Annotation"}
            </Button>
            <Button
              type="primary"
              className={styles["gallery-button"]}
              onClick={() => {
                setShowingGallery(true)
              }}
            >
              Gallery
            </Button>
          </div>
        </div>
        <div className={styles.main_content}>
          <>
            <h3>Node data:</h3>
            <p>{JSON.stringify(node)}</p>

            <p>
              URL of the task API is {Constants.api_url + node.customApiBase}
            </p>

            <h3>Annotations in the database:</h3>
            <p>{JSON.stringify(annotationsDataMirror)}</p>
          </>
          <VideojsPlayer
            className={styles.videoPlayer}
            // {...args.spec.media}
            {...my_video}
            // onEnded={actions.enableForm}
          />
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
