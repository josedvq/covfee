import { createContext } from "react";
import { Chat } from "../types/chat";
import { UseChats } from "../models/Chat";

export type JourneyContextType = UseChats & {
  id: string;
  socket: any;
};

export const JourneyContext = createContext<JourneyContextType>({
  id: null,
  socket: null,
  chats: null,
  addChat: null,
  removeChat: null,
});
