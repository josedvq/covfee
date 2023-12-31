import * as React from "react"
import { io, Socket } from "socket.io-client"
import { UserContextMethods, UserState } from "./app_provider"
import { UseChats } from "models/Chat"
import { ChatMessage } from "./types/chat"
import { JourneyAssoc, NodeStatus, TaskResponseType } from "./types/node"
import {
  State as StateResponse,
  Action as ActionResponse,
  ActionRequestPayload,
  StateRequestPayload,
} from "../server/socketio/types"
import { UserConfig } from "./user_config"
import { Action } from "@reduxjs/toolkit"

export interface ServerToClientEvents {
  /**
   * Journey events: emited to admin when a client opens/closes a journey page
   */
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

  /**
   * Node events
   */

  // response to client-to-server 'join' event
  // latest response / state is included
  join: (arg0: {
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
    id: number
    hit_id: string
    prev: NodeStatus
    new: NodeStatus
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
