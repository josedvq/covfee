import { JourneySpec } from "@covfee-spec/journey";
import { NodeType } from "./node";

export interface JourneyType extends Omit<JourneySpec, 'nodes'> {
    nodes: NodeType[]
}