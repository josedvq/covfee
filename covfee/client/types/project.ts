import { ProjectSpec } from "@covfee-spec/project"
import { HitType } from "./hit"

export interface ProjectType extends Omit<ProjectSpec, 'hits'> {
    hits: HitType[]
}