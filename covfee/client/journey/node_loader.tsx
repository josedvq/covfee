import { Button, Popover, Result, Spin } from "antd"
import * as React from "react"
import styled from "styled-components"

import { QuestionCircleOutlined } from "@ant-design/icons"
import { Store, configureStore } from "@reduxjs/toolkit"
import { Provider as StoreProvider } from "react-redux"
import { BaseTaskProps } from "tasks/base"
import { ServerToClientEvents, appContext } from "../app_context"
import { useNode } from "../models/Node"
import { getTask } from "../task_utils"
import { NodeType } from "../types/node"
import { AllPropsRequired } from "../types/utils"
import { myerror } from "../utils"
import { JourneyContext, TimerState } from "./journey_context"
import { Lobby } from "./lobby"
import { NodeProvider } from "./node_provider"

interface Props {
  /**
   * Index of the node within the journey
   */
  index?: number
  /**
   * Task props and specification
   */
  node: NodeType
  /**
   * Observer mode. The task cannot be edited but updates can be seen.
   */
  observer: boolean

  // CALLBACKS
  /**
   * To be called when the task is submitted.
   */
  onSubmit?: () => void
}

export const NodeLoader: React.FC<Props> = (props: Props) => {
  const args: AllPropsRequired<Props> = {
    index: null,
    onSubmit: () => {},
    ...props,
  }

  const { socket, chocket } = React.useContext(appContext)
  const { id: journeyId, setTimer } = React.useContext(JourneyContext)

  const {
    node,
    journeyData,
    response,
    setResponse,
    fetchResponse,
    submitResponse,
    setReady,
  } = useNode(args.node, socket)

  const [isLoading, setIsLoading] = React.useState(true)
  const [instructionsVisible, setInstructionsVisible] = React.useState(false)
  const [reloadCount, setReloadCount] = React.useState<number>(0)
  const [reloadMessage, setReloadMessage] = React.useState<string>(null)
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
    taskSlice,
    useSharedState: taskRequestsSharedState,
  } = getTask(args.node.spec.type)

  const taskuseSharedState =
    taskRequestsSharedState !== undefined ? taskRequestsSharedState : false
  const useSharedState =
    args.node.useSharedState !== null
      ? args.node.useSharedState
      : taskuseSharedState

  const reduxStore = React.useRef<Store>(null)

  /**
   * Triggers a 'join'
   * Called when:
   *   the component loads
   *   the response must be reloaded
   */
  const emitJoin = React.useCallback(() => {
    socket.emit("join", {
      journeyId,
      nodeId: args.node.id,
      useSharedState,
    })
  }, [args.node.id, journeyId, socket, useSharedState])

  const emitState = React.useCallback(() => {
    if (reduxStore.current === null) {
      return console.error("emitState called when reduxStore is null")
    }

    const state = reduxStore.current.getState()
    socket.emit("state", { nodeId: node.id, state })
    console.log("emit: state", state)
  }, [node.id, socket])

  React.useEffect(() => {
    // emit state when the component unmounts
    if (!useSharedState) {
      return () => {
        console.log("Node Loader UNMOUNT")
        emitState()
      }
    }
  }, [emitState, useSharedState])

  React.useEffect(() => {
    if (socket) {
      emitJoin()
    }
  }, [socket, emitJoin])

  React.useEffect(() => {
    const handleJoin: ServerToClientEvents["join"] = (data) => {
      if (data.error) {
        console.error("IO: on_join returned server error", data)
        setError({
          error: true,
          show: true,
          message: data.error,
          abort: data.load_task,
        })
      }
      setResponse(data.response)

      if (taskSlice !== null) {
        // We create the reduxStore here to ensure that the initial state is accessible to the task on first render
        const initialState =
          data.response.state !== null
            ? data.response.state
            : taskSlice.getInitialState()

        reduxStore.current = configureStore({
          reducer: taskSlice.reducer,
          preloadedState: initialState,
        })
      }
      setIsLoading(false)
    }

    socket.on("join", handleJoin)

    return () => {
      socket.off("join", handleJoin)
    }
  }, [reduxStore, setResponse, socket, taskSlice])

  React.useEffect(() => {
    if (node.timer !== null) {
      // the task is timed
      let freezeTimer, sinceDatestring
      if (node.timer_pausable) {
        freezeTimer = node.status !== "RUNNING"
        sinceDatestring = node.dt_play
      } else {
        freezeTimer = node.dt_start == null || node.status === "FINISHED"
        sinceDatestring = node.dt_start
      }

      const sinceTimestamp = Math.floor(
        new Date(sinceDatestring).getTime() / 1000
      )

      const timerState: TimerState = {
        show: true,
        freeze: freezeTimer,
        init: node.t_elapsed,
        since: sinceTimestamp,
        max: node.timer,
      }
      setTimer(timerState)
      console.log("setTimer called", timerState)
    } else {
      setTimer({
        show: false,
        freeze: true,
        init: null,
        since: null,
        max: null,
      })
    }
  }, [
    node.dt_play,
    node.dt_start,
    node.status,
    node.t_elapsed,
    node.timer,
    node.timer_pausable,
    setTimer,
  ])

  React.useEffect(() => {
    const handleStatus: ServerToClientEvents["status"] = (data) => {
      if (data.node_id !== node.id) return

      console.log("IO: status", data)

      if (response && data.response_id != response.id) {
        // the task was reset or a new response was created
        // fetch the new one and let the user know
        // fetchResponse()
        setReloadCount(10)
        setReloadMessage("The task has been reset by the admin. Restarting...")
        setTimeout(() => {
          emitJoin()
        }, 10000)
      }
    }

    if (socket) {
      socket.on("status", handleStatus)

      return () => {
        socket.off("status", handleStatus)
      }
    }
  }, [
    node.id,
    emitJoin,
    fetchResponse,
    response,
    socket,
    node.spec.timer,
    node.timer_pausable,
    setTimer,
    node.timer,
  ])

  React.useEffect(() => {
    // Only set up the interval if count is greater than 0
    if (reloadCount > 0) {
      const timerId = setInterval(() => {
        setReloadCount(reloadCount - 1)
      }, 1000)

      // Clear the interval on component unmount or when the count changes
      return () => clearInterval(timerId)
    }
  }, [reloadCount])

  /**
   * REDUX SYNC
   */
  React.useEffect(() => {
    const handleAction: ServerToClientEvents["action"] = (action) => {
      if (reduxStore.current !== null) reduxStore.current.dispatch(action)
      else console.warn("action event received when reduxStore = null")
    }

    const handleState: ServerToClientEvents["state"] = (state) => {
      if (reduxStore.current !== null) {
        const action = { type: "task/setState", payload: state.state }
        reduxStore.current.dispatch(action)
      }
    }

    socket.on("action", handleAction)

    socket.on("state", handleState)

    return () => {
      socket.off("action", handleAction)
      socket.off("state", handleState)
    }
  }, [socket])

  const handleTaskSubmit = () => {
    submitResponse({ state: reduxStore.current.getState() })
      .then((data: any) => {
        args.onSubmit()
      })
      .catch((error) => {
        myerror("Error submitting the task.", error)
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

  if (reloadCount > 0) {
    return <NodeOverlayReload counter={reloadCount} message={reloadMessage} />
  }

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
        {["INIT", "COUNTDOWN", "PAUSED"].includes(node.status) && (
          <Lobby
            observer={args.observer}
            node={node}
            journeyData={journeyData}
            handleReady={setReady}
          />
        )}

        <StoreProvider store={reduxStore.current}>
          <NodeProvider
            node={node}
            paused={node.status == "PAUSED"}
            disabled={args.observer}
            response={response}
            useSharedState={useSharedState}
            emitState={emitState}
          >
            {(() => {
              const nodeProps: BaseTaskProps = {
                spec: node.spec,
                taskData: node.taskData,
                response: response,
                disabled: node.status == "FINISHED",
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
                `${args.node.spec.type} built with disabled=${args.observer} status=${node.status}, usedSharedState=${useSharedState}, paused=${node.paused}`,
                nodeProps
              )

              return taskElement
            })()}
          </NodeProvider>
        </StoreProvider>
      </div>
    </>
  )
}

interface NodeLoaderMessageProps {
  children: React.ReactNode
}
export const NodeLoaderMessage = (props: NodeLoaderMessageProps) => {
  const args: AllPropsRequired<NodeLoaderMessageProps> = { ...props }

  return <NodeOverlay>{args.children}</NodeOverlay>
}

interface NodeOverlayProps {
  children: React.ReactNode
}
export const NodeOverlay = (props: NodeOverlayProps) => {
  const args: AllPropsRequired<NodeOverlayProps> = { ...props }

  return (
    <OverlayContainer>
      <div>{args.children}</div>
    </OverlayContainer>
  )
}

interface NodeOverlayReloadProps {
  counter: number
  message: string
}

export const NodeOverlayReload = ({
  counter,
  message,
}: NodeOverlayReloadProps) => {
  return (
    <NodeOverlay>
      <h2>{counter}</h2>
      <p>{message}</p>
    </NodeOverlay>
  )
}

const OverlayContainer = styled.div`
  position: absolute;
  display: flex;
  flex-direction: row;
  align-items: center;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 10;

  > div {
    width: 70%;
    padding: 5%;
    border-radius: 10px;
    background-color: #ddd;
    margin: 0 auto;
    text-align: center;
  }
`

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
