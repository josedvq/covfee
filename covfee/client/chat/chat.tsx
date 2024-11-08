import { SendOutlined, WechatOutlined } from "@ant-design/icons"
import { Empty } from "antd"
import classNames from "classnames"
import React, { useContext } from "react"
import { styled } from "styled-components"
import { chatContext } from "../chat_context"
import { Chat } from "../types/chat"
import { AllPropsRequired } from "../types/utils"
import { getHumanFriendlyDateString } from "../utils"

const getChatName = (chat: Chat, admin: boolean = false) => {
  if (chat.journey_id) {
    return admin ? `Subject ${chat.journey_id.substring(0, 10)}` : "Admin"
  }
  if (chat.node_id) {
    return admin ? `Node ${chat.node_id}` : "Task chat"
  }
  return "Unknown"
}

interface Props {
  admin?: boolean
}

export const ChatPopup: React.FC<Props> = (props) => {
  const args: AllPropsRequired<Props> = {
    admin: false,
    ...props,
  }

  const {
    chats,
    chatsStore,
    chatOpen,
    setChatOpen,
    unreadCounts,
    totalUnreadMessages,
    markChatRead,
    activeChatId: currChatId,
    setActiveChatId: setCurrChatId,
  } = useContext(chatContext)

  const changeChat = React.useCallback(
    (chatId: number) => {
      setCurrChatId(chatId)
      if (chatOpen) {
        const id = setTimeout(() => {
          markChatRead(chatsStore[chatId].id)
        }, 1000)

        return () => {
          clearTimeout(id)
        }
      }
    },
    [chatOpen, chats, currChatId, markChatRead]
  )

  React.useEffect(() => {
    console.log(chatsStore, currChatId)
  }, [chatsStore, currChatId])

  return (
    <>
      {chatOpen && (
        <PopupContainer>
          <ChatSelection>
            {chats.map((chat, index) => (
              <button
                key={index}
                className={classNames({ active: currChatId == chat.id })}
                onClick={() => {
                  changeChat(chat.id)
                }}
              >
                {getChatName(chat, args.admin)} ({unreadCounts[chat.id]})
              </button>
            ))}
          </ChatSelection>
          {!!currChatId && <Chatbox chat={chatsStore[currChatId]} />}
        </PopupContainer>
      )}
      <ChatButton
        onClick={() => {
          setChatOpen(!chatOpen)
        }}
        $chatOpen
        $numUnread={totalUnreadMessages}
      >
        <WechatOutlined />
      </ChatButton>
    </>
  )
}

type ChatboxProps = {
  chat: Chat
}

export const Chatbox: React.FC<ChatboxProps> = (props) => {
  const args: AllPropsRequired<ChatboxProps> = {
    ...props,
  }

  const { chatsStore, messagesStore, emitMessage, unreadCounts, markChatRead } =
    React.useContext(chatContext)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // filter the messages for this chat
  // messagesStore is not a dependency to avoid unneccessary recomputations
  const messages = React.useMemo(() => {
    const chat = chatsStore[args.chat.id]
    const chatMessages = Object.values(messagesStore).filter(
      (message) => message.chat_id == chat.id
    )

    chatMessages.forEach((msg) => {
      const dateCreated = msg.created_at
      msg.read_by_admin = dateCreated < args.chat.read_by_admin_at

      msg.read_by = Object.entries(chat.last_read)
        .filter(([journeyId, lastReadDate]) => {
          return lastReadDate > dateCreated
        })
        .map(([journeyId, _]) => journeyId)
    })

    return chatMessages
  }, [args.chat.id, chatsStore])

  React.useEffect(() => {
    if (unreadCounts[args.chat.id] > 0) {
      console.log("marking chat as read")
      markChatRead(args.chat.id)
    }
  }, [unreadCounts, args.chat.id])

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
        <textarea
          ref={textareaRef}
          onKeyDown={(e) => {
            if (e.key == "Enter") {
              emitMessage(args.chat.id, textareaRef.current.value)
              textareaRef.current.value = ""
            }
          }}
        />
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

const PopupContainer = styled.div<any>`
  position: fixed;
  right: 1vw;
  bottom: calc(50px + 0.2vw);
  height: 500px;
  width: 600px;

  display: flex;

  background-color: #ddd;
  border: 1px solid gray;
  padding: 3px;
  border-radius: 8px;
`

const ChatButton = styled.button<{ $chatOpen: boolean; $numUnread: number }>`
  display: flex;
  align-items: center;
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

  &::before {
    position: fixed;
    right: calc(1vw + 50px);
    bottom: 0;
    height: 50px;
    /* content: "E+AKJHFA"; */
    content: "${(props) => `${props.$numUnread} unread messages`}";
    color: white;
    background-color: red;
    padding: 0 2em;
    font-size: 16px;
    vertical-align: middle;
    text-align: center;
    border-top-left-radius: 8px;

    display: ${(props) =>
      props.$numUnread > 0 ? "flex" : "none"}; /* Enable flexbox on ::before */
    align-items: center;
    justify-content: center; /* Optional: centers text horizontally */
  }
`

const ChatSelection = styled.div<any>`
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

const ChatboxContainer = styled.div<any>`
  flex-grow: 1;
  display: flex;
  flex-direction: column;

  > ul {
    flex-grow: 1;
    list-style-type: none;
    margin: 0;
    padding: 0;
    overflow-y: scroll;
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
    height: 60px;
    display: flex;
    flex-direction: row;

    button {
      width: 60px;
      height: 100%;
    }

    textarea {
      flex-grow: 1;
      height: 100%;
    }
  }
`
