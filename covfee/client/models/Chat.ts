import * as React from "react"
import { ApiChat, Chat, ChatMessage, IoChatMessage } from "../types/chat"
import { fetcher, throwBadResponse } from "../utils"
import Constants from "Constants"
import { ChatSocket, appContext } from "../app_context"
import type { ChatClientToServerEvents } from "../app_context"

type Props = {
  /**
   * Current journeyId, if any. Used to calculate eg. number of unread messages
   */
  journeyId?: string
  /**
   * Chats to be loaded when the component is created
   */
  initialChatIds?: number[]
  /**
   * Flag used to control the open status of the chat window
   */
  initialChatOpen?: boolean
  /**
   * ID of the active chat in the chat window
   */
  initialActiveChatId?: number
}

export const useChats = ({
  journeyId,
  initialChatIds = [],
  initialChatOpen = false,
  initialActiveChatId,
}: Props) => {
  const { chocket } = React.useContext(appContext)
  const [init, setInit] = React.useState<boolean>(true)

  // Stores chat ids currently being fetched from server
  const [chatIdsBeingFetched, setChatIdsBeingFetched] = React.useState<
    Set<number>
  >(new Set())

  // chat ids being listened to
  // when a message is received in one of these chats
  // the chat is added to chats
  const [chatIdsToListen, setChatIdsToListen] = React.useState<Set<number>>(
    new Set()
  )

  // loaded chats, mapping from chat_id => chat object
  const [chats, setChats] = React.useState<Record<string, Chat>>({})
  // maps chatId -> journeyId -> readDate
  const [journeyToReadBy, setJourneyToReadBy] =
    React.useState<Record<string, Record<string, Date>>>(null)
  // chat messages, mapping from message_id => message object
  const [messages, setMessages] = React.useState<Record<string, ChatMessage>>(
    {}
  )

  const [chatOpen, setChatOpen] = React.useState(initialChatOpen)
  const [activeChatId, setActiveChatId] = React.useState(0)

  // count of unread messages in each chat, mapping chat_id => count
  const [unreadCounts, setUnreadCounts] = React.useState<
    Record<string, number>
  >({})
  const [totalUnreadMessages, setTotalUnreadMessages] = React.useState<number>()

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
      console.log("addChatListeners")
      console.log(ids)
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

  /**
   * Return all the messages for a given chat
   */
  const getChatMessages = React.useCallback(
    (chatId: number) => {
      console.log(messages)
      const chat = chats[chatId]
      const chatMessages = Object.values(messages).filter(
        (message) => message.chat_id == chatId
      )

      const dateReadByAdmin = new Date(chat.read_by_admin_at)
      chatMessages.forEach((msg) => {
        const dateCreated = new Date(msg.created_at)
        msg.read_by_admin = dateCreated < dateReadByAdmin

        msg.read_by = chat.assocs.reduce((acc, assoc) => {
          if (new Date(assoc.read_at) > dateCreated) {
            acc.push(assoc.journeyinstance_id)
          }
          return acc
        }, [])
      })

      return chatMessages
    },
    [chats, messages]
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
        console.log(res)
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

  const clearChatListeners = () => {
    setChatIdsToListen(new Set())
  }

  const clearChats = () => {
    setChats({})
  }

  const emitMessage = (chatId: number, message: string) => {
    chocket.emit("message", { chatId, message })
  }

  const markChatRead = (chatId: number) => {
    console.log("markChatRead")
    const payload: Parameters<ChatClientToServerEvents["read"]>[0] = { chatId }
    if (journeyId) payload.journeyId = journeyId
    chocket.emit("read", payload)
  }

  const getTotalUnreadMessages = React.useCallback(
    (chatId: number) => {
      return unreadCounts[chatId]
    },
    [unreadCounts]
  )

  const getNumberUnreadMessages = React.useCallback(
    (chatId: number) => {
      return unreadCounts[chatId]
    },
    [unreadCounts]
  )

  React.useEffect(() => {
    if (!init) return
    // will only run once
    addChats(initialChatIds)
    setInit(false)
  }, [init, addChats, initialChatIds])

  React.useEffect(() => {
    setJourneyToReadBy(() =>
      Object.fromEntries(
        Object.values(chats).map((chat) => [
          chat.id,
          Object.fromEntries(
            chat.assocs.map((assoc) => [
              assoc.journeyinstance_id,
              new Date(assoc.read_at),
            ])
          ),
        ])
      )
    )
  }, [chats])

  React.useEffect(() => {
    console.log(journeyToReadBy)
  }, [journeyToReadBy])

  // Journey unread counts
  React.useEffect(() => {
    if (journeyToReadBy === null || Object.keys(journeyToReadBy).length === 0)
      return
    // mapping chat_id -> count of unread messages

    const unreadCounts: Record<string, number> = Object.fromEntries(
      Object.keys(journeyToReadBy).map((chat_id) => [chat_id, 0])
    )

    console.log(chats)
    console.log(journeyToReadBy)
    console.log(messages)

    if (journeyId !== undefined) {
      Object.values(messages).forEach((msg) => {
        const chatReadBy = journeyToReadBy[msg.chat_id][journeyId]

        if (!chatReadBy || chatReadBy < new Date(msg.created_at)) {
          unreadCounts[msg.chat_id] += 1
        }
      })
    } else {
      // calculate admin unreadCounts
      Object.values(messages).forEach((msg) => {
        const chatReadBy = new Date(chats[msg.chat_id].read_by_admin_at)

        if (!chatReadBy || chatReadBy < new Date(msg.created_at)) {
          unreadCounts[msg.chat_id] += 1
        }
      })
    }

    console.log(unreadCounts)
    setUnreadCounts(unreadCounts)
  }, [journeyId, journeyToReadBy, chats, messages])

  React.useEffect(() => {
    setTotalUnreadMessages(() =>
      Object.values(unreadCounts).reduce((acc, count) => {
        return acc + count
      }, 0)
    )
  }, [unreadCounts])

  React.useEffect(() => {
    if (chocket) {
      // listen to all messages here
      chocket.removeAllListeners("message")
      chocket.on("message", (message: IoChatMessage) => {
        console.log(`IO: message: ${message}`)
        if (message.chat_id in chats) {
          // if the chat is open
          setMessages((messages) => ({
            ...messages,
            [message.id]: message,
          }))
        } else {
          // if we are listening to the chat, open it (this will fetch the new message)
          if (
            chatIdsToListen.size === 0 || // listen to all chats by default
            chatIdsToListen.has(message.chat_id)
          ) {
            addChats([message.chat_id])
          }
        }
      })

      chocket.removeAllListeners("chat_update")
      chocket.on("chat_update", (partialChat: Partial<Chat>) => {
        console.log(`IO: chat_update: ${partialChat}`)
        setChatData(partialChat.id, (chat) => ({ ...chat, ...partialChat }))
      })
    }
  }, [addChats, chatIdsToListen, chats, chocket])

  return {
    chats: Object.values(chats),
    chatIds: Object.keys(chats),
    getChatMessages,
    addChatListeners,
    clearChatListeners,
    hasChat,
    addChats,
    clearChats,
    removeChats,
    emitMessage,

    // for dealing with unread messages
    totalUnreadMessages,
    getNumberUnreadMessages,
    markChatRead,

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
