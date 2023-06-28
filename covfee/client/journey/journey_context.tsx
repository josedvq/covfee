import { createContext } from "react";

export type JourneyContextType = {
  id: string;
  socket: any;
};

export const JourneyContext = createContext<JourneyContextType>({
  id: null,
  socket: null,
});
