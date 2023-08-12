import * as React from "react";
import { Select, Typography, Empty, Button } from "antd";

const { Paragraph } = Typography;
const { Option } = Select;
import Constants from "Constants";
import { myerror, fetcher, throwBadResponse } from "../utils";
import { LoadingOutlined } from "@ant-design/icons";
import Modal from "antd/lib/modal/Modal";
import { HitEditorForm } from "./hit_editor";
import { getAllProjects, getProject, useProject } from "../models/Project";
import { ProjectType } from "types/project";
import { HitBlock } from "./hit_block";
import { appContext } from "../app_context";
import { Project } from "./project";

interface State {
  status: string;
  currProject: number;
  loadingProject: boolean;
  hitEditor: {
    hitIndex: number;
    visible: boolean;
  };
}

interface Props {}

const ProjectsPage = (props: Props) => {
  const [state, setState] = React.useState<State>({
    status: "loading",
    currProject: null,
    loadingProject: true,
    hitEditor: {
      hitIndex: null,
      visible: false,
    },
  });

  const [currentProjectIndex, setCurrentProjectIndex] =
    React.useState<number>(null);
  const [projects, setProjects] = React.useState<ProjectType[]>([]);
  const [project, setProject] = React.useState<ProjectType>(null);

  // const [instances, setInstances] = React.useState<HitInstanceType[]>();
  const { clearChats, addChats, clearChatListeners, addChatListeners } =
    React.useContext(appContext);

  React.useEffect(() => {
    // fetch projects
    getAllProjects()
      .then((ps) => {
        if (ps.length == 0) {
          setState((s) => ({
            ...s,
            status: "empty",
          }));
        } else {
          setProjects(ps);
          setState((s) => ({
            ...s,
            status: "ready",
          }));
          setCurrentProjectIndex(0);
        }
      })
      .catch((error) => {
        myerror("Error loading projects.", error);
      });
  }, []);

  React.useEffect(() => {
    if (!projects || currentProjectIndex === null) return;

    setState((s) => ({
      ...s,
      loadingProject: true,
    }));

    getProject(projects[currentProjectIndex].id).then((proj) => {
      setProject(proj);

      setState((s) => ({
        ...s,
        loadingProject: false,
      }));

      const chat_ids = [].concat.apply(
        [],
        proj.hits.map((inst) => inst.journeys.map((j) => j.chat_id))
      ) as number[];
      clearChatListeners();
      clearChats();

      addChatListeners(chat_ids);
    });
  }, [projects, currentProjectIndex]);

  const handleClickEditHit = (index: number) => {
    setState((s) => ({
      ...s,
      hitEditor: {
        hitIndex: index,
        visible: true,
      },
    }));
  };

  switch (state.status) {
    case "loading":
      return (
        <div className={"site-layout-content"}>
          <LoadingOutlined />
        </div>
      );
    case "empty":
      return (
        <>
          <Paragraph>
            <Empty description="There are no projects to show." />
          </Paragraph>
        </>
      );
    case "ready":
      return (
        <>
          {!state.loadingProject && (
            <Modal
              open={state.hitEditor.visible}
              footer={null}
              onCancel={() => {
                setState({
                  ...state,
                  hitEditor: { ...state.hitEditor, visible: false },
                });
              }}
            >
              <HitEditorForm
                key={state.hitEditor.hitIndex}
                initialValues={project.hitSpecs[state.hitEditor.hitIndex]}
              />
            </Modal>
          )}

          <div style={{ margin: "2em 1em" }}>
            Project:{" "}
            <Select
              value={currentProjectIndex}
              onChange={(i) => {
                setCurrentProjectIndex(i);
              }}
              style={{ width: 240 }}
            >
              {projects.map((p, index) => {
                return (
                  <Option key={index} value={index}>
                    {p.name}
                  </Option>
                );
              })}
            </Select>
          </div>

          {!state.loadingProject && <Project project={project} />}
        </>
      );
    default:
      return <></>;
  }
};

export default ProjectsPage;
