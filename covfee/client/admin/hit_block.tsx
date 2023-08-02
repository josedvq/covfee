import * as React from "react";
import styled from "styled-components";

import { HitInstanceType, HitType, JourneyType, NodeType } from "types/hit";
import { useHitInstance } from "../models/Hit";
import { HitInstanceGraph } from "./hit_graph";
import { ForceGraph, Node, Link } from "./force_graph";
import {
  CheckCircleOutlined,
  DownOutlined,
  LinkOutlined,
  NodeIndexOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useJourney } from "../models/Journey";
import { useNode } from "../models/Node";
import { Button } from "antd";

interface Props {
  instance: HitInstanceType;
}
export const HitBlock = (props: Props) => {
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
  } = useHitInstance(props.instance);

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
          <div style={{ width: "60%" }}>
            <SectionButton onClick={() => setShowNodes(!showNodes)}>
              Nodes
            </SectionButton>

            {showNodes && (
              <div>
                {hitInstance.nodes.map((node, index) => {
                  return <NodeRow key={index} {...node}></NodeRow>;
                })}
              </div>
            )}

            <Button onClick={() => setShowGraph(!showGraph)}>Graph</Button>
            {showGraph && (
              <div>
                <HitInstanceGraph instance={props.instance}></HitInstanceGraph>
              </div>
            )}
          </div>

          <div style={{ width: "40%" }}>
            <SectionButton onClick={() => setShowJourneys(!showJourneys)}>
              Journeys
            </SectionButton>

            {showJourneys && (
              <div>
                {hitInstance.journeys.map((journey, index) => {
                  return <JourneyRow key={index} {...journey}></JourneyRow>;
                })}
              </div>
            )}
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

const SectionButton = styled.div`
  :hover {
    cursor: pointer;
  }
`;

const JourneyRow = (props: JourneyType) => {
  const { journey, getUrl } = useJourney(props);
  return (
    <div>
      <a href={getUrl()}>
        <span>
          <StatusIcon
            status={journey.online ? "online" : "offline"}
          ></StatusIcon>
        </span>
        <span>{journey.id.substring(0, 10)}</span> <LinkOutlined />
      </a>
    </div>
  );
};

const NodeRow = (props: NodeType) => {
  const { node, getUrl } = useNode(props);
  return (
    <div>
      <a href={getUrl()}>
        <LinkOutlined /> {node.id} - {node.status}
      </a>
    </div>
  );
};
