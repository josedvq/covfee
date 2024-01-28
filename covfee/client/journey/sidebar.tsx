import * as React from "react"
import styled from "styled-components"
import classNames from "classnames"

import { NodeType } from "../types/node"

interface NodeButtonSpec {
  // index: number,
  name: string
  active: boolean
  status: "default" | "active" | "valid" | "invalid"
}

interface NodeButtonProps extends NodeButtonSpec {
  innerRef: (el: HTMLDivElement) => void
  onClickActivate: () => void
  className?: object
}

type AllPropsRequired<Object> = {
  [Property in keyof Object]-?: Object[Property]
}

export const NodeButton: React.FunctionComponent<NodeButtonProps> = (props) => {
  const args: AllPropsRequired<NodeButtonProps> = {
    className: {},
    ...props,
  }

  const containerRef = React.useRef<HTMLDivElement>()

  const scrollIntoView = () => {
    if (containerRef.current)
      containerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
  }

  return (
    <SidebarButton
      ref={props.innerRef}
      className={classNames("btn", `btn-${args.status}`, { ...args.className })}
      onClick={args.onClickActivate}
    >
      <div className="btn-name">{args.name}</div>
    </SidebarButton>
  )
}

interface Props {
  /**
   * Id of the task that is currently active
   */
  currNode: number
  /**
   * List of tasks to display in the list
   */
  nodes: NodeType[]
  /**
   * Called when the user changes the active task
   */
  onChangeActiveTask: (arg0: number) => void
  children?: React.ReactNode
}
interface State {}

export const Sidebar: React.FC<Props> = (props) => {
  const taskElementRefs = React.useRef<HTMLElement[]>([])

  React.useEffect(() => {
    if (taskElementRefs.current[props.currNode]) {
      taskElementRefs.current[props.currNode].scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }
  }, [props.currNode])

  React.useEffect(() => {
    taskElementRefs.current = taskElementRefs.current.slice(
      0,
      props.nodes.length
    )
  }, [props.nodes])

  return (
    <SidebarContainer>
      <SidebarHead>{props.children}</SidebarHead>

      <SidebarScrollable>
        {props.nodes.map((node, index) => (
          <NodeButton
            key={index}
            innerRef={(el) => (taskElementRefs.current[index] = el)}
            name={node.name}
            className={{ "btn-parent": true }}
            status={props.currNode === index ? "active" : "default"}
            active={props.currNode === index}
            onClickActivate={() => {
              props.onChangeActiveTask(index)
            }}
          />
        ))}
      </SidebarScrollable>
    </SidebarContainer>
  )
}

const SidebarButton = styled.nav`
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  margin: 2px;
  color: #363636;
  clear: both;

  > .btn-name {
    width: calc(100% - 36px);
    overflow-x: hidden;
    display: block;
    padding: 5px;

    &:hover {
      cursor: pointer;
    }
  }

  > .btn-icon {
    display: block;
    float: right;
    width: 20px;
    height: 20px;
    margin: 8px;
    color: #d5d5d5;
  }

  &.btn-default {
    background-color: #fafafa;
  }

  &.btn-active {
    color: #fafafa;
    background-color: #2c70de;
  }

  &.btn-valid {
    background-color: #b2cf23;
  }

  &.btn-invalid {
    background-color: #cf6565;
  }
`

/* Sidebar buttons */
const SidebarContainer = styled.nav`
  display: flex;
  flex-flow: column;
  width: 100%;
  height: inherit;
  background-color: #a6a6a6;

  &-new {
    margin: 2px;
  }

  &.bottom {
    margin-top: auto;
  }
`

const SidebarHead = styled.nav`
  background-color: #464646;
  padding: 5;

  > button {
    border-radius: 0;
  }
`

const SidebarScrollable = styled.div`
  flex: 2;
  padding: 2 0 2 2;
  overflow-y: scroll;
  scrollbar-width: 12px;

  &::-webkit-scrollbar {
    width: 12px;
  }
  &::-webkit-scrollbar-track {
    background: #a6a6a6;
    border-radius: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #d5d5d5;
    border-radius: 6px;
    border: 2px solid #a6a6a6;
  }
`
