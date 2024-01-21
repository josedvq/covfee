import { ProjectSpec } from "@covfee-spec/project";
import { HitInstanceType, HitType } from "./hit";

export interface ProjectType extends Omit<ProjectSpec, "hits"> {
  hitSpecs: HitType[];
  hits: HitInstanceType[];
}
