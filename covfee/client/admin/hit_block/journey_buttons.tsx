import { ApiOutlined, LinkOutlined, WechatOutlined } from "@ant-design/icons"
import { Modal, Tooltip } from "antd"
import classNames from "classnames"
import * as React from "react"
import { styled } from "styled-components"
import { chatContext } from "../../chat_context"
import { useJourneyFns } from "../../models/Journey"
import { JourneyType } from "../../types/journey"
import { JourneyStatusToColor, StatusIcon, getJourneyStatus } from "../utils"
import { ButtonsContainer } from "./utils"
const { confirm } = Modal

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
  const { addChats, setActiveChatId, setChatOpen } =
    React.useContext(chatContext)
  const { getUrl, disable } = useJourneyFns(journey)

  const onChatSelect = React.useCallback(() => {
    addChats([journey.chat_id]).then(() => {
      setActiveChatId(journey.chat_id)
      setChatOpen(true)
    })
  }, [journey.chat_id])

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
          <Tooltip title="Chat with this journey/subject privately.">
            <button onClick={onChatSelect}>
              <WechatOutlined />
            </button>
          </Tooltip>
        </li>

        {/* <li>
          <Tooltip title="Disable this journey. The URL will be invalidated.">
            <button
              onClick={() => {
                confirm({
                  title: "Are you sure you want to disable this journey?",
                  content:
                    "Disabled journeys will display an error when opened. Current users will be stopped. This operation is not reversible.",
                  onOk() {
                    disable()
                  },
                  onCancel() {},
                })
              }}
            >
              <DeleteOutlined />
            </button>
          </Tooltip>
        </li> */}
      </ButtonsContainer>
    </li>
  )
}

const LinkContainer = styled.span``
