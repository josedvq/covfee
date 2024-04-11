import {
  ApiOutlined,
  DeleteOutlined,
  LinkOutlined,
  PauseOutlined,
  WechatOutlined,
} from "@ant-design/icons"
import { Modal } from "antd"
import classNames from "classnames"
import * as React from "react"
import { styled } from "styled-components"
import { chatContext } from "../../chat_context"
import { fetchAnnotator, useJourneyFns } from "../../models/Journey"
import { JourneyType } from "../../types/journey"
import { JourneyStatusToColor, StatusIcon, getJourneyStatus } from "../utils"
import { ButtonsContainer } from "./utils"
const { confirm } = Modal

interface Annotator {
  prolific_id: string
  created_at: Date
}

type JourneyRowProps = {
  journey: JourneyType
  focus: boolean
  onFocus: () => void
  onBlur: () => void
}
export const JourneyRow = ({
  journey,
  focus,
  onFocus,
  onBlur,
}: JourneyRowProps) => {
  const { addChats } = React.useContext(chatContext)
  const { getUrl } = useJourneyFns(journey)
  const [annotator, setAnnotator] = React.useState<Annotator>(null)

  React.useEffect(() => {
    fetchAnnotator(journey.id).then((payload) => {
      if (Object.keys(payload).length === 0) {
        return
      }
      console.log(
        `loaded prolific id ${payload.prolific_pid}, created_at ${payload.created_at}`
      )
      var date = new Date(payload.created_at)
      date.setMilliseconds(0) // Ignore milliseconds
      setAnnotator({
        prolific_id: payload.prolific_pid,
        created_at: date,
      } as Annotator)
    })
  }, [journey])

  return (
    <li
      onMouseOver={onFocus}
      onMouseOut={onBlur}
      className={classNames({ focus })}
    >
      <a href={getUrl()}>
        <LinkContainer>
          <StatusIcon color={JourneyStatusToColor[getJourneyStatus(journey)]} />

          <span
            style={{
              color:
                journey.num_connections == 0
                  ? "gray"
                  : journey.num_connections == 1
                  ? "green"
                  : "red",
            }}
          >
            <ApiOutlined />
          </span>
        </LinkContainer>
        <span> </span>
        <span>{journey.id.substring(0, 10)} </span> <LinkOutlined />
      </a>
      {annotator != null && (
        <ul>
          <li>Prolific PID: &quot;{annotator.prolific_id}&quot;</li>
          <li>Start date: {annotator.created_at.toLocaleString()}</li>
        </ul>
      )}
      <ButtonsContainer>
        <li>
          <button
            onClick={() => {
              addChats([journey.chat_id])
            }}
          >
            <WechatOutlined />
          </button>
        </li>
        <li>
          <button
            onClick={() => {
              confirm({
                title: "Are you sure you want to pause this journey?",
                content: "All nodes in the journey will be paused.",
                onOk() {},
                onCancel() {},
              })
            }}
          >
            <PauseOutlined />
          </button>
        </li>
        <li>
          <button
            onClick={() => {
              confirm({
                title: "Are you sure you want to delete this journey?",
                content:
                  "Deleted journeys will display a 404 error when opened. Current users will be stopped.",
                onOk() {},
                onCancel() {},
              })
            }}
          >
            <DeleteOutlined />
          </button>
        </li>
      </ButtonsContainer>
    </li>
  )
}

const LinkContainer = styled.span``
