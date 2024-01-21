import * as React from "react"
import { UseChats, useChats } from "./models/Chat"
import { appContext } from "./app_context"

export type ChatContextProps = UseChats

export const chatContext = React.createContext<ChatContextProps>(null) // Create a context object

interface Props {
  children: React.ReactNode
}
export const ChatProvider: React.FC<Props> = (props) => {
  const {
    userConfig: { setConfig, getConfig },
  } = React.useContext(appContext)

  const chats = useChats({
    initialChatOpen: getConfig("initialChatOpen", false),
    initialChatIds: getConfig("initialChatIds", []),
  })

  React.useEffect(() => {
    setConfig("initialChatOpen", chats.chatOpen)
  }, [chats.chatOpen, setConfig])

  React.useEffect(() => {
    setConfig("initialChatIds", chats.chatIds)
  }, [chats.chatIds, setConfig])

  return (
    <chatContext.Provider value={chats}>{props.children}</chatContext.Provider>
  )
}
