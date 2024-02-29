import * as React from "react"
import { JourneyType } from "../../types/journey"
import { Modal } from "antd"
const { confirm } = Modal
import {
  ApiOutlined,
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
import { styled } from "styled-components"

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
        <span>{journey.id.substring(0, 10)}</span> <LinkOutlined />
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

const LinkContainer = styled.span``
