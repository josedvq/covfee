import { useCallback, useEffect, useMemo, useState } from "react"
import { MainSocket, ServerToClientEvents } from "../app_context"
import { NodeType } from "../types/node"

export function useNodes(data: NodeType[], socket: MainSocket = null) {
  const [store, setStore] = useState<Record<number, NodeType>>(
    Object.fromEntries(data.map((node) => [node.id, node]))
  )

  // Adds or updates entities in the database
  const upsert = useCallback((nodes: Record<number, NodeType>) => {
    setStore((prevNodes) => ({
      ...prevNodes,
      ...nodes,
    }))
  }, [])

  // Removes an entity by type and ID
  const remove = useCallback((id: number) => {
    setStore((prevStore) => {
      const { [id]: _, ...rest } = prevStore
      return rest
    })
  }, [])

  const updateItem = useCallback((id: number, newProps: Partial<NodeType>) => {
    setStore((prevStore) => {
      if (!prevStore[id]) return prevStore // If ID does not exist, return store unchanged
      return {
        ...prevStore,
        [id]: {
          ...prevStore[id],
          ...newProps,
        },
      }
    })
  }, [])

  const items = useMemo(() => {
    return Object.values(store) // Convert store from an object to an array of values
  }, [store])

  useEffect(() => {
    const handleStatus: ServerToClientEvents["status"] = (data) => {
      console.log("IO: status", data)
      updateItem(data.node_id, {
        status: data.new,
        paused: data.paused,
        manual: data.manual,
        journeys: data.journeys,
        dt_start: data.dt_start,
        dt_play: data.dt_play,
        dt_count: data.dt_count,
        dt_finish: data.dt_finish,
        t_elapsed: data.t_elapsed,
      })
    }

    const handleJoin: ServerToClientEvents["join"] = (data) => {
      console.log("IO: join", data)

      updateItem(data.node_id, {
        taskData: data.task_data,
      })
    }

    if (socket) {
      socket.on("status", handleStatus)
      socket.on("join", handleJoin)
      return () => {
        socket.off("status", handleStatus)
        socket.off("join", handleJoin)
      }
    }
  }, [socket])

  return {
    store,
    items,
    upsert,
    remove,
    updateItem,
  }
}
