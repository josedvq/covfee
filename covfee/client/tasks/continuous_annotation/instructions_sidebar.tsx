import type { MenuProps } from "antd"
import { Button, Dropdown, MenuInfo, Modal, Space } from "antd"
import React, { useEffect, useState } from "react"
import { SelectedParticipantImage } from "./conflab_participant_selection"

import {
  BorderOutlined,
  CheckSquareTwoTone,
  DownOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons"

import {
  CHANGE_VIEW_NEXT_KEY,
  CHANGE_VIEW_PREV_KEY,
  REGISTER_ACTION_ANNOTATION_KEY,
  TIP_EMOJI,
} from "./constants"

import styles from "./continous_annotation.module.css"

type ParticipantOption = {
  name: string
  completed: boolean
}

type AnnotationOption = {
  category: string
  index?: number
  completed: boolean
}

type Props = {
  selected_participant: ParticipantOption
  selected_annotation: AnnotationOption
  participant_options: ParticipantOption[]
  annotation_options: AnnotationOption[]
  video_tutorial_url?: string

  onCantFindParticipant: () => void
  onParticipantSelected: (participant: string) => void
  onAnnotationSelected: (annotation_index: number) => void
  onStartStopAnnotationClick: () => void
  onOpenParticipantSelectionClick: () => void
  onWatchTutorialVideoClick: () => void
}

const InstructionsSidebar: React.FC<Props> = (props) => {
  // Modal dialogs control
  const [checkingWhetherToRedoAnnotation, setCheckingWhetherToRedoAnnotation] =
    useState(false)
  const [isMarkParticipantModalOpen, setIsMarkParticipantModalOpen] =
    useState(false)

  // We prepare the participants options in the menu
  const participants_menu_items: MenuProps["items"] = [
    {
      key: "1",
      type: "group",
      label: "Select participant",
      children: props.participant_options.map((option: ParticipantOption) => ({
        key: option.name,
        label: option.name,
        icon: option.completed ? <CheckSquareTwoTone /> : <BorderOutlined />,
        onClick: (item: MenuInfo) => {
          props.onParticipantSelected(item.key)
        },
      })),
    },
  ]

  // We prepare the annotations options
  const annotations_menu_items: MenuProps["items"] = [
    {
      key: "1",
      type: "group",
      label: "Select annotation",
      children: props.annotation_options.map((option: AnnotationOption) => ({
        key: option.index,
        label: option.category,
        icon: option.completed ? <CheckSquareTwoTone /> : <BorderOutlined />,
        onClick: (item: MenuInfo) => {
          props.onAnnotationSelected(item.key)
        },
      })),
    },
  ]

  const handleStartRedoAnnotationClick = () => {
    if (props.selected_annotation.completed) {
      setCheckingWhetherToRedoAnnotation(true)
    } else {
      props.onStartStopAnnotationClick()
    }
  }

  useEffect(() => {
    if (checkingWhetherToRedoAnnotation) {
      Modal.confirm({
        title: "Are you sure you want to redo this annotation?",
        okText: "Yes",
        onOk: () => {
          setCheckingWhetherToRedoAnnotation(false)
          props.onStartStopAnnotationClick()
        },
        onCancel: () => {
          setCheckingWhetherToRedoAnnotation(false)
        },
      })
    }
  }, [checkingWhetherToRedoAnnotation])

  const multiple_annotations_for_selected_participant =
    props.annotation_options.length > 1

  return (
    <>
      <Modal
        title={
          "Set " +
          props.selected_participant.name +
          " as not appearing in the video(s)"
        }
        open={isMarkParticipantModalOpen}
        onOk={props.onCantFindParticipant}
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
            onClick={() => {
              props.onCantFindParticipant()
              setIsMarkParticipantModalOpen(false)
            }}
          >
            I'm sure the participant is not found
          </Button>,
        ]}
      >
        <ul>
          <li>
            I checked all camera views and I can't find this participant .
          </li>
          <li>
            I am certain this participant does not enter any view in the middle
            of playback.
          </li>
        </ul>
      </Modal>
      <div className={styles["sidebar-block"]}>
        <h1>Instructions</h1>
        {props.video_tutorial_url && (
          <Button
            type="primary"
            className={styles["gallery-button"]}
            onClick={() => {
              window.open(props.video_tutorial_url, "_blank")
              props.onWatchTutorialVideoClick()
            }}
          >
            Watch Tutorial Video (audio required)
          </Button>
        )}
        <h2>
          <strong>Step 1: </strong>
          {"Select the camera view where the person below is "}
          <strong>best visible</strong>
          {" using the "} {CHANGE_VIEW_PREV_KEY}
          {" or "}
          {CHANGE_VIEW_NEXT_KEY}
          {" keys. You can play the video to help you find the person. "}
        </h2>
        <SelectedParticipantImage
          participant={props.selected_participant.name}
        />

        <h2>
          <strong>Step 2: </strong>
          If you have found the participant and selected the best camera view,
          proceed to Step 3. If you
          <strong> can't find the participant at all</strong>, click the button
          below. A pop-up will appear asking you to confirm that the participant
          can't be found. If you confirm this, proceed to Step
          {multiple_annotations_for_selected_participant ? " 5" : " 4"}.
        </h2>
        <Button
          type="primary"
          onClick={() => {
            setIsMarkParticipantModalOpen(true)
          }}
          className={styles["gallery-button"]}
          icon={<ExclamationCircleOutlined />}
        >
          I can't find this participant!
        </Button>
        {multiple_annotations_for_selected_participant && (
          <>
            <h2>
              <strong>Step 3: </strong> Select an action that hasn't been
              annotated and continue to Step 4. If all have been annotated, skip
              to Step 5.
            </h2>
            <Dropdown
              menu={{ items: annotations_menu_items, selectable: true }}
            >
              <Button
                onClick={(e) => {
                  e.preventDefault()
                }}
                className={styles["action-task-dropwdown-button"]}
              >
                <span className={styles["action-task-dropdown-button-text"]}>
                  <Space>
                    {props.selected_annotation.completed ? (
                      <CheckSquareTwoTone />
                    ) : (
                      <BorderOutlined />
                    )}
                    {props.selected_annotation.category}
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
          <strong>
            Step {multiple_annotations_for_selected_participant ? "4" : "3"}:{" "}
          </strong>
          Start the annotation process. <strong>Get ready! </strong>
          The video will start playing from the beginning. During playback,
          press and <strong> hold </strong> the{" "}
          <strong>{`${REGISTER_ACTION_ANNOTATION_KEY}`}</strong> key to indicate
          the person is <strong>{props.selected_annotation.category}</strong>.
          Release while they are not ({TIP_EMOJI}
          <em>
            You can press <strong>{`${REGISTER_ACTION_ANNOTATION_KEY}`}</strong>{" "}
            right now, before the annotation process starts, to practice!
          </em>
          ). When finished, go to Step{" "}
          {multiple_annotations_for_selected_participant ? "3" : "4"}.
        </h2>
        <Button
          type="primary"
          className={styles["gallery-button"]}
          onClick={handleStartRedoAnnotationClick}
        >
          {props.selected_annotation.completed
            ? "Redo Annotation"
            : "Start Annotation"}
        </Button>
        <h2>
          <strong>
            Step {multiple_annotations_for_selected_participant ? "5" : "4"}:{" "}
          </strong>{" "}
          Select a participant that hasn't been annotated (without a checkmark{" "}
          <CheckSquareTwoTone />
          ). Then, go to Step 1
        </h2>
        <Button
          type="primary"
          className={styles["gallery-button"]}
          onClick={props.onOpenParticipantSelectionClick}
        >
          Select Participant on Gallery
        </Button>
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
                {props.selected_participant.completed ? (
                  <CheckSquareTwoTone />
                ) : (
                  <BorderOutlined />
                )}
                {props.selected_participant.name}
              </Space>
            </span>
            <DownOutlined
              className={styles["action-task-dropwdown-button-icon"]}
            />
          </Button>
        </Dropdown>
      </div>
    </>
  )
}

export { AnnotationOption, InstructionsSidebar, ParticipantOption }
