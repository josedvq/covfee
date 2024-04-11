import type { SimulationNodeDatum } from "d3"
import * as d3 from "d3"
import * as React from "react"
import { ReducedJourney } from "../models/Journey"
import { HitInstanceType } from "../types/hit"
import { NodeType } from "../types/node"
import { NodeStatusToColor, getNodeStatus } from "./utils"

const getDimensions = (nodes: SimulationNode[], nodeRadius: number) => {
  let minX = Infinity,
    maxX = -Infinity
  let minY = Infinity,
    maxY = -Infinity
  for (const node of nodes) {
    minX = Math.min(minX, node.x)
    maxX = Math.max(maxX, node.x)
    minY = Math.min(minY, node.y)
    maxY = Math.max(maxY, node.y)
  }

  return [maxX - minX + 2 * nodeRadius, maxY - minY + 2 * (nodeRadius + 50)]
}

const createNodes = (nodes: NodeType[], focusedNode: number) => {
  const res = nodes.map((n, index) => {
    let name = n.name
    if (n.progress !== null && n.progress !== undefined) {
      name += ` (${n.progress.toFixed(1)}%)`
    }
    return {
      id: n.id,
      name: name,
      focused: focusedNode === index,
      color: NodeStatusToColor[getNodeStatus(n)],
    }
  })

  return res
}

const createLinks = (journeys: ReducedJourney[]) => {
  const links: Link[] = []
  journeys.forEach((journey, index) => {
    links.push({ source: -1, target: journey.nodes[0], group: -1 })
    for (let i = 0; i < journey.nodes.length - 1; i++) {
      links.push({
        source: journey.nodes[i],
        target: journey.nodes[i + 1],
        group: index,
      })
    }
    links.push({
      source: journey.nodes[journey.nodes.length - 1],
      target: -2,
      group: -2,
    })
  })
  return links
}

export type GraphPath = number[]
export type Node = {
  id: number
  name: string
  color: string
  focused: boolean
}

export type Link = {
  source: number
  target: number
  group: number
}

export type SimulationLink = {
  source: SimulationNodeDatum
  target: SimulationNodeDatum
  group: number
}

interface SimulationNode extends SimulationNodeDatum {
  id: number
}

export type Options = {
  nodeStrength?: number
  linkStrokeWidth?: number // given d in links, returns a stroke width in pixels
  linkStrength?: number
  onNodeFocus?: (index: number, x: number, y: number) => void
  onNodeBlur?: (index: number) => void
}

type Props = Options & {
  hit: HitInstanceType
  focusedNode: number
  focusedJourney: number
}

export const ForceGraph = ({
  hit,
  focusedNode,
  focusedJourney,
  nodeStrength = -500,
  linkStrokeWidth = 1.5, // given d in links, returns a stroke width in pixels
  linkStrength = 0.25,
  onNodeFocus = () => {},
  onNodeBlur = () => {},
}: Props) => {
  const svgRef = React.useRef<SVGSVGElement>()

  const nodesRefs =
    React.useRef<d3.Selection<SVGGElement, SimulationNode, SVGGElement, any>>(
      null
    )
  const linksRefs =
    React.useRef<
      d3.Selection<SVGLineElement, SimulationLink, SVGGElement, any>
    >(null)

  const updateNodes = (nodes: Node[]) => {
    nodesRefs.current
      .selectChildren("circle")
      .attr("fill", ({ index }) => nodes[index].color)
      .attr("stroke-opacity", ({ index }) =>
        nodes[index].focused ? "0.1" : "0.01"
      )
    nodesRefs.current
      .selectChildren("text")
      .text(({ index }) => nodes[index].name)
  }

  React.useEffect(() => {
    if (nodesRefs.current) {
      updateNodes(createNodes(hit.nodes, focusedNode))
    }
    if (linksRefs.current) {
      linksRefs.current.attr("stroke-width", ({ group }) => {
        return group == focusedJourney ? "5" : "1.5"
      })
    }
  }, [hit, focusedNode, focusedJourney])

  React.useEffect(() => {
    // Compute values.
    const startingWidth = 1000
    const nodes = createNodes(hit.nodes, focusedNode)
    const links = createLinks(hit.journeys)
    const longestPathLength = Math.max(
      ...hit.journeys.map((p) => p.nodes.length)
    )
    const nodeRadius = startingWidth / (6 * longestPathLength)
    const collideRadius = (2 * startingWidth) / (6 * longestPathLength)
    const linkDistance = startingWidth / (2 * longestPathLength)

    console.log(
      `longestPathLength=${longestPathLength}, nodeRadius=${nodeRadius}, linkDistance=${linkDistance}`
    )

    // Main steps
    // 1. Set up the simulation
    // 2. Run the simulation
    // 3. Stop
    // 4. Read the positions and draw in SVG

    // Replace the input nodes and links with mutable objects for the simulation.
    let _nodes: SimulationNode[] = d3.map(nodes, (n) => ({ id: n.id }))
    // add source and sync to simulation
    _nodes.push({ id: -1 }) // source
    _nodes.push({ id: -2 }) // sink

    let _links = d3.map(links, (l, i) => ({ ...l })) as SimulationLink[]

    // Construct the forces.
    const forceNode = d3.forceManyBody() // nodes repel each other
    const forceLink = d3.forceLink(_links).id(({ index: i }) => _nodes[i].id) // links pull nodes together
    forceLink.distance((_) => linkDistance)
    if (nodeStrength !== undefined) forceNode.strength(nodeStrength)
    if (linkStrength !== undefined) forceLink.strength(2)
    const forceCollide = d3.forceCollide(collideRadius) // prevents nodes from overlapping

    const simulation = d3
      .forceSimulation(_nodes)
      .force("collide", forceCollide)
      .force("link", forceLink)
      .force("charge", forceNode)
      .force("endpoints", () => {
        // fix the source and sink in place using this custom force
        for (const node of _nodes) {
          if (node.id == -1) {
            node.x = -startingWidth / 2
            node.y = 0
          }
          if (node.id == -2) {
            node.x = startingWidth / 2
            node.y = 0
          }
        }
      })
      // here we run the simulation for 500 ticks
      // this should mean it is in steady state now

      .tick(500)
      .stop()

    // now we can remove the source and the sync
    _nodes = _nodes.filter((n) => n.id != -1 && n.id != -2)
    _links = _links.filter((l) => l.source.id != -1 && l.target.id != -2)

    // We get the bounding box of the nodes
    const [width, height] = getDimensions(_nodes, nodeRadius)

    // and we draw in SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr(
        "style",
        "width: 500px; max-width: 100%; height: auto; height: intrinsic;"
      )

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
      .join("line")
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y)

    nodesRefs.current = svg
      .append("g")
      .selectAll("g")
      .data(_nodes)
      .enter()
      .append("g")

    nodesRefs.current.each(function (d) {
      d3.select(this)
        .append("circle")
        .attr("r", nodeRadius)
        .attr("stroke", "#000")
        .attr("stroke-opacity", "0.01")
        .attr("stroke-width", "50px")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .on("mouseover", function (d, { index }) {
          onNodeFocus(index, d.clientX, d.clientY)
        })
        .on("mouseout", function (d, { index }) {
          onNodeBlur(index)
        })
      d3.select(this)
        .append("text")
        .attr("paint-order", "stroke")
        .attr("fill", "#000")
        .attr("stroke", "#fff")
        .attr("stroke-width", "5px")
        .attr("text-anchor", "middle")
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y)
        .text(({ index }) => nodes[index].name)
    })

    updateNodes(nodes)
  }, [])

  return <svg ref={svgRef} style={{ width: "400px", height: "intrinsic" }} />
}
