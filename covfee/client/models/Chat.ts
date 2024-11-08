import Constants from "Constants"
import * as React from "react"
import type {
  ChatClientToServerEvents,
  ChatServerToClientEvents,
  ChatUpdatePayload,
} from "../app_context"
import { appContext } from "../app_context"
import { ApiChat, ApiChatMessage, Chat, ChatMessage } from "../types/chat"
import { fetcher, throwBadResponse } from "../utils"

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

function convertDates(chat: ChatUpdatePayload): Partial<Chat> {
  return {
    ...chat,
    last_read: Object.fromEntries(
      Object.entries(chat.last_read).map(([key, val]) => [key, new Date(val)])
    ),
    read_by_admin_at: new Date(chat.read_by_admin_at),
    messages: null,
  }
}

function convertMessageDates(message: ApiChatMessage): ChatMessage {
  return {
    ...message,
    created_at: new Date(message.created_at),
    read_by: [],
    read_by_admin: false,
  }
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
  // const [journeyToReadBy, setJourneyToReadBy] =
  //   React.useState<Record<string, Record<string, Date>>>(null)
  // chat messages, mapping from message_id => message object
  const [messages, setMessages] = React.useState<Record<string, ChatMessage>>(
    {}
  )

  const [chatOpen, setChatOpen] = React.useState(initialChatOpen)
  const [activeChatId, setActiveChatId] = React.useState(0)

  /**
   * DERIVED STATE TO KEEP TRACK OF MESSAGE COUNTS
   */

  const unreadCounts = React.useMemo(() => {
    const unreadCounts: Record<string, number> = Object.fromEntries(
      Object.keys(chats).map((chat_id) => [chat_id, 0])
    )

    if (journeyId !== undefined) {
      Object.values(messages).forEach((msg) => {
        const chatReadBy = chats[msg.chat_id].last_read[journeyId]

        console.log(msg, chatReadBy, new Date(msg.created_at))

        if (isNaN(chatReadBy) || chatReadBy < new Date(msg.created_at)) {
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

    console.log("unreadCounts", unreadCounts)

    return unreadCounts
  }, [journeyId, chats, messages])

  const totalUnreadMessages = React.useMemo(() => {
    if (unreadCounts === null) return 0
    return Object.values(unreadCounts).reduce((acc, count) => {
      return acc + count
    }, 0)
  }, [unreadCounts])

  const setChatData = React.useCallback(
    (chatId: number, fn: (arg0: Chat) => Chat) => {
      setChats((chats) => ({
        ...chats,
        [chatId]: fn(chats[chatId]),
      }))
    },
    []
  )

  const addChatListeners = React.useCallback(
    (ids: number[]) => {
      setChatIdsToListen(new Set([...chatIdsToListen, ...ids]))
    },
    [chatIdsToListen]
  )

  const hasChat = React.useCallback(
    (id: number) => {
      return (
        chatIdsBeingFetched.has(id) ||
        Object.keys(chats).includes(id.toString())
      )
    },
    [chats, chatIdsBeingFetched]
  )

  /**
   * Return all the messages for a given chat
   */

  const addMessages = React.useCallback((msgs: ChatMessage[]) => {
    const newMessages = Object.fromEntries(msgs.map((msg) => [msg.id, msg]))
    setMessages((messages) => {
      return {
        ...messages,
        ...newMessages,
      }
    })
  }, [])

  const addChats = React.useCallback(
    (ids: number[]) => {
      const idsToAdd = ids.filter(
        (id) =>
          !chatIdsBeingFetched.has(id) &&
          !Object.keys(chats).includes(id.toString())
      )
      if (idsToAdd.length === 0) return Promise.resolve()

      setChatIdsBeingFetched((s) => {
        return new Set([...s, ...idsToAdd])
      })

      return getChats(idsToAdd).then((res) => {
        const newChats: Record<string, Chat> = Object.fromEntries(
          res.map((chat) => [
            chat.id,
            convertDates({
              ...chat,
              messages: null,
            }) as Chat,
          ])
        )

        const newMessages: ApiChatMessage[] = [].concat(
          ...res.map((chat) => chat.messages)
        )

        addMessages(newMessages.map(convertMessageDates))
        setChats((chats) => {
          return {
            ...chats,
            ...newChats,
          }
        })

        // remove chat ids from being fetched
        setChatIdsBeingFetched(
          (ids) =>
            new Set(Array.from(ids).filter((id) => !idsToAdd.includes(id)))
        )
        const newChatIds = res.map((chat) => chat.id)
        addChatListeners(newChatIds)

        idsToAdd.forEach((chat_id) => {
          console.log(`IO: join_chat ${chat_id}`)
          chocket.emit("join_chat", { chatId: chat_id })
        })
      })
    },
    [
      chocket,
      addChatListeners,
      chats,
      setChats,
      setMessages,
      chatIdsBeingFetched,
    ]
  )

  type ChatFilterFn = (arg0: Chat) => boolean
  const removeChats = React.useCallback(
    (ids: number[] | ChatFilterFn) => {
      const idsToRemove = Array.isArray(ids)
        ? ids
        : Object.values(chats)
            .filter((chat) => ids(chat))
            .map((chat) => chat.id)

      console.log("removeChats", idsToRemove)

      setChats((chats) => {
        const filtered = Object.values(chats).filter(
          (chat) => !idsToRemove.includes(chat.id)
        )

        return Object.fromEntries(filtered.map((chat) => [chat.id, chat]))
      })

      setMessages((messages) => {
        const filtered = Object.values(messages).filter(
          (msg) => !idsToRemove.includes(msg.chat_id)
        )

        return Object.fromEntries(filtered.map((msg) => [msg.id, msg]))
      })
    },
    [chats, setChats]
  )

  const clearChatListeners = () => {
    setChatIdsToListen(new Set())
  }

  const clearChats = () => {
    setChats({})
  }

  const emitMessage = (chatId: number, message: string) => {
    chocket.emit("message", { chatId, journeyId, message })
  }

  const markChatRead = (chatId: number) => {
    console.log("markChatRead")
    const payload: Parameters<ChatClientToServerEvents["read"]>[0] = { chatId }
    if (journeyId) payload.journeyId = journeyId
    chocket.emit("read", payload)
  }

  // React.useEffect(() => {
  //   if (!init) return
  //   // will only run once
  //   addChats(initialChatIds)
  //   setInit(false)
  // }, [init, addChats, initialChatIds])

  React.useEffect(() => {
    const handleChatUpdate: ChatServerToClientEvents["chat_update"] = (
      partialChat
    ) => {
      console.log(`IO: chat_update`, partialChat)

      if (partialChat.messages)
        addMessages(partialChat.messages.map(convertMessageDates))
      setChatData(partialChat.id, (chat) => ({
        ...chat,
        ...convertDates(partialChat),
        messages: null,
      }))
    }
    if (chocket) {
      chocket.removeAllListeners("chat_update")
      chocket.on("chat_update", handleChatUpdate)
    }
  }, [addChats, chatIdsToListen, chats, chocket])

  return {
    chatsStore: chats,
    messagesStore: messages,
    chats: Object.values(chats),
    chatIds: Object.keys(chats),
    addChatListeners,
    clearChatListeners,
    hasChat,
    addChats,
    clearChats,
    removeChats,
    emitMessage,

    // for dealing with unread messages
    totalUnreadMessages,
    unreadCounts,
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
