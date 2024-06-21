import * as React from "react"
import { styled } from "styled-components"
import { NodeLoader } from "../journey/node_loader"
import { fetchNode } from "../models/Node"
import { NodeType } from "../types/node"
import { adminContext } from "./admin_context"

export const NodeOverlay: React.FC<React.PropsWithChildren<{}>> = () => {
  const { nodeId, setNodeId } = React.useContext(adminContext)
  const [node, setNode] = React.useState<NodeType>(null)

  React.useEffect(() => {
    if (nodeId !== null) {
      fetchNode(nodeId).then((node) => {
        setNode(node)
      })
    } else {
      setNode(null)
    }
  }, [nodeId])

  if (node !== null)
    return (
      <OverlayContainer>
        <CloseButton onClick={() => setNodeId(null)} />
        <NodeLoader node={node} observer={true} />
      </OverlayContainer>
    )
}

const OverlayContainer = styled.div`
  position: fixed;
  top: 61px;
  bottom: 35px;
  left: 35px;
  right: 35px;
  z-index: 100;
  background-color: white;
  border: 1px solid black;
  border-radius: 5px;
`

const CloseButton = styled.div`
  position: absolute;
  top: -10px; /* Adjust as needed */
  right: -10px; /* Adjust as needed */
  width: 50px; /* Size of the button */
  height: 50px; /* Size of the button */
  border-radius: 50%; /* Makes it circular */
  border: none; /* Removes border */
  background-color: red; /* Background color */
  color: white; /* Text color */
  font-size: 20px; /* Size of the '×' symbol */
  cursor: pointer; /* Changes cursor to pointer */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 101;

  :hover {
    background-color: darkred; /* Background color on hover */
  }
`
