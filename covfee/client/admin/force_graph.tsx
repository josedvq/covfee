import * as React from "react";
import * as d3 from "d3";
import type { SimulationNodeDatum, Simulation } from "d3";
import { NodesVisitor } from "typescript";

export type GraphPath = number[];
export type Node = {
  id: number;
  name: string;
  color: string;
};

export type Link = {
  source: number;
  target: number;
  group: number;
};

interface SimulationNode extends SimulationNodeDatum {
  id: number;
}

interface Props {
  nodes: Node[];
  paths: GraphPath[];
  nodeId?: (n: any, i: number) => number;
  nodeGroup: (n: any, i: number) => number;
  linkGroup: (l: any, i: number) => number;
  nodeTitle?: (n: any, i: number) => string | number;
  nodeFill?: string;
  nodeStroke?: string;
  nodeStrokeWidth?: number;
  nodeStrokeOpacity?: number;
  nodeRadius?: number;
  nodeStrength?: number;
  linkStrokeWidth?: number | ((l: any, i: number) => number);
  linkStrength?: number;
  colors?: readonly string[];
  width?: number;
  height?: number;
}

const getDimensions = (nodes: SimulationNode[], nodeRadius: number) => {
  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;
  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    maxX = Math.max(maxX, node.x);
    minY = Math.min(minY, node.y);
    maxY = Math.max(maxY, node.y);
  }

  return [maxX - minX + 2 * nodeRadius, maxY - minY + 2 * (nodeRadius + 50)];
};

const createLinks = (paths: GraphPath[]) => {
  const links: Link[] = [];
  paths.forEach((paths, index) => {
    links.push({ source: -1, target: paths[0], group: -1 });
    for (let i = 0; i < paths.length - 1; i++) {
      links.push({
        source: paths[i],
        target: paths[i + 1],
        group: index,
      });
    }
    links.push({
      source: paths[paths.length - 1],
      target: -2,
      group: -2,
    });
  });
  return links;
};

export const ForceGraph = ({
  nodes,
  paths,
  nodeGroup, // given d in nodes, returns an (ordinal) value for color
  linkGroup,
  nodeFill = "currentColor", // node stroke fill (if not using a group color encoding)
  nodeStroke = "#fff", // node stroke color
  nodeStrokeWidth = 1.5, // node stroke width, in pixels
  nodeStrokeOpacity = 1, // node stroke opacity
  nodeRadius = 20, // node radius, in pixels
  nodeStrength = -500,
  linkStrokeWidth = 1.5, // given d in links, returns a stroke width in pixels
  linkStrength = 0.25,
}: Props) => {
  const svgRef = React.useRef<SVGSVGElement>();

  const nodesRefs = React.useRef(null);
  const linksRefs = React.useRef(null);

  const updateNodes = () => {
    nodesRefs.current
      .attr("fill", ({ index }) => nodes[index].color)
      .append("title")
      .text(({ index }) => nodes[index].name);
  };

  React.useEffect(() => {
    if (nodesRefs.current) {
      updateNodes();
    }
  }, [nodes]);

  React.useEffect(() => {
    // Compute values.
    const startingWidth = 1000;
    const links = createLinks(paths);
    const longestPathLength = Math.max(...paths.map((p) => p.length));
    const nodeRadius = startingWidth / (6 * longestPathLength);
    const collideRadius = (2 * startingWidth) / (6 * longestPathLength);
    const linkDistance = startingWidth / (2 * longestPathLength);

    console.log(
      `longestPathLength=${longestPathLength}, nodeRadius=${nodeRadius}, linkDistance=${linkDistance}`
    );

    // const N = d3.map(nodes, nodeId);
    const LS = d3.map(links, ({ source }) => source);
    const LT = d3.map(links, ({ target }) => target);
    const G = nodeGroup == null ? null : d3.map(nodes, nodeGroup);
    const L = linkGroup == null ? null : d3.map(links, linkGroup);

    // Replace the input nodes and links with mutable objects for the simulation.
    let _nodes: SimulationNode[] = d3.map(nodes, (n) => ({ id: n.id }));
    // add source and sync to simulation
    _nodes.push({ id: -1 }); // source
    _nodes.push({ id: -2 }); // sink
    let _links = d3.map(links, (_, i) => ({ source: LS[i], target: LT[i] }));

    // Compute default domains.
    let nodeGroups, linkGroups;
    if (G) {
      nodeGroups = d3.sort(G);
    }
    if (L) {
      linkGroups = d3.sort(L);
    }

    // Construct the forces.
    // const forceY = d3.forceY();
    const forceNode = d3.forceManyBody();
    const forceLink = d3.forceLink(_links).id(({ index: i }) => _nodes[i].id);
    forceLink.distance((_) => linkDistance);
    if (nodeStrength !== undefined) forceNode.strength(nodeStrength);
    if (linkStrength !== undefined) forceLink.strength(2);
    const forceCollide = d3.forceCollide(collideRadius);

    const simulation = d3
      .forceSimulation(_nodes)
      // .force("y-axis", forceY)
      .force("collide", forceCollide)
      .force("link", forceLink)
      .force("charge", forceNode)
      .force("endpoints", () => {
        for (const node of _nodes) {
          if (node.id == -1) {
            node.x = -startingWidth / 2;
            node.y = 0;
          }
          if (node.id == -2) {
            node.x = startingWidth / 2;
            node.y = 0;
          }
        }
      })
      // .force("center", d3.forceCenter())
      .on("tick", () => {
        linksRefs.current
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);

        nodesRefs.current.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      })
      .tick(100);

    console.log(_nodes);
    // remove the source and sync
    _nodes = _nodes.filter((n) => n.id != -1 && n.id != -2);
    console.log(_links);
    _links = _links.filter((l) => l.source.id != -1 && l.target.id != -2);
    console.log(_links);

    const [width, height] = getDimensions(_nodes, nodeRadius);
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr(
        "style",
        "width: 500px; max-width: 100%; height: auto; height: intrinsic;"
      );

    linksRefs.current = svg
      .append("g")
      .attr("stroke", "#000")
      .attr("stroke-opacity", 0.5)
      .attr(
        "stroke-width",
        typeof linkStrokeWidth !== "function" ? linkStrokeWidth : null
      )
      .attr("stroke-linecap", "round")
      .selectAll("line")
      .data(_links)
      .join("line");

    nodesRefs.current = svg
      .append("g")
      .attr("fill", nodeFill)
      .attr("stroke", nodeStroke)
      .attr("stroke-opacity", nodeStrokeOpacity)
      .attr("stroke-width", nodeStrokeWidth)
      .selectAll("circle")
      .data(_nodes)
      .join("circle")
      .attr("r", nodeRadius);

    updateNodes();
  }, []);

  return <svg ref={svgRef} style={{ width: "400px", height: "intrinsic" }} />;
};
