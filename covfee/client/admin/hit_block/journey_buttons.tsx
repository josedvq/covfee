import * as React from "react"
import { JourneyType } from "../../types/journey"
import { Modal } from "antd"
const { confirm } = Modal
import {
  DeleteOutlined,
  LinkOutlined,
  PauseOutlined,
  WechatOutlined,
} from "@ant-design/icons"
import { useJourneyFns } from "../../models/Journey"
import { JourneyStatusToColor, StatusIcon, getJourneyStatus } from "../utils"
import classNames from "classnames"
import { chatContext } from "../../chat_context"
import { ButtonsContainer } from "./utils"

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

  return (
    <li
      onMouseOver={onFocus}
      onMouseOut={onBlur}
      className={classNames({ focus })}
    >
      <a href={getUrl()}>
        <span>
          <StatusIcon color={JourneyStatusToColor[getJourneyStatus(journey)]} />
        </span>
        <span>
          {journey.id.substring(0, 10)} [{journey.num_connections}]
        </span>{" "}
        <LinkOutlined />
      </a>
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
