import * as React from "react"
import { io, Socket } from "socket.io-client"
import { UserContextMethods, UserState } from "./app_provider"
import { UseChats } from "models/Chat"
import { ChatMessage } from "./types/chat"
import { NodeStatus } from "./types/node"
import {
  State as StateResponse,
  Action as ActionResponse,
  ActionRequestPayload,
  StateRequestPayload,
} from "../server/socketio/types"
import { UserConfig } from "./user_config"

export interface ServerToClientEvents {
  status: (arg0: {
    id: number
    hit_id: string
    prev: NodeStatus
    new: NodeStatus
    curr_journeys: string[]
  }) => void
  journey_connect: (arg0: {
    hit_id: string
    journey_id: string
    num_connections: number
  }) => void
  journey_disconnect: (arg0: {
    hit_id: string
    journey_id: string
    num_connections: number
  }) => void
  join: (arg0: {
    task_data: any
  }) => void
  action: (arg0: ActionResponse) => void
  state: (arg0: StateResponse) => void
}

interface ClientToServerEvents {
  action: (arg0: ActionRequestPayload) => void
  state: (arg0: StateRequestPayload) => void
  join: (arg0: {
    journeyId: string
    nodeId: number
    responseId: number
    useSharedState: boolean
  }) => void

  leave: (arg0: {
    journeyId: string
    nodeId: number
    responseId: number
    useSharedState: boolean
  }) => void
}

interface ChatServerToClientEvents {
  message: (msg: ChatMessage) => void
}

interface ChatClientToServerEvents {
  message: (arg0: { message: string; chatId: number }) => void
  join_chat: (arg0: { chatId: number }) => void
}

export type MainSocket = Socket<ServerToClientEvents, ClientToServerEvents>
export type ChatSocket = Socket<
  ChatServerToClientEvents,
  ChatClientToServerEvents
>

export type AppContextProps = UserContextMethods &
  UserState & {
    socket: MainSocket
    chocket: ChatSocket
    setSocket: (arg0: MainSocket) => void
    setChocket: (arg0: ChatSocket) => void
    userConfig: UserConfig
  }

export const appContext = React.createContext<AppContextProps>(null) // Create a context object
