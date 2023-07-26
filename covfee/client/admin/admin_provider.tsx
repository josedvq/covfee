import * as React from "react";
import { io } from "socket.io-client";
import { adminContext } from "./admin_context";

export const AdminProvider: React.FC = ({ children }) => {
  const socket = React.useRef(io());

  return (
    <adminContext.Provider
      value={{
        socket,
      }}
    >
      {children}
    </adminContext.Provider>
  );
};
