import * as React from "react";

import { HitInstanceType, HitType, JourneyType } from "types/hit";
import { NodeType } from "types/node";
import { useHitInstance } from "../models/Hit";
import { ForceGraph, Node, Link } from "./force_graph";
import { NodeStatus } from "../types/node";

interface Props {
  instance: HitInstanceType;
}

const statusToColor: Record<NodeStatus, string> = {
  INIT: "red",
  WAITING: "yellow",
  PAUSED: "yellow",
  RUNNING: "blue",
  FINISHED: "green",
};

export const HitInstanceGraph = (props: Props) => {
  const svgRef = React.useRef();

  const createNodes = (nodes: NodeType[]) => {
    const n = props.instance.nodes.map((n) => {
      return {
        id: n.id,
        name: n.name,
        group: 1,
        color: statusToColor[n.status],
      };
    });

    return n;
  };

  //   const svg = React.useRef(
  //     ForceGraph({
  //       nodes: createNodes(props.instance.nodes),
  //       links: createLinks(props.instance.journeys),
  //       nodeId: (d) => d.id,
  //       nodeGroup: (d) => d.group,
  //       linkGroup: (l) => l.group,
  //       nodeTitle: (d) => `${d.id}\n${d.group}`,
  //       linkStrokeWidth: (l) => Math.sqrt(l.value),
  //       width: 600,
  //       height: 600,
  //       nodeStrength: -500,
  //       linkStrength: 0.25,
  //     })
  //   );

  //   React.useEffect(() => {
  //     console.log(svg.current);
  //     svgRef.current.append(svg.current);
  //   }, [svgRef]);

  return (
    <>
      <ForceGraph
        nodes={createNodes(props.instance.nodes)}
        paths={props.instance.journeys.map((j) => j.nodes)}
        nodeId={(d) => d.id}
        nodeGroup={(d) => d.group}
        linkGroup={(l) => l.group}
        nodeTitle={(d) => `${d.id}\n${d.group}`}
        linkStrokeWidth={(l) => Math.sqrt(l.value)}
        width={600}
        height={600}
        nodeStrength={-100}
        linkStrength={0.3}
      />
      {/* <div ref={svgRef}></div> */}
      {/* {svg.current} */}
    </>
  );
};
