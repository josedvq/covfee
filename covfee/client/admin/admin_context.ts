import { createContext } from "react";

export interface AdminContext {
  socket: any;
}

export const adminContext = createContext<AdminContext>({
  socket: null,
});
