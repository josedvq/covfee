import * as React from "react"
import { Select, Typography, Empty, Button } from "antd"

import Constants from "Constants"
import { getAllProjects, getProject, useProject } from "../models/Project"
import { ProjectType } from "types/project"
import { HitBlock } from "./hit_block/hit_block"
import { appContext } from "../app_context"

interface Props {
  project: ProjectType
}

export const Project = (props: Props) => {
  const { socket } = React.useContext(appContext)
  const { project } = useProject(props.project, socket)

  return (
    <>
      <div style={{ margin: "2em 1em" }}>
        <Button
          type="primary"
          href={Constants.api_url + "/projects/" + project.id + "/csv"}
        >
          Download URLs
        </Button>
        <Button
          href={
            Constants.api_url + "/projects/" + project.id + "/download?csv=1"
          }
        >
          Download results (JSON)
        </Button>
      </div>

      <div style={{ padding: "1em" }}>
        {project.hits.map((hit, index) => {
          return <HitBlock hit={hit} key={index}></HitBlock>
        })}
      </div>
    </>
  )
}
