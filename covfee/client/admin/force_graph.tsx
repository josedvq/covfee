import * as React from "react";
import * as d3 from "d3";
import type { SimulationNodeDatum, Simulation } from "d3";
import { NodesVisitor } from "typescript";

export type GraphPath = number[];
export type Node = {
  id: number;
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
  nodeId = (d) => d.id, // given d in nodes, returns a unique identifier (string)
  nodeGroup, // given d in nodes, returns an (ordinal) value for color
  linkGroup,
  nodeTitle, // given d in nodes, a title string
  nodeFill = "currentColor", // node stroke fill (if not using a group color encoding)
  nodeStroke = "#fff", // node stroke color
  nodeStrokeWidth = 1.5, // node stroke width, in pixels
  nodeStrokeOpacity = 1, // node stroke opacity
  nodeRadius = 20, // node radius, in pixels
  nodeStrength = -500,
  linkStrokeWidth = 1.5, // given d in links, returns a stroke width in pixels
  linkStrength = 0.25,
  colors = d3.schemeTableau10, // an array of color strings, for the node groups
  width = 640, // outer width, in pixels
  height = 400, // outer height, in pixels
}: Props) => {
  const svgRef = React.useRef<SVGSVGElement>();

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

    const N = d3.map(nodes, nodeId);
    const LS = d3.map(links, ({ source }) => source);
    const LT = d3.map(links, ({ target }) => target);
    if (nodeTitle === undefined) nodeTitle = (_, i) => N[i];
    const T = nodeTitle == null ? null : d3.map(nodes, nodeTitle);
    const G = nodeGroup == null ? null : d3.map(nodes, nodeGroup);
    const L = linkGroup == null ? null : d3.map(links, linkGroup);

    const W =
      typeof linkStrokeWidth !== "function"
        ? null
        : d3.map(links, linkStrokeWidth);
    // const L = typeof linkStroke !== "function" ? null : d3.map(links, linkStroke);

    // Replace the input nodes and links with mutable objects for the simulation.
    const _nodes: SimulationNode[] = d3.map(nodes, (_, i) => ({ id: N[i] }));
    const _links = d3.map(links, (_, i) => ({ source: LS[i], target: LT[i] }));

    // Compute default domains.
    let nodeGroups, linkGroups;
    if (G) {
      nodeGroups = d3.sort(G);
    }
    if (L) {
      linkGroups = d3.sort(L);
    }

    // Construct the scales.
    const nodeColor =
      nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors);
    const linkColor =
      nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors);

    // Construct the forces.
    // const forceY = d3.forceY();
    const forceNode = d3.forceManyBody();
    const forceLink = d3.forceLink(_links).id(({ index: i }) => N[i]);
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
      .on("tick", ticked)
      .tick(100);

    const getDimensions = (nodes: SimulationNode[]) => {
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

      return [
        maxX - minX + 2 * nodeRadius,
        maxY - minY + 2 * (nodeRadius + 50),
      ];
    };

    const [width, height] = getDimensions(_nodes);
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr(
        "style",
        "width: 500px; max-width: 100%; height: auto; height: intrinsic;"
      );

    const link = svg
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

    const node = svg
      .append("g")
      .attr("fill", nodeFill)
      .attr("stroke", nodeStroke)
      .attr("stroke-opacity", nodeStrokeOpacity)
      .attr("stroke-width", nodeStrokeWidth)
      .selectAll("circle")
      .data(_nodes)
      .join("circle")
      .attr("r", nodeRadius)
      .call(drag(simulation));

    if (W) link.attr("stroke-width", ({ index: i }) => W[i]);
    console.log(L);
    if (L)
      link.attr("stroke", ({ index: i }) => {
        console.log(L[i]);
        return linkColor(L[i]);
      });
    if (G) node.attr("fill", ({ index: i }) => nodeColor(G[i]));
    if (T) node.append("title").text(({ index: i }) => T[i]);

    function ticked() {
      console.log("tick");
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    }

    function drag(simulation: Simulation<SimulationNode, any>) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }
  }, []);

  return <svg ref={svgRef} style={{ width: "400px", height: "intrinsic" }} />;
};
