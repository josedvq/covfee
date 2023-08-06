import { createContext } from "react";
import { Chat } from "../types/chat";
import { UseChats } from "../models/Chat";

export type JourneyContextType = {
  id: string;
  socket: any;
};

export const JourneyContext = createContext<JourneyContextType>({
  id: null,
  socket: null,
});
