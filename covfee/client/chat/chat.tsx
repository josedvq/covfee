import React, { useContext } from "react"
import { Chat, ChatMessage, IoChatMessage } from "../types/chat"
import { AllPropsRequired } from "../types/utils"
import { styled } from "styled-components"
import { SendOutlined, WechatOutlined } from "@ant-design/icons"
import classNames from "classnames"
import { Empty } from "antd"
import { appContext } from "../app_context"
import { getHumanFriendlyDateString } from "../utils"
import { chatContext } from "../chat_context"

const getChatName = (chat: Chat) => {
  if (chat.journey_id) {
    return chat.journey_id.substring(0, 10)
  }
  if (chat.node_id) {
    return `Node ${chat.node_id}`
  }
}

export const ChatPopup: React.FC<{}> = (props) => {
  const args: AllPropsRequired<{}> = {
    ...props,
  }

  const { chats, chatOpen, setChatOpen, getNumberUnreadMessages } =
    useContext(chatContext)

  const [currChat, setCurrChat] = React.useState(0)

  return (
    <>
      {chatOpen && (
        <PopupContainer>
          <ChatSelection>
            {chats.map((chat, index) => (
              <button
                key={index}
                className={classNames({ active: currChat == index })}
                onClick={() => {
                  setCurrChat(index)
                }}
              >
                {getChatName(chat)} ({getNumberUnreadMessages(chat.id)})
              </button>
            ))}
          </ChatSelection>
          {chats.length && <Chatbox chat={chats[currChat]} />}
        </PopupContainer>
      )}
      <ChatButton
        onClick={() => {
          setChatOpen(!chatOpen)
        }}
        $chatOpen
      >
        <WechatOutlined />
      </ChatButton>
    </>
  )
}

const PopupContainer = styled.div<any>`
  position: fixed;
  right: 1vw;
  bottom: calc(50px + 0.2vw);
  height: 500px;
  width: 600px;

  background-color: #ddd;
  border: 1px solid gray;
  padding: 3px;
  border-radius: 8px;
`

const ChatButton = styled.button<{ $chatOpen: boolean }>`
  cursor: pointer;
  position: fixed;
  right: 1vw;
  bottom: 0;
  width: 50px;
  height: 50px;

  font-size: 2.2em;
  background-color: ${(props) => (props.$chatOpen ? "gray" : "#ddd")};
  border: 2px solid gray;
  border-bottom: 0;
  padding: 3px;
  border-radius: 8px 8px 0 0;
`

const ChatSelection = styled.div<any>`
  position: absolute;
  bottom: 0;
  left: 0;

  width: 40%;
  height: 100%;
  overflow-y: auto;

  border-right: 1px solid black;

  > button {
    cursor: pointer;
    width: 100%;
    padding: 0.2em 0;
    background-color: "#363636";

    border: 0;
    border-bottom: 1px solid black;

    &.active {
      background-color: #027cff;
      color: white;
    }
  }
`

type ChatboxProps = {
  chat: Chat
}

export const Chatbox: React.FC<ChatboxProps> = (props) => {
  const args: AllPropsRequired<ChatboxProps> = {
    ...props,
  }

  const { emitMessage, getChatMessages } = React.useContext(chatContext)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const messages = getChatMessages(props.chat.id)

  return (
    <ChatboxContainer>
      {messages.length ? (
        <ul>
          {messages.map((message, index) => (
            <li key={index}>
              <span>{message.message}</span>
              <span className="date">
                {getHumanFriendlyDateString(message.created_at)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div id="empty">
          <Empty />
        </div>
      )}

      <div id="chat-input">
        <textarea ref={textareaRef} />
        <button
          onClick={() => {
            emitMessage(args.chat.id, textareaRef.current.value)
            textareaRef.current.value = ""
          }}
        >
          <SendOutlined />
        </button>
      </div>
    </ChatboxContainer>
  )
}

const ChatboxContainer = styled.div<any>`
  position: absolute;
  right: 0;
  top: 0;
  width: 60%;
  height: 100%;

  > ul {
    list-style-type: none;
    padding: 0;
    height: calc(100% - 60px);
  }
  #empty {
    width: 100%;
    height: calc(100% - 60px);
  }
  > ul > li {
    padding: 5px;
    margin: 5px 3px;
    background-color: rgba(255, 255, 255, 0.5);
    border-radius: 5px;
  }
  > ul > li > .date {
    display: block;
    text-align: right;
    font-size: 0.8em;
  }
  > #chat-input {
    position: absolute;
    bottom: 0;
    left: 0;
    width: calc(100% - 5px);
    height: 60px;

    button {
      position: absolute;
      right: 0;
      bottom: 0;
      width: 60px;
      height: 100%;
    }

    textarea {
      position: absolute;
      left: 0;
      bottom: 0;
      width: calc(100% - 60px);
      height: 100%;
    }
  }
`
