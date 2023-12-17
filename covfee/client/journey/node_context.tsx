import { createContext } from "react"
import { NodeType, TaskResponseType } from "../types/node"
import React from "react"

export type NodeContextType = {
  node: NodeType
  useSharedState: boolean
  response?: TaskResponseType
  player: {
    active: boolean
    index: number
    name: string
  }
}

export const nodeContext = createContext<NodeContextType>({
  node: null,
  useSharedState: false,
  response: null,
  player: {
    active: false,
    index: -1,
    name: null,
  },
})

export const usePlayer = () => {
  const player = React.useContext(nodeContext)

  return { ...player }
}
