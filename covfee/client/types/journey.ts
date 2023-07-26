import { JourneySpec } from "@covfee-spec/journey";
import { NodeType } from "./node";
import { MarkdownContentSpec } from "@covfee-spec/tasks/utils";

export interface JourneyType extends Omit<JourneySpec, "nodes"> {
  id: string;
  hit_id: string;
  journeyspec_id: number;
  hitspec_id: number;
  nodes: NodeType[];
  extra: MarkdownContentSpec;
  submitted: boolean;
  completionInfo?: any;
  online: boolean;
  curr_node_id: number;
}
