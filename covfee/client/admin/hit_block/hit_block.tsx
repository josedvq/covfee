import * as React from "react"
import styled from "styled-components"

import { HitInstanceType } from "../../types/hit"
import { NodeStatus } from "../../types/node"
import { NodeIndexOutlined } from "@ant-design/icons"
import { appContext } from "../../app_context"
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
} from "../utils"
import classNames from "classnames"
import { ForceGraph } from "../force_graph"
import { NodeButtons, NodeRow } from "./node_buttons"
import { HoveringButtons } from "./utils"
import type { HoveringButtonsArgs } from "./utils"
import { JourneyRow } from "./journey_buttons"

interface Props {
  hit: HitInstanceType
}
export const HitBlock = (props: Props) => {
  const {
    userConfig: { setConfig, getConfig },
  } = React.useContext(appContext)

  // sync collapsed with user config
  const [collapsed, setCollapsed] = React.useState<boolean>(
    getConfig(`${props.hit.id}_collapsed`, "0") == "1"
  )
  React.useEffect(() => {
    setConfig(`${props.hit.id}_collapsed`, collapsed ? "1" : "0")
  }, [collapsed, props.hit.id, setConfig])

  const timeout = React.useRef<NodeJS.Timeout>(null)

  const [focusedNode, setFocusedNode] = React.useState<number>(null)
  const [focusedJourney, setFocusedJourney] = React.useState<number>(null)
  const [hoveringButtonProps, setHoveringButtonProps] = React.useState<
    HoveringButtonsArgs & { nodeIndex: number }
  >({ nodeIndex: null, hide: true, x: 100, y: 100 })

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
                      danger={node.paused}
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
      <HoveringButtons
        {...hoveringButtonProps}
        content={() => {
          console.log("called")
          console.log(hoveringButtonProps.hide)
          console.log(hoveringButtonProps.nodeIndex)
          return (
            <NodeButtons
              node={props.hit.nodes[hoveringButtonProps.nodeIndex]}
            ></NodeButtons>
          )
        }}
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
