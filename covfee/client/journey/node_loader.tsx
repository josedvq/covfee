import * as React from "react"
import styled from "styled-components"
import ReactDOM from "react-dom"
import { Button, Modal, Popover, Result, Spin } from "antd"

import { JourneyContext } from "./journey_context"
import { myerror } from "../utils"
import { getTask } from "../task_utils"
import { QuestionCircleOutlined } from "@ant-design/icons"
import { BaseTaskProps, CovfeeTask } from "tasks/base"
import { useNode } from "../models/Node"
import { NodeStatuses, NodeType } from "../types/node"
import { AllPropsRequired } from "../types/utils"
import { nodeContext } from "./node_context"
import { Provider as StoreProvider, useDispatch } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { appContext } from "../app_context"

interface Props {
  /**
   * Task props and specification
   */
  node: NodeType
  /**
   * If true, the task cannot be interacted with
   */
  disabled?: boolean
  /**
   * If true, the task is only previewed: submission and server communication are disabled.
   * Used for previews and playground where no server is available.
   */
  previewMode?: boolean

  // CALLBACKS
  /**
   * To be called when the task is submitted.
   */
  onSubmit?: () => void
}

export const NodeLoader: React.FC<Props> = (props: Props) => {
  const args: AllPropsRequired<Props> = {
    disabled: false,
    previewMode: false,
    onSubmit: () => {},
    ...props,
  }

  const { socket, chocket } = React.useContext(appContext)
  const { id: journeyId } = React.useContext(JourneyContext)

  const {
    node,
    setNode,
    response,
    makeResponse,
    setStatus: setNodeStatus,
    fetchResponse,
    submitResponse,
  } = useNode(args.node, socket)

  const [isLoading, setIsLoading] = React.useState(true)
  const [instructionsVisible, setInstructionsVisible] = React.useState(false)
  const [overlayVisible, setOverlayVisible] = React.useState(false)
  const [error, setError] = React.useState<{
    error: boolean
    show?: boolean
    message?: string
    abort?: boolean
  }>({ error: false })

  const nodeInstructionsRef = React.useRef(null)

  const {
    taskComponent,
    taskReducer,
    useSharedState: taskRequestsSharedState,
  } = getTask(args.node.spec.type)

  const taskuseSharedState =
    taskRequestsSharedState !== undefined ? taskRequestsSharedState : false
  const useSharedState =
    args.node.useSharedState !== undefined
      ? args.node.useSharedState
      : taskuseSharedState

  const reduxStore = React.useRef(
    configureStore({
      reducer: taskReducer,
    })
  )

  React.useEffect(() => {
    fetchResponse()
  }, [fetchResponse])

  React.useEffect(() => {
    if (response) {
      // update the state when the response is loaded
      const action = { type: "task/setState", payload: response.state }
      reduxStore.current.dispatch(action)
    }
  }, [response])

  React.useEffect(() => {
    if (response && socket) {
      socket.emit("join", {
        journeyId,
        nodeId: node.id,
        responseId: response.id,
        useSharedState,
      })

      socket.on("join", (data) => {
        if (data.error) {
          console.error("IO: on_join returned server error", data)
          setError({
            error: true,
            show: true,
            message: data.error,
            abort: data.load_task,
          })
        }
        setIsLoading(false)
      })

      socket.on("action", (action) => {
        reduxStore.current.dispatch(action)
      })

      socket.on("state", (state) => {
        const action = { type: "task/setState", payload: state.state }
        reduxStore.current.dispatch(action)
      })

      return () => {
        socket.removeAllListeners("join")
        socket.removeAllListeners("action")
        socket.removeAllListeners("state")
      }
    }
  }, [journeyId, node.id, response, socket, useSharedState])

  // React.useEffect(()=>{
  //   console.log([node, response])
  //   // check that all the node requirements are ready
  //   if(node.taskData !== undefined && response !== null) {
  //     setIsLoading(false)
  //   }
  // }, [node, response])

  const handleTaskSubmit = () => {
    submitResponse({ state: reduxStore.current.getState() })
      .then((data: any) => {
        setNodeStatus("FINISHED")
        args.onSubmit()
      })
      .catch((error) => {
        myerror("Error submitting the task.", error)
        setNodeStatus("FINISHED")
      })
  }

  const renderErrorMessage = React.useCallback(() => {
    return (
      <MessageContainer>
        <Result
          status="error"
          title="Error loading task"
          subTitle={error.message}
          extra={
            <p>
              Please try reloading the page. If the issue persists, contact the
              administrators.
            </p>
          }
        ></Result>
      </MessageContainer>
    )
  }, [error])

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

  const hideInstructions = () => {
    setInstructionsVisible(false)
  }

  const handleInstructionsVisibleChange = (visible: boolean) => {
    setInstructionsVisible(visible)
  }

  const renderTaskInfo = (instructions: React.ReactNode = null) => {
    return (
      <Popover
        title="Instructions"
        placement="bottom"
        open={instructionsVisible}
        onOpenChange={handleInstructionsVisibleChange}
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
    )
  }

  const renderTaskSubmitButton = (extraProps: any) => {
    return (
      <Button
        type="primary"
        {...extraProps}
        onClick={handleTaskSubmit}
        htmlType="submit"
        disabled={node.status !== "RUNNING"}
      >
        Submit
      </Button>
    )
  }

  if (isLoading) {
    return (
      <NodeLoaderMessage>
        <Spin tip="Loading" size="large">
          <div className="content" />
        </Spin>
      </NodeLoaderMessage>
    )
  }

  if (error.error) {
    return renderErrorMessage()
  }

  if (node.status == "INIT") {
    return (
      <NodeLoaderMessage>
        <h1>Waiting for subjects...</h1>
        <Spin />
        <p>
          {node.curr_journeys.length} / {node.num_journeys} subjects present
        </p>
      </NodeLoaderMessage>
    )
  }

  if (node.status == "WAITING") {
    return (
      <NodeLoaderMessage>
        <h1>Waiting for task start</h1>
        <Spin />
        <p>
          {node.curr_journeys.length} / {node.num_journeys} subjects present
        </p>
      </NodeLoaderMessage>
    )
  }

  if (node.status == "RUNNING" || node.status == "FINISHED") {
    if (node.type != "TaskInstance") {
      return (
        <NodeLoaderMessage>
          <h1>Unimplemented</h1>
        </NodeLoaderMessage>
      )
    }

    return (
      <>
        {/* {renderErrorModal()} */}
        <div ref={nodeInstructionsRef}></div>
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
          <StoreProvider store={reduxStore.current}>
            <nodeContext.Provider value={{ node, useSharedState, response }}>
              {(() => {
                const nodeProps: BaseTaskProps = {
                  spec: node.spec,
                  taskData: node.taskData,
                  response: response,
                  disabled: args.disabled || node.status == "FINISHED",
                  onSubmit: handleTaskSubmit,
                  renderSubmitButton: renderTaskSubmitButton,
                }

                const taskElement = React.createElement(
                  taskComponent,
                  {
                    ...nodeProps,
                  },
                  null
                )

                console.log(
                  `${args.node.spec.type} built with status=${node.status}`,
                  nodeProps
                )

                return taskElement
              })()}
            </nodeContext.Provider>
          </StoreProvider>
        </div>
      </>
    )
  }
}

interface NodeLoaderMessageProps {
  children: React.ReactNode
}
export const NodeLoaderMessage = (props: NodeLoaderMessageProps) => {
  const args: AllPropsRequired<NodeLoaderMessageProps> = { ...props }

  return (
    <MessageContainer>
      <div>{args.children}</div>
    </MessageContainer>
  )
}

const MessageContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  height: 100%;

  > div {
    width: 70%;
    padding: 5%;
    border-radius: 10px;
    background-color: rgba(0, 0, 0, 0.1);
    margin: 0 auto;
    text-align: center;
  }
`

const InstructionsPopoverContent = styled.div`
  width: calc(30vw);
  max-height: calc(50vh);
`
