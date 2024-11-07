export type ApiChatMessage = {
  id: number
  chat_id: number
  message: string
  created_at: string
}

export type ChatMessage = Omit<ApiChatMessage, "created_at"> & {
  created_at: Date
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
  messages: ApiChatMessage[]
  created_at: string
  last_read: {
    [journeyId: string]: string
  }
  read_by_admin_at: string
}

export type Chat = Omit<
  ApiChat,
  "messages" | "last_read" | "read_by_admin_at"
> & {
  messages: null
  last_read: {
    [journeyId: string]: Date
  }
  read_by_admin_at: Date
}
