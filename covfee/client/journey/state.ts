import { useContext } from "react"

import { nodeContext } from "./node_context"

export const useDispatch = () => {
  const { dispatch } = useContext(nodeContext)

  return dispatch
}
