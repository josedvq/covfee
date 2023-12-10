import * as React from "react"
import { Select, Typography, Empty, Button } from "antd"

const { Paragraph } = Typography
const { Option } = Select
import Constants from "Constants"
import { myerror, fetcher, throwBadResponse } from "../utils"
import { LoadingOutlined } from "@ant-design/icons"
import Modal from "antd/lib/modal/Modal"
import { HitEditorForm } from "./hit_editor"
import { getAllProjects, getProject, useProject } from "../models/Project"
import { ProjectType } from "types/project"
import { HitBlock } from "./hit_block/hit_block"
import { appContext } from "../app_context"
import { Project } from "./project"
import { chatContext } from "../chat_context"
import { AdminProvider } from "./admin_provider"

interface Props {}

const ProjectsPage = (props: Props) => {
  const {
    userConfig: { setConfig, getConfig },
  } = React.useContext(appContext)

  const [isLoadingProject, setIsLoadingProject] = React.useState<boolean>(true)

  const [currentProjectIndex, setCurrentProjectIndex] =
    React.useState<number>(null)
  const [projects, setProjects] = React.useState<ProjectType[]>(null)
  const [project, setProject] = React.useState<ProjectType>(null)

  // const [instances, setInstances] = React.useState<HitInstanceType[]>();
  const { clearChats, addChats, clearChatListeners, addChatListeners } =
    React.useContext(chatContext)

  const handleChangeProject = React.useCallback(
    (projectIndex: number) => {
      setIsLoadingProject(true)
      setCurrentProjectIndex(null)
      getProject(projects[projectIndex].id).then((proj) => {
        setProject(proj)

        setIsLoadingProject(false)
        setCurrentProjectIndex(projectIndex)

        const chat_ids = [].concat.apply(
          [],
          proj.hits.map((inst) => inst.journeys.map((j) => j.chat_id))
        ) as number[]
        clearChatListeners()

        addChatListeners(chat_ids)
      })
    },
    [projects, addChatListeners, clearChatListeners]
  )

  React.useEffect(() => {
    // fetch projects
    if (projects !== null) return
    getAllProjects()
      .then((ps) => {
        setProjects(ps)
      })
      .catch((error) => {
        myerror("Error loading projects.", error)
      })
  }, [projects])

  React.useEffect(() => {
    if (projects && currentProjectIndex == null) {
      handleChangeProject(0)
    }
  }, [currentProjectIndex, handleChangeProject, projects])

  // const handleClickEditHit = (index: number) => {
  //   setState((s) => ({
  //     ...s,
  //     hitEditor: {
  //       hitIndex: index,
  //       visible: true,
  //     },
  //   }))
  // }

  if (projects === null) {
    // loading projects
    return (
      <div className={"site-layout-content"}>
        <LoadingOutlined />
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <>
        <Paragraph>
          <Empty description="There are no projects to show." />
        </Paragraph>
      </>
    )
  }

  return (
    <>
      {/* {!isLoadingProject && (
        <Modal
          open={state.hitEditor.visible}
          footer={null}
          onCancel={() => {
            setState({
              ...state,
              hitEditor: { ...state.hitEditor, visible: false },
            })
          }}
        >
          <HitEditorForm
            key={state.hitEditor.hitIndex}
            initialValues={project.hitSpecs[state.hitEditor.hitIndex]}
          />
        </Modal>
      )} */}

      <div style={{ margin: "2em 1em" }}>
        Project:{" "}
        <Select
          value={currentProjectIndex}
          onChange={handleChangeProject}
          style={{ width: 240 }}
        >
          {projects.map((p, index) => {
            return (
              <Option key={index} value={index}>
                {p.name}
              </Option>
            )
          })}
        </Select>
      </div>

      {!isLoadingProject && <Project project={project} />}
    </>
  )
}

export default ProjectsPage
