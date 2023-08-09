import * as React from "react";
import { io, Socket } from "socket.io-client";
import { UserContextMethods, UserState } from "./app_provider";
import { UseChats } from "models/Chat";
import { ChatMessage } from "./types/chat";
import { NodeStatus } from "./types/node";
import {
  State as StateResponse,
  Action as ActionResponse,
  ActionRequestPayload,
  StateRequestPayload,
} from "../server/socketio/types";

interface ServerToClientEvents {
  status: (arg0: {
    prev: NodeStatus;
    new: NodeStatus;
    curr_journeys: string[];
  }) => void;
  action: (arg0: ActionResponse) => void;
  state: (arg0: StateResponse) => void;
}

interface ClientToServerEvents {
  action: (arg0: ActionRequestPayload) => void;
  state: (arg0: StateRequestPayload) => void;
  join: (arg0: {
    journeyId: string;
    nodeId: number;
    responseId: number;
    useSharedState: boolean;
  }) => void;

  leave: (arg0: {
    journeyId: string;
    nodeId: number;
    responseId: number;
    useSharedState: boolean;
  }) => void;
}

interface ChatServerToClientEvents {
  message: (msg: ChatMessage) => void;
}

interface ChatClientToServerEvents {
  message: (arg0: { message: string; chatId: number }) => void;
  join_chat: (arg0: { chatId: number }) => void;
}

export type MainSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
export type ChatSocket = Socket<
  ChatServerToClientEvents,
  ChatClientToServerEvents
>;

export type AppContextProps = UserContextMethods &
  UserState &
  UseChats & {
    socket: MainSocket;
    chocket: ChatSocket;
  };

export const appContext = React.createContext<AppContextProps>({
  logged: false,
  roles: [],
  login: () => Promise.resolve({}),
  loginWithGoogle: () => Promise.resolve({}),
  logout: () => Promise.resolve(),
  socket: null,
  chocket: null,

  chats: [],
  addChatListeners: null,
  clearChatListeners: null,
  addChats: null,
  removeChats: null,
  clearChats: null,
  emitMessage: null,
}); // Create a context object
