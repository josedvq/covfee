import { Button, Progress } from "antd"
import React from "react"

import styles from "./continous_annotation.module.css"

type Props = {
  finished: boolean
  percent: number
  completionCode: string
  submittButtonCallback: (extraProps?: any) => void
  submitButtonDisabled: boolean
}

const TaskProgress: React.FC<Props> = (props) => {
  return (
    <div
      className={styles["sidebar-block"]}
      style={{ borderWidth: props.finished ? 5 : 1 }}
    >
      <h3 className={styles["action-task-progress-text"]}>Task progress</h3>
      <Progress
        percent={props.percent}
        className={styles["action-task-progress-bar"]}
        format={(percent) => percent.toFixed(1) + "%"}
      />
      {props.finished && (
        <>
          <p className={styles["action-task-progress-finished-message"]}>
            Finished! &#x1F389; Your completion code is:
          </p>
          <p className={styles["action-task-progress-code"]}>
            {props.completionCode}
          </p>
          <Button
            onClick={props.submittButtonCallback}
            type="primary"
            className={styles["gallery-button"]}
            disabled={props.submitButtonDisabled}
          >
            Submit
          </Button>
        </>
      )}
    </div>
  )
}

export default TaskProgress
