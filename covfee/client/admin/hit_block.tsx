import * as React from "react"
import styled from "styled-components"

import { HitInstanceType } from "../types/hit"
import { JourneyType } from "../types/journey"
import { NodeStatus, NodeStatuses, NodeType } from "../types/node"
import {
  DownOutlined,
  LinkOutlined,
  NodeIndexOutlined,
  WechatOutlined,
} from "@ant-design/icons"
import { useJourneyFns } from "../models/Journey"
import { useNodeFns } from "../models/Node"
import { appContext } from "../app_context"
import {
  JourneyColorStatus,
  JourneyColorStatuses,
  JourneyStatusToColor,
  NodeColorStatus,
  NodeColorStatuses,
  NodeStatusToColor,
  StatusIcon,
  getJourneyStatus,
  getNodeStatus,
} from "./utils"
import classNames from "classnames"
import { ForceGraph } from "./force_graph"

interface Props {
  hit: HitInstanceType
}
export const HitBlock = (props: Props) => {
  const [collapsed, _setCollapsed] = React.useState<boolean>(
    props.hit.collapsed
  )
  const [showGraph, _setShowGraph] = React.useState<boolean>(
    props.hit.show_graph
  )
  const [showJourneys, _setShowJourneys] = React.useState<boolean>(
    props.hit.show_journeys
  )
  const [showNodes, _setShowNodes] = React.useState<boolean>(
    props.hit.show_nodes
  )
  const timeout = React.useRef<NodeJS.Timeout>(null)

  const [focusedNode, setFocusedNode] = React.useState<number>(null)
  const [focusedJourney, setFocusedJourney] = React.useState<number>(null)
  const [hoveringButtonProps, setHoveringButtonProps] = React.useState<
    Omit<HoveringNodeButtonsProps, "node"> & { nodeIndex: number }
  >({ nodeIndex: null, hide: false, x: 100, y: 100 })

  const startHoveringButtonsTimeout = () => {
    timeout.current = setTimeout(() => {
      setHoveringButtonProps({
        ...hoveringButtonProps,
        nodeIndex: null,
        hide: true,
      })
    }, 500)
  }

  const handleNodeHover = (
    nodeIndex: number,
    x: number = null,
    y: number = null
  ) => {
    setFocusedNode(nodeIndex)
    if (x && y) {
      setHoveringButtonProps({
        ...hoveringButtonProps,
        hide: false,
        nodeIndex,
        x,
        y,
      })
    } else {
      setHoveringButtonProps({
        ...hoveringButtonProps,
        hide: false,
        nodeIndex,
      })
    }
    clearTimeout(timeout.current)
  }

  const setCollapsed = async (value: boolean) => {
    _setCollapsed(value)
    // storeCollapsed(value);
  }

  const setShowGraph = async (value: boolean) => {
    _setShowGraph(value)
    // storeShowGraph(value);
  }

  const setShowJourneys = async (value: boolean) => {
    _setShowJourneys(value)
    // storeShowJourneys(value);
  }

  const setShowNodes = async (value: boolean) => {
    _setShowNodes(value)
    // storeShowNodes(value);
  }

  const nodesHist = Object.fromEntries(
    NodeColorStatuses.map((k) => [k, 0])
  ) as Record<NodeStatus, number>
  for (let i = 0; i < props.hit.nodes.length; i++) {
    nodesHist[getNodeStatus(props.hit.nodes[i])] += 1
  }

  const journeysHist = Object.fromEntries(
    JourneyColorStatuses.map((k) => [k, 0])
  ) as Record<string, number>
  for (let i = 0; i < props.hit.journeys.length; i++) {
    journeysHist[getJourneyStatus(props.hit.journeys[i])] += 1
  }

  return (
    <Container>
      <Header
        onClick={() => {
          setCollapsed(!collapsed)
        }}
        className={classNames({ collapsed: collapsed })}
      >
        <NodeIndexOutlined />
        <span>{props.hit.id.substring(0, 10)}</span>{" "}
        <NodeStatusSummary>
          <span>Nodes: </span>
          {Object.entries(nodesHist).map(([status, count], index) => (
            <span key={index}>
              <StatusIcon
                color={NodeStatusToColor[status as NodeColorStatus]}
              />
              {count}
            </span>
          ))}
        </NodeStatusSummary>
        <JourneyStatusSummary>
          <span>Journeys: </span>
          {Object.entries(journeysHist).map(([status, count], index) => (
            <span key={index}>
              <StatusIcon
                color={JourneyStatusToColor[status as JourneyColorStatus]}
              />
              {count}
            </span>
          ))}
        </JourneyStatusSummary>
      </Header>
      {!collapsed && (
        <div style={{ display: "flex", flexDirection: "row" }}>
          <div style={{ display: "flex", alignItems: "center", width: "60%" }}>
            <NodesList>
              <h2>Nodes</h2>

              <ul>
                {props.hit.nodes.map((node, index) => {
                  return (
                    <NodeRow
                      key={index}
                      node={node}
                      focus={focusedNode == index}
                      onFocus={() => {
                        setFocusedNode(index)
                      }}
                      onBlur={() => {
                        setFocusedNode(null)
                      }}
                    />
                  )
                })}
              </ul>
            </NodesList>

            {/* <Button onClick={() => setShowGraph(!showGraph)}>Graph</Button> */}
            {showGraph && (
              <GraphContainer>
                <ForceGraph
                  hit={props.hit}
                  focusedNode={focusedNode}
                  focusedJourney={focusedJourney}
                  onNodeFocus={(i, x, y) => {
                    handleNodeHover(i, x, y)
                    // setHoveringButtonProps({ ...hoveringButtonProps, x, y });
                  }}
                  onNodeBlur={() => {
                    startHoveringButtonsTimeout()
                    setFocusedNode(null)
                  }}
                ></ForceGraph>
              </GraphContainer>
            )}
          </div>

          <div style={{ width: "40%" }}>
            <JourneysList>
              <h2>Journeys</h2>

              <ul>
                {props.hit.journeys.map((journey, index) => {
                  return (
                    <JourneyRow
                      key={index}
                      focus={focusedJourney == index}
                      onFocus={() => {
                        setFocusedJourney(index)
                      }}
                      onBlur={() => {
                        setFocusedJourney(null)
                      }}
                      journey={journey}
                    ></JourneyRow>
                  )
                })}
              </ul>
            </JourneysList>
          </div>
        </div>
      )}
      <HoveringNodeButtons
        node={props.hit.nodes[hoveringButtonProps.nodeIndex]}
        {...hoveringButtonProps}
        onFocus={() => {
          handleNodeHover(hoveringButtonProps.nodeIndex)
        }}
        onBlur={() => {
          startHoveringButtonsTimeout()
        }}
      />
    </Container>
  )
}

const Container = styled.div`
  margin: 1em 0;

  border-radius: 8px;
  border: 1px solid rgb(217, 217, 217);
  background-color: rgba(255, 255, 255, 0.88);
`

const Header = styled.div`
  padding: 0.5em;
  cursor: pointer;
`

const NodeStatusSummary = styled.span`
  margin: 0 0.5em;
  padding: 3px 0;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
  vertical-align: middle;
  > span {
    margin: 0 0.3em;
  }
`
const JourneyStatusSummary = NodeStatusSummary

const GraphContainer = styled.div`
  flex: 1 0 auto;
  max-width: 60%;
`
const NodesList = styled.div`
  max-width: 50%;
  flex: 1 0 auto;
  padding: 3px;

  > ul {
    list-style-type: none;
    padding-left: 0;
  }

  > ul > li {
    display: block;
    margin: 0;
    padding: 5px 0;
    display: flex;
    flex-direction: row;

    > * {
      flex: 1 0 auto;
    }

    > a {
      width: 150px;
      max-width: 200px;
    }

    > .button {
      flex: 0 0 auto;
      width: 30px;
    }

    &.focus {
      background-color: rgba(0, 0, 0, 0.05);
    }
  }

  > h2 {
    font-size: 1.2em;
    :hover {
      cursor: pointer;
    }
  }
`

const JourneysList = styled.div`
  max-width: 50%;
  flex: 1 0 auto;
  padding: 3px;

  > ul {
    list-style-type: none;
    padding-left: 0;
  }

  > ul > li {
    display: block;
    margin: 0;
    padding: 5px 0;
    display: flex;
    flex-direction: row;

    > * {
      flex: 1 0 auto;
    }

    > a {
      width: 150px;
      max-width: 200px;
    }

    > .button {
      flex: 0 0 auto;
      width: 30px;
    }

    &.focus {
      background-color: rgba(0, 0, 0, 0.05);
    }
  }

  > h2 {
    font-size: 1.2em;
    :hover {
      cursor: pointer;
    }
  }
`

type JourneyRowProps = {
  journey: JourneyType
  focus: boolean
  onFocus: () => void
  onBlur: () => void
}
const JourneyRow = ({ journey, focus, onFocus, onBlur }: JourneyRowProps) => {
  const {
    chats: { addChats },
  } = React.useContext(appContext)
  const { getUrl } = useJourneyFns(journey)

  return (
    <li
      onMouseOver={onFocus}
      onMouseOut={onBlur}
      className={classNames({ focus })}
    >
      <a href={getUrl()}>
        <span>
          <StatusIcon color={JourneyStatusToColor[getJourneyStatus(journey)]} />
        </span>
        <span>
          {journey.id.substring(0, 10)} [{journey.num_connections}]
        </span>{" "}
        <LinkOutlined />
      </a>
      <span className="button">
        <button
          onClick={() => {
            addChats([journey.chat_id])
          }}
        >
          <WechatOutlined />
        </button>
      </span>
    </li>
  )
}

type NodeRowProps = {
  node: NodeType
  focus: boolean
  onFocus: () => void
  onBlur: () => void
}
const NodeRow = ({
  node,
  focus = false,
  onFocus = () => {},
  onBlur = () => {},
}: NodeRowProps) => {
  const { getAdminUrl: getUrl } = useNodeFns(node)

  return (
    <li
      onMouseOver={onFocus}
      onMouseOut={onBlur}
      className={classNames({ focus })}
    >
      <a href={getUrl()}>
        <span>
          <StatusIcon color={NodeStatusToColor[getNodeStatus(node)]} />
        </span>
        {node.name}[{node.id}] - {node.status}
      </a>
      <NodeButtons node={node} />
    </li>
  )
}

type NodeButtonsProps = {
  node: NodeType
}
export const NodeButtons = ({ node }: NodeButtonsProps) => {
  const {
    chats: { addChats },
  } = React.useContext(appContext)
  const { getAdminUrl: getUrl } = useNodeFns(node)

  return (
    <NodeButtonsContainer>
      <li>
        <a href={getUrl()}>
          <button>
            <LinkOutlined />
          </button>
        </a>
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
    </NodeButtonsContainer>
  )
}

const NodeButtonsContainer = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;

  > li {
    display: inline-block;
    margin: 0 0.2em;

    button {
      cursor: pointer;
    }
  }
`

type HoveringNodeButtonsProps = {
  node: NodeType
  x: number
  y: number
  hide: boolean
  onFocus: () => void
  onBlur: () => void
}
export const HoveringNodeButtons = ({
  node,
  x,
  y,
  hide = false,
  onFocus = () => {},
  onBlur = () => {},
}: HoveringNodeButtonsProps) => {
  if (!hide && node)
    return (
      <div
        style={{
          zIndex: 100,
          position: "fixed",
          top: y,
          left: x,
          backgroundColor: "#ddd",
          borderRadius: "5px",
          padding: "3px",
        }}
        onMouseEnter={onFocus}
        onMouseLeave={onBlur}
      >
        <NodeButtons node={node} />
      </div>
    )
}
