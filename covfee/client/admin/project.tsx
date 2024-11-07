import { Button, Tooltip } from "antd"
import * as React from "react"

import Constants from "Constants"
import { ProjectType } from "types/project"
import { appContext } from "../app_context"
import { useProject } from "../models/Project"
import { HitBlock } from "./hit_block/hit_block"

interface Props {
  project: ProjectType
}

export const Project = (props: Props) => {
  const { socket } = React.useContext(appContext)
  const { project } = useProject(props.project, socket)

  return (
    <>
      <div style={{ margin: "2em 1em" }}>
        <Tooltip title="Download a CSV file with journey names, URLs to journeys and completion codes. It may be useful for uploading HITs to crowd-sourcing platforms.">
          <Button
            type="primary"
            href={Constants.api_url + "/projects/" + project.id + "/csv"}
          >
            Download URLs
          </Button>
        </Tooltip>
        <Tooltip title="Download a JSON file with the data collected thus far for the current project.">
          <Button
            href={
              Constants.api_url + "/projects/" + project.id + "/download?csv=1"
            }
          >
            Download results (JSON)
          </Button>
        </Tooltip>
      </div>

      <div style={{ padding: "1em" }}>
        {project.hits.map((hit, index) => {
          return <HitBlock hit={hit} key={index}></HitBlock>
        })}
      </div>
    </>
  )
}
