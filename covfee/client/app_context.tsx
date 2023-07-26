import * as React from "react";
import { io } from "socket.io-client";
import { UserContextMethods, UserState } from "./app_provider";

export type AppContextProps = UserContextMethods &
  UserState & {
    socket: any;
  };

export const appContext = React.createContext<AppContextProps>({
  logged: false,
  roles: [],
  login: () => Promise.resolve({}),
  loginWithGoogle: () => Promise.resolve({}),
  logout: () => Promise.resolve(),
  socket: io(),
}); // Create a context object
