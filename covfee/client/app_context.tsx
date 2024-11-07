import { Action } from "@reduxjs/toolkit"
import * as React from "react"
import { Socket } from "socket.io-client"
import {
  Action as ActionResponse,
  State as StateResponse,
} from "../server/socketio/types"
import { UserContextMethods, UserState } from "./app_provider"
import { ApiChat } from "./types/chat"
import {
  JourneyAssoc,
  ManualStatus,
  NodeStatus,
  TaskResponseType,
} from "./types/node"
import { UserConfig } from "./user_config"

type SomeRequired<T, Keys extends keyof T> = Required<Pick<T, Keys>> &
  Partial<Omit<T, Keys>>

export interface ServerToClientEvents {
  /**
   * Journey events: emited to admin when a client opens/closes a journey page
   */
  journey_status: (arg0: {
    journey_id: string
    hit_id: string
    num_connections: number
    status: string
    dt_submitted: string
  }) => void

  /**
   * Node events
   */

  // response to client-to-server 'join' event
  // latest response / state is included
  join: (arg0: {
    node_id: number
    response: TaskResponseType
    error?: string
    load_task?: boolean
    task_data?: any
  }) => void

  // whenever the status of the node changes because:
  // - a client joins the node
  // - a timer is triggered
  // - admin actions
  status: (arg0: {
    node_id: number
    hit_id: string
    new: NodeStatus
    manual: ManualStatus
    paused: boolean
    response_id?: number
    journeys: JourneyAssoc[]
    dt_start: string
    dt_play: string
    dt_count: string
    dt_finish: string
    t_elapsed: number
  }) => void

  // for tasks with shared state
  // emited to node when an action is executed
  action: (arg0: ActionResponse) => void

  // for tasks with shared state
  // emited when a node
  state: (arg0: StateResponse) => void
}

export interface ClientToServerEvents {
  action: (arg0: { nodeId: number; action: Action }) => void
  state: (arg0: { nodeId: number; state: any }) => void
  join: (arg0: {
    journeyId: string
    nodeId: number
    useSharedState: boolean
  }) => void

  leave: (arg0: {
    journeyId: string
    nodeId: number
    responseId: number
    useSharedState: boolean
  }) => void
}

export type ChatUpdatePayload = SomeRequired<
  ApiChat,
  "id" | "last_read" | "read_by_admin_at"
>
export interface ChatServerToClientEvents {
  chat_update: (chat: ChatUpdatePayload) => void
}

export interface ChatClientToServerEvents {
  message: (arg0: {
    message: string
    chatId: number
    journeyId: string
  }) => void
  read: (arg0: { chatId: number; journeyId?: string }) => void
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
