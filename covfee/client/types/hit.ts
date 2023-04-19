import { HitSpec } from "@covfee-spec/hit"
import { NodeType } from "./node"
import { JourneyType } from "./journey"

export type HitType = Omit<HitSpec, 'nodes' | 'journeys'> & {
    nodespecs: NodeType[]
    journeyspecs: number[]
    instances:  HitInstanceType[]
    generator_url: string
}

// extends the specs with all the covfee-added fields
export type HitInstanceType = Omit<HitSpec, 'nodes'> & {
    nodes: NodeType[]
    journeys: number[]
    submitted: boolean
    completionInfo?: any
    created_at: string
    updated_at: string
    submitted_at: string
}