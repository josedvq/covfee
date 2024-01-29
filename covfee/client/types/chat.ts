export type ChatMessage = {
  id: number
  chat_id: number
  message: string
  created_at: string
  /**
   * List of journeys that have read the message
   */
  read_by: string[]
  read_by_admin: boolean
}

export type IoChatMessage = ChatMessage

export type ApiChat = {
  id: number
  node_id: number | null
  journey_id: string | null
  messages: ChatMessage[]
  assocs: {
    journeyinstance_id: string
    chat_id: number
    read_at: string
  }[]
  created_at: string
  read_by_admin_at: string
}

export type Chat = Omit<ApiChat, "messages">
