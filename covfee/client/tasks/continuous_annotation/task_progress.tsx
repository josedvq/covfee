import { Button, Modal, Progress } from "antd"
import React, { useEffect, useState } from "react"

import styles from "./continous_annotation.module.css"

type Props = {
  finished: boolean
  percent: number
  completionCode?: string
  redirectUrl?: string
  submitButtonDisabled: boolean
  onSubmit: () => void
}

const TaskProgress: React.FC<Props> = (props) => {
  const [checkWhetherToSubmitTask, setCheckWhetherToSubmitTask] =
    useState(false)

  useEffect(() => {
    if (checkWhetherToSubmitTask) {
      Modal.confirm({
        title: "Are you sure you want to submit?",
        content: "You won't be able to change your response after you submit.",
        okText: "Submit",
        onOk: () => {
          setCheckWhetherToSubmitTask(false)
          props.onSubmit()
          if (props.redirectUrl) {
            window.location.href = props.redirectUrl
          }
        },
        onCancel: () => {
          setCheckWhetherToSubmitTask(false)
        },
      })
    }
  }, [checkWhetherToSubmitTask])

  return (
    <div
      className={styles["sidebar-block"]}
      style={{ borderWidth: props.finished ? 5 : 1 }}
    >
      <h1 className={styles["action-task-progress-text"]}>Task progress</h1>
      <Progress
        percent={props.percent}
        className={styles["action-task-progress-bar"]}
        format={(percent) => percent.toFixed(1) + "%"}
      />
      {props.finished && (
        <>
          <h1 className={styles["action-task-progress-finished-message"]}>
            All annotations are completed! &#x1F389;
          </h1>
          <p className={styles["action-task-progress-finished-message"]}>
            To finish, click on the Submit button below.
          </p>
          <Button
            onClick={() => {
              setCheckWhetherToSubmitTask(true)
            }}
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

type TaskAlreadyCompletedProps = {
  redirectUrl?: string
}

export const TaskAlreadyCompleted: React.FC<TaskAlreadyCompletedProps> = (
  props
) => {
  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <h2>Your response was already submitted. Thank you!</h2>
        {props.redirectUrl && (
          <Button type="primary" href={props.redirectUrl}>
            Take me to Prolific Academic
          </Button>
        )}
      </div>
    </>
  )
}

export default TaskProgress
