import * as React from "react"
import { adminContext } from "./admin_context"

export const AdminProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const [nodeId, setNodeId] = React.useState<number>(null)
  const socket = React.useRef(null)

  return (
    <adminContext.Provider
      value={{
        socket,
        nodeId,
        setNodeId,
      }}
    >
      {children}
    </adminContext.Provider>
  )
}
