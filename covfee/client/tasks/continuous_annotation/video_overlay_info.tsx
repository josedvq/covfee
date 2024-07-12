import React from "react"
import { REGISTER_ACTION_ANNOTATION_KEY } from "./constants"
import styles from "./continous_annotation.module.css"

type Props = {
  active: boolean
  annotation_category: string
}

const VideoOverlayInfo: React.FC<Props> = (props) => {
  return (
    <div
      className={`${styles["action-annotation-flashscreen"]} ${
        props.active
          ? styles["action-annotation-flashscreen-active-key-pressed"]
          : styles["action-annotation-flashscreen-active-key-not-pressed"]
      }`}
    >
      <h1>
        {props.active ? "" : "NOT"} {props.annotation_category}
      </h1>
      <h1>{" (Key: " + REGISTER_ACTION_ANNOTATION_KEY + ")"}</h1>
    </div>
  )
}

export default VideoOverlayInfo
