import { createContext } from "react"

export interface AdminContext {
  socket: any
  nodeId: number
  setNodeId: (id: number) => void
}

export const adminContext = createContext<AdminContext>({
  socket: null,
  nodeId: null,
  setNodeId: () => {},
})
