import React, { useEffect, useRef } from "react"
// You can download this image and place it in the art folder from:
// @covfee.ewi.tudelft.nl:/home/kfunesmora/conflab-media/
// Do not commit to the repo for confidentiality reasons.

// You can download this image and place it in the art folder from:
// @covfee.ewi.tudelft.nl:/home/kfunesmora/conflab-media/
// Do not commit to the repo for confidentiality reasons.
import ConflabGallery from "../../art/conflab-gallery.svg"
// Hardcoding the size of the viewport of the original svg, which couldn't find
// a way to retrieve by code.
const CONFLAB_SVG_ORIGINAL_SIZE = { width: 1427.578, height: 1496.532 }
const grid_size_x = 6
const grid_size_y = 8

import styles from "./continous_annotation.module.css"

type ParticipantImageProps = {
  participant: string
}

const SelectedParticipantImage: React.FC<ParticipantImageProps> = (props) => {
  const computeViewBoxOnGalleryToCropSelectedParticipant = () => {
    const gallerySVGCellWidth = CONFLAB_SVG_ORIGINAL_SIZE.width / grid_size_x
    const gallerySVGCellHeight = CONFLAB_SVG_ORIGINAL_SIZE.height / grid_size_y

    const participant_id = parseInt(props.participant.split("_")[1])
    const cell_id =
      participant_id <= 37 ? participant_id - 1 : participant_id - 3
    const cell_x = cell_id % grid_size_x
    const cell_y = Math.floor(cell_id / grid_size_x)
    const gallerySVGCellX = cell_x * gallerySVGCellWidth
    const gallerySVGCellY = cell_y * gallerySVGCellHeight

    return `${gallerySVGCellX} ${gallerySVGCellY} ${gallerySVGCellWidth} ${gallerySVGCellHeight}`
  }

  return (
    <svg
      viewBox={computeViewBoxOnGalleryToCropSelectedParticipant()}
      width="100%"
      className={styles["selected-participant-svg"]}
    >
      <ConflabGallery />
    </svg>
  )
}

type ParticipantGalleryProps = {
  open: boolean
  onCancel: () => void
  onParticipantSelected: (participant: string) => void
}

const ModalParticipantSelectionGallery: React.FC<ParticipantGalleryProps> = (
  props
) => {
  /***
  This Component implements a modal overlay of participants which is
  clickable to select a participant. It is used in the continuous annotation
  */

  // We use a Ref to know to which DOM element to redirect the keyboard focus
  // and as to capture key press events. Also, to retrieve the geometry of the
  // underlying gallery svg image.
  const galleryOverlayRef = useRef(null)
  useEffect(() => {
    if (props.open && galleryOverlayRef.current) {
      galleryOverlayRef.current.focus()
    }
  }, [props.open])

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
        props.onParticipantSelected("Participant_" + participant_id)
      }
    }
  }

  if (props.open) {
    return (
      <div
        className={styles["gallery-overlay"]}
        onKeyDown={(e) => {
          e.preventDefault()
          if (e.key === "Escape") {
            props.onCancel()
          }
        }}
        tabIndex={-1}
        ref={galleryOverlayRef}
      >
        <h1 className={styles["disabled-instructions-text"]}>
          Click on the participant to select or Press ESC to close
        </h1>
        <ConflabGallery
          className={styles["gallery-overlay-image"]}
          onClick={handleClickOnGalleryImage}
        />
      </div>
    )
  } else {
    return null
  }
}

export { ModalParticipantSelectionGallery, SelectedParticipantImage }
