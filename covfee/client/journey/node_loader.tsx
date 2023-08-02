import * as React from "react";
import styled from "styled-components";
import ReactDOM from "react-dom";
import { Button, Popover, Spin } from "antd";

import { JourneyContext } from "./journey_context";
import { myerror } from "../utils";
import { getTask } from "../task_utils";
import { TaskResponseType, TaskType } from "../types/node";
import buttonManagerContext from "../input/button_manager_context";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { BaseTaskProps, CovfeeTask } from "tasks/base";
import { useNode } from "../models/Node";
import { NodeType } from "../types/node";
import { AllPropsRequired } from "../types/utils";
import { nodeContext, NodeContextType } from "./node_context";
import { Provider as StoreProvider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { NodeStatus } from "../types/node";

interface Props {
  /**
   * Task props and specification
   */
  node: NodeType;
  /**
   * If true, the task cannot be interacted with
   */
  disabled?: boolean;
  /**
   * If true, the task is only previewed: submission and server communication are disabled.
   * Used for previews and playground where no server is available.
   */
  previewMode?: boolean;

  // INTERFACE

  /**
   * Passed to tasks to render the submit button
   */
  renderSubmitButton: (arg0?: any) => React.ReactNode;
  /**
   * Used in the class to render the "next" button
   */
  renderNextButton: (arg0?: any) => React.ReactNode;
  // CALLBACKS
  /**
   * To be called when the task is submitted.
   */
  onSubmit?: () => void;
  /**
   * To be called when the user clicks to go to the next task
   */
  onClickNext?: () => void;
}

// type defaultProps = Required<Pick<Props, 'parent' | 'disabled' | 'previewMode' | 'interfaceMode' | 'renderTaskSubmitButton' | 'renderTaskNextButton' | 'fetchTaskResponse' | 'submitTaskResponse' | 'onSubmit' | 'onClickNext'>>

export const NodeLoader = (props: Props) => {
  const args: AllPropsRequired<Props> = {
    disabled: false,
    previewMode: false,
    onSubmit: () => {},
    onClickNext: () => {},
    ...props,
  };

  // const [status, setStatus] = React.useState<NodeStatus>("INIT");
  const [isLoading, setIsLoading] = React.useState(true);
  const [instructionsVisible, setInstructionsVisible] = React.useState(false);
  const [overlayVisible, setOverlayVisible] = React.useState(false);
  const { socket, id: journeyId } = React.useContext(JourneyContext);

  const {
    node,
    setNode,
    response,
    makeResponse,
    setStatus: setNodeStatus,
    fetchResponse,
    submitResponse,
  } = useNode(args.node);

  const nodeElementRef = React.useRef(null);
  const nodeInstructionsRef = React.useRef(null);

  const nodeContext: NodeContextType = {
    node,
    response,
  };

  React.useEffect(() => {
    fetchResponse().then((_) => {
      setIsLoading(false);
    });

    if (socket) {
      socket.on("status", (data) => {
        console.log("Received data:", data);
        setNodeStatus(data.new);
      });
    }
  }, [socket]);

  React.useEffect(() => {
    console.log(["useEffect", response, socket]);
    if (response && socket) {
      console.log(response);
      socket.emit("join", {
        journeyId,
        nodeId: node.id,
        responseId: nodeContext.response.id,
      });
    }
    return () => {
      if (response && socket) {
        socket.emit("leave", {
          journeyId,
          nodeId: node.id,
          responseId: response.id,
        });
      }
    };
  }, [response, socket]);

  React.useEffect(() => {
    if (args.node.type == "TaskInstance") {
      args.node.spec.instructionsType == "popped";
    }
    console.log("mount");
  }, []);

  const handleTaskSubmit = (taskResult: any) => {
    submitResponse(taskResult)
      .then((data: any) => {
        setNodeStatus("FINISHED");
        args.onSubmit();
      })
      .catch((error) => {
        myerror("Error submitting the task.", error);
        setNodeStatus("ended");
      });
  };

  const { taskComponent, taskReducer } = getTask(args.node.spec.type);
  const reduxStore = React.useRef(
    configureStore({
      reducer: taskReducer,
    })
  );

  // const renderErrorModal = () => {
  //     return <Modal
  //         title="Error"
  //         visible={this.state.errorModal.visible}
  //         confirmLoading={this.state.errorModal.loading}
  //         onOk={this.handleErrorOk}
  //         onCancel={this.handleErrorCancel}
  //         cancelButtonProps={{ disabled: true }}
  //         okButtonProps={{}}>
  //         <p>{this.state.errorModal.message}</p>
  //     </Modal>
  // }

  // const getOverlayInitTimedTask = () => {
  //     return {
  //         title: 'This is a timed task!',
  //         subtext: 'Make sure to set up and be ready before you hit "Start". Once you do you will not be able to stop the countdown.',
  //         mainOptions: [
  //             <Button
  //                 type="primary"
  //                 onClick={()=>{}}
  //             >Start</Button>
  //         ]
  //     }
  // }

  /**
   * User must be able to:
   * - Restart the task if num_submissions < maxSubmissions
   * - Replay the submitted task
   * - Go to the next task
   */
  const getOverlaySubmittedTask = () => {
    return {
      title: "Your task is submitted!",
      mainOptions: [args.renderNextButton()],
    };
  };

  const createTaskRef = (element: CovfeeTask<any, any>) => {
    nodeElementRef.current = element;
    if (element && element.instructions) {
      ReactDOM.render(
        renderTaskInfo(element.instructions()),
        nodeInstructionsRef.current
      );
    } else {
      if (node.spec.instructions)
        ReactDOM.render(renderTaskInfo(null), nodeInstructionsRef.current);
    }
  };

  const hideInstructions = () => {
    setInstructionsVisible(false);
  };

  const handleInstructionsVisibleChange = (visible: boolean) => {
    setInstructionsVisible(visible);
  };

  const renderTaskInfo = (instructions: React.ReactNode = null) => {
    return (
      <Popover
        title="Instructions"
        placement="bottom"
        visible={instructionsVisible}
        onVisibleChange={handleInstructionsVisibleChange}
        content={
          <InstructionsPopoverContent>
            {node.spec.instructions}
            {instructions}
            <div style={{ textAlign: "right" }}>
              <Button type="primary" onClick={hideInstructions}>
                OK
              </Button>
            </div>
          </InstructionsPopoverContent>
        }
        trigger="click"
      >
        <div className="task-instructions-button">
          <QuestionCircleOutlined /> Instructions
        </div>
      </Popover>
    );
  };

  if (node.status == "INIT") {
    return <Spin />;
  }

  if (node.status == "WAITING") {
    return (
      <div>
        <h1>Waiting for task start</h1>
        <Spin />
      </div>
    );
  }

  if (node.status == "FINISHED") {
    return (
      <div>
        <h1>Nothing to be done here!</h1>
      </div>
    );
  }

  if (node.status == "RUNNING") {
    if (node.type != "TaskInstance") {
      return <h1>Unimplemented</h1>;
    }

    return (
      <>
        {/* {renderErrorModal()} */}
        <div ref={nodeInstructionsRef}></div>
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
          <StoreProvider store={reduxStore.current}>
            <nodeContext.Provider value={nodeContext}>
              {(() => {
                const nodeProps: BaseTaskProps = {
                  spec: node.spec,
                  response: response,
                  disabled: args.disabled,
                  onSubmit: (res) => handleTaskSubmit(res),
                  renderSubmitButton: args.renderSubmitButton,
                };

                const taskElement = React.createElement(
                  taskComponent,
                  {
                    ...nodeProps,
                  },
                  null
                );

                return taskElement;
              })()}
            </nodeContext.Provider>
          </StoreProvider>
        </div>
      </>
    );
  }
};

const InstructionsPopoverContent = styled.div`
  width: calc(30vw);
  max-height: calc(50vh);
`;
