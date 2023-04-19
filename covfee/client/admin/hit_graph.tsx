import * as React from 'react'

import { HitInstanceType, HitType } from 'types/hit'
import { useHitInstance } from '../models/Hit'
import {ForceGraph} from './force_graph'

interface Props {
    instance: HitInstanceType
}

export const HitInstanceGraph = (props: Props) => {
    
    const svgRef = React.useRef()
    const svg = React.useRef(ForceGraph(
        {
            nodes: [
                {id:0},
                {id:1},
                {id:2},
                {id:3},
                {id:4},
                {id:5},
                {id:6},
                {id:7},
                {id:8},
                {id:9},
                {id:10},
                {id:11},
                {id:12},
                {id:13}
            ],
            links: [
              { source: 0, target: 1 },
              { source: 1, target: 2 },
              { source: 2, target: 0 },
              { source: 1, target: 3 },
              { source: 3, target: 2 },
              { source: 3, target: 4 },
              { source: 4, target: 5 },
              { source: 5, target: 6 },
              { source: 5, target: 7 },
              { source: 6, target: 7 },
              { source: 6, target: 8 },
              { source: 7, target: 8 },
              { source: 9, target: 4 },
              { source: 9, target: 11 },
              { source: 9, target: 10 },
              { source: 10, target: 11 },
              { source: 11, target: 12 },
              { source: 12, target: 10 }
            ]
        },
        {
            nodeId: d => d.id,
            nodeGroup: d => d.group,
            nodeTitle: d => `${d.id}\n${d.group}`,
            linkStrokeWidth: l => Math.sqrt(l.value),
            width: 600,
            height: 600,
          }
    ))

    React.useEffect(() => {
        console.log(svg.current)
        svgRef.current.append(svg.current)
    }, [svgRef])

    

    return <>
        <div ref={svgRef}></div>
        {/* {svg.current} */}
    </>
}