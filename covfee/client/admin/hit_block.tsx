import * as React from "react";
import styled from "styled-components";

import { HitInstanceType, HitType, JourneyType } from "types/hit";
import { NodeType } from "types/node";
import { useHitInstance } from "../models/Hit";
import { HitInstanceGraph } from "./hit_graph";
import { ForceGraph, Node, Link } from "./force_graph";
import {
  CheckCircleOutlined,
  DownOutlined,
  LinkOutlined,
  NodeIndexOutlined,
  StopOutlined,
  WechatOutlined,
} from "@ant-design/icons";
import { useJourney, useJourneyFns } from "../models/Journey";
import { useNode, useNodeFns } from "../models/Node";
import { App, Button } from "antd";
import { appContext } from "../app_context";

interface Props {
  instance: HitInstanceType;
}
export const HitBlock = (props: Props) => {
  const { socket } = React.useContext(appContext);
  const [collapsed, _setCollapsed] = React.useState<boolean>(
    props.instance.collapsed
  );
  const [showGraph, _setShowGraph] = React.useState<boolean>(
    props.instance.show_graph
  );
  const [showJourneys, _setShowJourneys] = React.useState<boolean>(
    props.instance.show_journeys
  );
  const [showNodes, _setShowNodes] = React.useState<boolean>(
    props.instance.show_nodes
  );
  const {
    hitInstance,
    setCollapsed: storeCollapsed,
    setShowGraph: storeShowGraph,
    setShowJourneys: storeShowJourneys,
    setShowNodes: storeShowNodes,
  } = useHitInstance(props.instance, socket);

  const setCollapsed = async (value: boolean) => {
    _setCollapsed(value);
    storeCollapsed(value);
  };

  const setShowGraph = async (value: boolean) => {
    _setShowGraph(value);
    storeShowGraph(value);
  };

  const setShowJourneys = async (value: boolean) => {
    _setShowJourneys(value);
    storeShowJourneys(value);
  };

  const setShowNodes = async (value: boolean) => {
    _setShowNodes(value);
    storeShowNodes(value);
  };

  return (
    <Container>
      <Header
        onClick={() => {
          setCollapsed(!collapsed);
        }}
      >
        <span>{hitInstance.id.substring(0, 10)}</span>
        <NodeIndexOutlined />{" "}
        {`${hitInstance.journeys.filter((j) => j.submitted).length} / ${
          hitInstance.journeys.length
        }`}
        {collapsed && <DownOutlined />}
      </Header>

      {!collapsed && (
        <div style={{ display: "flex", flexDirection: "row" }}>
          <div style={{ display: "flex", alignItems: "center", width: "60%" }}>
            <NodesList>
              <h2>Nodes</h2>

              <ul>
                {hitInstance.nodes.map((node, index) => {
                  return <NodeRow key={index} {...node}></NodeRow>;
                })}
              </ul>
            </NodesList>

            {/* <Button onClick={() => setShowGraph(!showGraph)}>Graph</Button> */}
            {showGraph && (
              <GraphContainer>
                <HitInstanceGraph instance={props.instance}></HitInstanceGraph>
              </GraphContainer>
            )}
          </div>

          <div style={{ width: "40%" }}>
            <JourneysList>
              <h2>Journeys</h2>

              <ul>
                {hitInstance.journeys.map((journey, index) => {
                  return <JourneyRow key={index} {...journey}></JourneyRow>;
                })}
              </ul>
            </JourneysList>
          </div>
        </div>
      )}
    </Container>
  );
};
const StatusIcon = styled.span<{ status: "online" | "offline" }>`
  display: inline-block;
  width: 1em;
  height: 1em;
  margin-right: 0.2em;
  border-radius: 0.5em;
  background-color: ${(props) => (props.status == "online" ? "green" : "red")};
  vertical-align: middle;
`;

const Container = styled.div`
  margin: 1em 0;

  border-radius: 8px;
  border: 1px solid rgb(217, 217, 217);
  background-color: rgba(255, 255, 255, 0.88);
`;

const Header = styled.div`
  padding: 0.5em;

  :hover {
    cursor: pointer;
  }
`;

const ShowGraphButton = styled.div``;
const GraphContainer = styled.div`
  flex: 1 0 auto;
  max-width: 60%;
`;
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

    :hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
  }

  > h2 {
    font-size: 1.2em;
    :hover {
      cursor: pointer;
    }
  }
`;

const JourneysList = styled.div``;

const JourneyRow = (journey: JourneyType) => {
  const { addChats } = React.useContext(appContext);
  const { getUrl } = useJourneyFns(journey);

  return (
    <div>
      <a href={getUrl()}>
        <span>
          <StatusIcon
            status={journey.num_connections > 0 ? "online" : "offline"}
          ></StatusIcon>
        </span>
        <span>
          {journey.id.substring(0, 10)} [{journey.num_connections}]
        </span>{" "}
        <LinkOutlined />
      </a>
      <span className="button">
        <button
          onClick={() => {
            addChats([journey.chat_id]);
          }}
        >
          <WechatOutlined />
        </button>
      </span>
    </div>
  );
};

const NodeRow = (node: NodeType) => {
  const { addChats } = React.useContext(appContext);
  const { getUrl } = useNodeFns(node);

  return (
    <li>
      <a href={getUrl()}>
        <LinkOutlined /> {node.name}[{node.id}] - {node.status}
      </a>
      <span className="button">
        <button
          onClick={() => {
            addChats([node.chat_id]);
          }}
        >
          <WechatOutlined />
        </button>
      </span>
    </li>
  );
};
