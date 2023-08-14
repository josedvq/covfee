import * as React from "react"
import { ApiChat, Chat, ChatMessage, IoChatMessage } from "../types/chat"
import { fetcher, throwBadResponse } from "../utils"
import Constants from "Constants"
import { ChatSocket } from "../app_context"

export const useChats = (chocket: ChatSocket, chat_ids: number[] = []) => {
  const [chatIdsBeingFetched, setChatIdsBeingFetched] = React.useState<
    Set<number>
  >(new Set())

  const [chatIdsToListen, setChatIdsToListen] = React.useState<Set<number>>(
    new Set(chat_ids)
  )
  const [chats, setChats] = React.useState<Record<string, Chat>>({})
  const [messages, setMessages] = React.useState<Record<string, ChatMessage>>(
    {}
  )

  const [chatOpen, setChatOpen] = React.useState(true)
  const [activeChatId, setActiveChatId] = React.useState(0)

  const [unreadCounts, setUnreadCounts] = React.useState<
    Record<string, number>
  >({})

  React.useEffect(() => {
    const unreadCounts: Record<string, number> = Object.fromEntries(
      Object.values(chats).map((chat) => [chat.id, 0])
    )
    Object.values(messages).forEach((message) => {
      unreadCounts[message.chat_id] += message.read ? 0 : 1
    })
    console.log(messages)
    console.log(unreadCounts)
    setUnreadCounts(unreadCounts)
  }, [chats, messages])

  const setChatData = (chatId: number, fn: (arg0: Chat) => Chat) => {
    setChats((chats) => ({
      ...chats,
      [chatId]: fn(chats[chatId]),
    }))
  }

  const setMessageData = (
    messageId: number,
    fn: (arg0: ChatMessage) => ChatMessage
  ) => {
    setMessages((messages) => ({
      ...messages,
      [messageId]: fn(messages[messageId]),
    }))
  }

  const addChatListeners = React.useCallback(
    (ids: number[]) => {
      setChatIdsToListen(new Set([...chatIdsToListen, ...ids]))
    },
    [chatIdsToListen]
  )

  const hasChat = React.useCallback(
    (id: number) => {
      return Object.keys(chats).includes(id.toString())
    },
    [chats]
  )

  const getChatMessages = React.useCallback(
    (chatId: number) => {
      console.log(messages)
      return Object.values(messages).filter(
        (message) => message.chat_id == chatId
      )
    },
    [messages]
  )

  const addChats = React.useCallback(
    (ids: number[]) => {
      const idsToAdd = ids.filter(
        (id) =>
          !chatIdsBeingFetched.has(id) &&
          !Object.keys(chats).includes(id.toString())
      )
      if (idsToAdd.length === 0) return Promise.resolve()

      setChatIdsBeingFetched((s) => new Set([...s, ...idsToAdd]))

      return getChats(idsToAdd).then((res) => {
        const newChats: Record<string, Chat> = Object.fromEntries(
          res.map((chat) => [
            chat.id,
            {
              ...chat,
              messages: undefined,
            },
          ])
        )

        const newMessages: Record<string, ChatMessage> = Object.fromEntries(
          [].concat(
            ...res.map((chat) =>
              chat.messages.map((message) => [message.id, message])
            )
          )
        )

        const newChatIds = res.map((chat) => chat.id)
        setChatIdsBeingFetched(
          (ids) =>
            new Set(Array.from(ids).filter((id) => idsToAdd.includes(id)))
        )
        addChatListeners(newChatIds)
        setChats((chats) => ({
          ...chats,
          ...newChats,
        }))
        setMessages((messages) => ({
          ...messages,
          ...newMessages,
        }))

        idsToAdd.forEach((chat_id) => {
          console.log(`IO: join_chat ${chat_id}`)
          chocket.emit("join_chat", { chatId: chat_id })
        })
      })
    },
    [chocket, addChatListeners, chats, chatIdsBeingFetched]
  )

  type ChatFilterFn = (arg0: Chat) => boolean
  const removeChats = React.useCallback((ids: number[] | ChatFilterFn) => {
    const filterFn: ChatFilterFn = Array.isArray(ids)
      ? (chat) => !ids.includes(chat.id)
      : (chat) => !ids(chat)
    setChats((chats) => {
      const filtered = Object.values(chats).filter(filterFn)

      if (filtered.length === Object.values(chats).length) {
        // noting to remove
        return chats
      } else {
        return Object.fromEntries(filtered.map((chat) => [chat.id, chat]))
      }
    })
  }, [])

  React.useEffect(() => {
    if (Object.keys(chats).length && chocket) {
      chocket.removeAllListeners("message")
      chocket.on("message", (message: IoChatMessage) => {
        console.log(`MESSAGE: ${message}`)
        if (message.chat_id in chats) {
          setMessages((messages) => ({
            ...messages,
            [message.chat_id]: message,
          }))
        } else {
          if (
            chatIdsToListen.size || // listen to all chats by default
            chatIdsToListen.has(message.chat_id)
          ) {
            addChats([message.chat_id])
          }
        }
      })
    }
  }, [addChats, chatIdsToListen, chats, chocket])

  const clearChatListeners = () => {
    setChatIdsToListen(new Set())
  }

  const clearChats = () => {
    setChats({})
  }

  const emitMessage = (chatId: number, message: string) => {
    chocket.emit("message", { chatId, message })
  }

  const markMessageRead = (messageId: number) => {
    setMessageData(messageId, (message) => ({
      ...message,
      read: true,
    }))
  }

  const getNumberUnreadMessages = React.useCallback(
    (chatId: number) => {
      return unreadCounts[chatId]
    },
    [unreadCounts]
  )

  return {
    chats: Object.values(chats),
    getChatMessages,
    addChatListeners,
    clearChatListeners,
    hasChat,
    addChats,
    clearChats,
    removeChats,
    emitMessage,

    // for dealing with unread messages
    getNumberUnreadMessages,
    markMessageRead,

    chatOpen,
    setChatOpen,
    activeChatId,
    setActiveChatId,
  }
}

export type UseChats = ReturnType<typeof useChats>

export async function getChats(chat_ids: number[]): Promise<ApiChat[]> {
  console.log(`FETCH: chats ${chat_ids}`)
  const url = Constants.api_url + "/chats/" + chat_ids.join(",")

  return await fetcher(url).then(throwBadResponse)
}
