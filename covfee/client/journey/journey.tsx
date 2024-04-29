import { ArrowRightOutlined, PlusOutlined } from "@ant-design/icons"
import { Button, Menu, Modal, Progress, Row } from "antd"
import "antd/dist/reset.css"
import * as React from "react"
import { generatePath } from "react-router"
import styled from "styled-components"

import { CovfeeMenuItem } from "../gui"
import { MarkdownLoader } from "../tasks/utils/markdown_loader"
import { myerror } from "../utils"
import {
  JourneyContext,
  JourneyContextType,
  TimerState,
  defaultTimerState,
} from "./journey_context"
import { NodeLoader } from "./node_loader"
import { Sidebar } from "./sidebar"

import { useContext, useState } from "react"
import { useParams } from "react-router-dom"
import { appContext } from "../app_context"
import { AppProvider } from "../app_provider"
import { ChatPopup } from "../chat/chat"
import { ChatProvider, chatContext } from "../chat_context"
import { FullJourney, fetchJourney, useJourney } from "../models/Journey"
import { Chat } from "../types/chat"
import { AllPropsRequired } from "../types/utils"
import "./journey.scss"
import { Timer } from "./timer"

type Props = {
  journey: FullJourney
  /**
   * Enables preview mode where data submission is disabled.
   */
  previewMode?: boolean
  /**
   * Tells the annotation component to keep urls up to date
   */
  routingEnabled?: boolean

  /**
   * Show the sidebar with the journey nodes
   */
  showSideBar?: boolean

  // ASYNC OPERATIONS
  // submitTaskResponse: (arg0: TaskResponseType, arg1: any) => Promise<TaskResponseType>
  // fetchTaskResponse: (arg0: TaskType) => Promise<TaskResponseType>
  /**
   * Called when the Hit submit button is clicked
   */
  onSubmit?: () => Promise<any> | null
}

export const _JourneyPage: React.FC<Props> = (props) => {
  const args: AllPropsRequired<Props> = React.useMemo(
    () => ({
      routingEnabled: true,
      previewMode: false,
      showSideBar: false,
      onSubmit: () => null,
      ...props,
    }),
    [props]
  )

  const routeParams = useParams()
  const { socket, chocket } = useContext(appContext)
  const { addChats, removeChats, hasChat } = useContext(chatContext)
  const { journey, setJourney } = useJourney<FullJourney>(args.journey)

  const [currNodeIndex, setCurrNodeIndex] = useState(
    routeParams.nodeId !== undefined ? parseInt(routeParams.nodeId) : 0
  )

  const [extraOpen, setExtraOpen] = useState(false)

  const [loadingNode, setLoadingNode] = useState(true)
  const [currKey, setCurrKey] = useState(0)

  const [timer, setTimer] = useState<TimerState>(defaultTimerState)
  const journeyContext: JourneyContextType = {
    id: routeParams.journeyId,
    socket,
    timer,
    setTimer,
  }

  React.useEffect(() => {
    if (!hasChat(journey.chat_id)) addChats([journey.chat_id])
  }, [addChats, hasChat, journey.chat_id])

  React.useEffect(() => {
    if (!hasChat(journey.nodes[currNodeIndex].chat_id)) {
      removeChats((chat: Chat) => chat.node_id !== null)
      addChats([journey.nodes[currNodeIndex].chat_id])
    }
  }, [addChats, currNodeIndex, hasChat, journey.nodes, removeChats])

  React.useEffect(() => {
    window.history.pushState(
      null,
      null,
      "#" +
        generatePath("/journeys/:journeyId/:nodeId", {
          journeyId: routeParams.journeyId,
          nodeId: currNodeIndex.toString(),
        })
    )
  }, [currNodeIndex, routeParams.journeyId])

  const changeActiveNode = React.useCallback((nodeIndex: number) => {
    setCurrNodeIndex(nodeIndex)
    setCurrKey((k) => k + 1)
  }, [])

  const showCompletionInfo = React.useCallback(() => {
    // FIXME: #CONFLAB this implementation ties strongly the submission logic
    //        with immediately showing this pop up to redirect to prolific.
    //        Instead, for the continuous annotation task, we wanted to
    //        allow the user to confirm, to submit, and then decide when
    //        to redirect, for better user experience.
    return
    const config = journey.completionInfo
    return Modal.success({
      title: "HIT submitted!",
      content: (
        <>
          <p>Thank you! Your work has been submitted.</p>
          {config.redirectUrl ? (
            <>
              <p>
                If you came from{" "}
                {config.redirectName ? config.redirectName : "another site"} you
                may click here to be redirected:
              </p>
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                href={config.redirectUrl}
              >
                Back to {config.redirectName ? config.redirectName : "site"}
              </Button>
            </>
          ) : (
            <>
              <p>Your completion code is:</p>
              <pre>{config.completionCode}</pre>
            </>
          )}
        </>
      ),
    })
  }, [journey])

  const handleSubmit = React.useCallback(() => {
    let callback = args.onSubmit()

    if (callback instanceof Promise) {
      callback
        .then(() => {
          showCompletionInfo()
        })
        .catch((err) => {
          if (err.message.includes("required tasks")) {
            myerror(
              err.message +
                " Please make sure all tasks are marked green before submitting.",
              err
            )
          } else {
            myerror(
              "Error submitting HIT. Please try again or contact the organizers.",
              err
            )
          }
        })
    } else {
      showCompletionInfo()
    }
  }, [args, showCompletionInfo])

  const gotoNextNode = React.useCallback(() => {
    // if done with nodes
    if (currNodeIndex === journey.nodes.length - 1) {
      handleSubmit()
    } else {
      // go to next node
      changeActiveNode(currNodeIndex + 1)
    }
  }, [changeActiveNode, currNodeIndex, handleSubmit, journey])

  const handleNodeSubmitted = () => {
    gotoNextNode()
  }

  const handleMenuClick = (e: any) => {
    if (e.key == "extra") setExtraOpen((v) => !v)
  }

  /**
   * True if the hit can be submitted:
   * - all required nodes have a valid response
   */
  const canSubmitHit = () => {
    let canSubmit = true
    journey.nodes.forEach((node) => {
      if (node.required && !node.valid) canSubmit = false
    })
    return canSubmit
  }

  const getHitExtra = () => {
    if (journey.extra) return <MarkdownLoader content={journey.extra} />
    else return false
  }

  // return (
  //   <Modal
  //     title={
  //       <Title level={4}>
  //         <LoadingOutlined /> Loading tasks
  //       </Title>
  //     }
  //     visible={true}
  //     footer={null}
  //     closable={false}
  //   >
  //     Please give a second..
  //   </Modal>
  // );

  const nodeProps = journey.nodes[currNodeIndex]
  const hitExtra = getHitExtra()

  return (
    <JourneyContext.Provider value={journeyContext}>
      {/* <ButtonEventManagerContext> */}
      <Menu
        onClick={handleMenuClick}
        mode="horizontal"
        theme="dark"
        style={{
          position: "sticky",
          top: 0,
          width: "100%",
          zIndex: 1000,
          /* FIXME #CONFLAB: Force hiding for the mingle experiments using the continuous annotation task */
          display: "none",
        }}
      >
        <Menu.Item key="logo" disabled>
          <CovfeeMenuItem />
        </Menu.Item>
        <Menu.Item key="task" disabled>
          {/* <Text strong style={{ color: "white" }}> */}
          {nodeProps.name}
          {/* </Text> */}
        </Menu.Item>
        <Menu.Item>
          <Timer />
        </Menu.Item>
        {hitExtra && (
          <Menu.Item key="extra" icon={<PlusOutlined />}>
            Extra
          </Menu.Item>
        )}
      </Menu>
      {args.showSideBar && (
        <SidebarContainer height={window.innerHeight}>
          <Sidebar
            nodes={journey.nodes}
            currNode={currNodeIndex}
            onChangeActiveTask={changeActiveNode}
          >
            {journey.submitted && (
              <Button
                type="primary"
                style={{
                  width: "100%",
                  backgroundColor: "#5b8c00",
                  borderColor: "#5b8c00",
                }}
                onClick={showCompletionInfo}
              >
                Show completion code
              </Button>
            )}
          </Sidebar>
        </SidebarContainer>
      )}

      <ContentContainer
        id="JourneyContentContainer"
        showSideBar={args.showSideBar}
        /*height={window.innerHeight}*/
      >
        {hitExtra && (
          <></>
          // <Collapsible open={extraOpen}>
          //   <Row>
          //     <Col span={24}>{hitExtra}</Col>
          //   </Row>
          // </Collapsible>
        )}
        <Row style={{ height: "100%" }}>
          {journey.interface.showProgress && (
            <div style={{ margin: "5px 15px" }}>
              {(() => {
                const num_valid = journey.nodes.filter((t) => t.valid).length
                const num_steps = journey.nodes.length
                return (
                  <Progress
                    percent={(100 * num_valid) / num_steps}
                    format={(p) => {
                      return num_valid + "/" + num_steps
                    }}
                    trailColor={"#c0c0c0"}
                  />
                )
              })()}
            </div>
          )}
          <NodeLoader
            key={currKey}
            index={currNodeIndex}
            node={nodeProps}
            observer={args.previewMode}
            // callbacks
            onSubmit={handleNodeSubmitted}
          />
        </Row>
      </ContentContainer>
      {/* </ButtonEventManagerContext> */}
      <ChatPopup />
    </JourneyContext.Provider>
  )
}
const SidebarContainer = styled.div<any>`
  position: sticky;
  display: inline-block;
  vertical-align: top;
  // top: 46px; // FIXME #CONFLAB: Force hiding for the mingle experiments using the continuous annotation task
  height: calc(100vh);
  width: 25%;
  overflow: auto;
`

interface ContentContainerProps {
  showSideBar: boolean
  height?: number
}

const ContentContainer = styled.div<ContentContainerProps>`
  position: fixed;
  // top: 46px; // FIXME #CONFLAB: Force hiding for the mingle experiments using the continuous annotation task
  right: 0;
  display: inline-block;
  vertical-align: top;
  height: ${(props) =>
    props.height
      ? props.height
      : "calc(100vh)"}; // FIXME #CONFLAB: Force hiding for the mingle experiments using the continuous annotation task
  width: ${(props) => (props.showSideBar ? "calc(100% - 25%)" : "100%")};
  overflow: auto;
`

export const JourneyPage: React.FC<{}> = () => {
  const [journey, setJourney] = useState<FullJourney>()
  const [loadingJourney, setLoadingJourney] = useState<boolean>(true)
  const routeParams = useParams()

  React.useEffect(() => {
    if (!journey) {
      fetchJourney(routeParams.journeyId).then((response) => {
        console.log(`loaded journey ${response.id}`)
        setJourney(response)
        setLoadingJourney(false)
      })
    }
  }, [journey, routeParams.journeyId])

  if (loadingJourney) return <></>

  return (
    <AppProvider>
      <ChatProvider journeyId={routeParams.journeyId}>
        <_JourneyPage journey={journey}></_JourneyPage>
      </ChatProvider>
    </AppProvider>
  )
}
