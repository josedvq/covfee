import * as React from "react"
import styled from "styled-components"

import {
  EyeOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  RedoOutlined,
  WechatOutlined,
} from "@ant-design/icons"
import { Modal } from "antd"
import classNames from "classnames"
import { chatContext } from "../../chat_context"
import { useNodeFns } from "../../models/Node"
import { NodeType } from "../../types/node"
import { adminContext } from "../admin_context"
import { NodeStatusToColor, StatusIcon, getNodeStatus } from "../utils"
import { ButtonsContainer, Row } from "./utils"
const { confirm } = Modal

type NodeRowProps = {
  node: NodeType
  focus: boolean
  danger: boolean
  onFocus: () => void
  onBlur: () => void
}
export const NodeRow = ({
  node,
  focus = false,
  danger = false,
  onFocus = () => {},
  onBlur = () => {},
}: NodeRowProps) => {
  const { getAdminUrl: getUrl } = useNodeFns(node)

  return (
    <Row
      onMouseOver={onFocus}
      onMouseOut={onBlur}
      className={classNames({ focus, danger })}
    >
      <a href={getUrl()}>
        <span>
          <StatusIcon color={NodeStatusToColor[getNodeStatus(node)]} />
        </span>
        {node.name}[{node.id}] - {node.status}
        {typeof node.progress === "number"
          ? "(" + node.progress.toFixed(1) + "%)"
          : ""}
      </a>
      <NodeButtons node={node} />
    </Row>
  )
}

type NodeButtonsProps = {
  node: NodeType
}
export const NodeButtons = ({ node }: NodeButtonsProps) => {
  const { addChats } = React.useContext(chatContext)
  const { setNodeId: openNode } = React.useContext(adminContext)
  const { setManualStatus, restart } = useNodeFns(node)

  return (
    <ButtonsContainer>
      <li>
        <button
          onClick={() => {
            openNode(node.id)
          }}
        >
          <EyeOutlined />
        </button>
      </li>
      <li>
        <button
          onClick={() => {
            addChats([node.chat_id])
          }}
        >
          <WechatOutlined />
        </button>
      </li>
      <li>
        <ButtonManualCtrl
          disabled={node.status == "FINISHED"}
          $active={node.manual == "PAUSED"}
          onClick={() => {
            confirm({
              title:
                node.manual == "PAUSED"
                  ? "Are you sure you want to unpause?"
                  : "Are you sure you want to pause this node?",
              content: "Data collection might be affected.",
              onOk() {
                if (node.manual == "PAUSED") {
                  setManualStatus("DISABLED")
                } else {
                  setManualStatus("PAUSED")
                }
              },
              onCancel() {},
            })
          }}
        >
          {node.paused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
        </ButtonManualCtrl>
      </li>
      <li>
        <button
          onClick={() => {
            confirm({
              title: "Are you sure you want to restart this node?",
              content: "Data may be lost if the node is not in finished state.",
              onOk() {
                restart()
              },
              onCancel() {},
            })
          }}
        >
          <RedoOutlined />
        </button>
      </li>
    </ButtonsContainer>
  )
}

const ButtonManualCtrl = styled.button<{ $active: boolean }>`
  background-color: ${(props) => (props.$active ? "#9243d9" : "default")};
`
