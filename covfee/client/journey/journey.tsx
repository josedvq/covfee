import { ArrowRightOutlined } from "@ant-design/icons"
import { Button, Menu, Row } from "antd"
import "antd/dist/reset.css"
import * as React from "react"
import { generatePath } from "react-router"
import styled from "styled-components"

import { CovfeeMenuItem } from "../gui"
import { Sidebar } from "./sidebar"

import {
  JourneyContext,
  JourneyContextType,
  TimerState,
  defaultTimerState,
} from "./journey_context"
import { NodeLoader } from "./node_loader"

import { useContext, useState } from "react"
import { useParams } from "react-router-dom"
import { appContext } from "../app_context"
import { AppProvider } from "../app_provider"
import { ChatPopup } from "../chat/chat"
import { ChatProvider, chatContext } from "../chat_context"
import { FullJourney, fetchJourney, useJourney } from "../models/Journey"
import { useNodes } from "../models/Nodes"
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

  // ASYNC OPERATIONS
  // submitTaskResponse: (arg0: TaskResponseType, arg1: any) => Promise<TaskResponseType>
  // fetchTaskResponse: (arg0: TaskType) => Promise<TaskResponseType>
  /**
   * Called when the Hit submit button is clicked
   */
  onSubmit?: () => Promise<any>
}

export const _JourneyPage: React.FC<Props> = (props) => {
  const args: AllPropsRequired<Props> = React.useMemo(
    () => ({
      routingEnabled: true,
      previewMode: false,
      onSubmit: () => null,
      ...props,
    }),
    [props]
  )

  const routeParams = useParams()
  const { socket, chocket } = useContext(appContext)
  const { addChats, removeChats, hasChat, chatsStore } = useContext(chatContext)
  const {
    journey,
    setJourney,
    submit: submitJourney,
  } = useJourney<FullJourney>(args.journey, socket)

  const nodeIds = React.useMemo(() => {
    return journey.nodes.map((node) => node.id)
  }, [journey.nodes])

  const { store: nodesStore } = useNodes(journey.nodes, socket)

  const nodes = React.useMemo(() => {
    return nodeIds.map((id) => nodesStore[id])
  }, [nodeIds, nodesStore])

  const [currNodeIndex, setCurrNodeIndex] = useState(
    routeParams.nodeId !== undefined ? parseInt(routeParams.nodeId) : 0
  )

  const [currKey, setCurrKey] = useState(0)

  const [timer, setTimer] = useState<TimerState>(defaultTimerState)
  const journeyContext: JourneyContextType = {
    id: routeParams.journeyId,
    socket,
    timer,
    setTimer,
  }

  React.useEffect(() => {
    console.log("USEFFECT JOURNEY", journey.chat_id)
    if (!hasChat(journey.chat_id)) {
      console.log("USEFFECT ADDING JOURNEY CHAT", journey.chat_id)
      addChats([journey.chat_id])
    }
  }, [addChats, hasChat, journey.chat_id])

  React.useEffect(() => {
    console.log("USEFFECT", nodes[currNodeIndex].chat_id, chatsStore)
    if (!hasChat(nodes[currNodeIndex].chat_id)) {
      console.log("USEFFECT ADDING NODE CHAT", nodes[currNodeIndex].chat_id)
      removeChats((chat: Chat) => chat.node_id !== null)
      addChats([nodes[currNodeIndex].chat_id])
    }
  }, [addChats, currNodeIndex, hasChat, chatsStore, nodes, removeChats])

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

  const handleSubmit = React.useCallback(() => {
    console.log("handleSubmit")
    submitJourney()
  }, [])

  const gotoNextNode = React.useCallback(() => {
    // if done with nodes
    if (currNodeIndex === nodes.length - 1) {
      handleSubmit()
    } else {
      // go to next node
      changeActiveNode(currNodeIndex + 1)
    }
  }, [changeActiveNode, currNodeIndex, handleSubmit, journey])

  const handleNodeSubmitted = () => {
    setJourney((j) => ({
      ...j,
      max_submitted_node_index: Math.max(
        j.max_submitted_node_index,
        currNodeIndex
      ),
    }))
    gotoNextNode()
  }

  /**
   * True if the hit can be submitted:
   * - all required nodes have a valid response
   */
  const canSubmitHit = () => {
    let canSubmit = true
    nodes.forEach((node) => {
      if (node.required && !node.valid) canSubmit = false
    })
    return canSubmit
  }

  const nodeProps = nodes[currNodeIndex]

  return (
    <JourneyContext.Provider value={journeyContext}>
      {/* <ButtonEventManagerContext> */}
      <Menu
        mode="horizontal"
        theme="dark"
        style={{ position: "sticky", top: 0, width: "100%", zIndex: 1000 }}
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
      </Menu>

      {journey.status == "DISABLED" && (
        <div style={{ padding: "20px" }}>
          <h1>Sorry, this task has been disabled.</h1>
          <p>Please contact the requester if you believe this is an error.</p>
        </div>
      )}

      {journey.status == "FINISHED" && (
        <div style={{ padding: "20px" }}>
          <p>Thank you! This work has been submitted.</p>
          {journey.completion_info.redirect_url ? (
            <>
              <p>
                If you came from{" "}
                {journey.completion_info.redirect_name
                  ? journey.completion_info.redirect_name
                  : "another site"}{" "}
                you may click here to be redirected:
              </p>
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                href={journey.completion_info.redirect_url}
              >
                Back to{" "}
                {journey.completion_info.redirect_mame
                  ? journey.completion_info.redirect_name
                  : "site"}
              </Button>
            </>
          ) : (
            <>
              <p>Your completion code is:</p>
              <pre>{journey.completion_info.completion_code}</pre>
            </>
          )}
        </div>
      )}

      {(journey.status == "INIT" || journey.status == "RUNNING") && (
        <>
          <SidebarContainer height={window.innerHeight}>
            <Sidebar
              nodes={nodes}
              currNode={currNodeIndex}
              maxSubmittedNodeIndex={journey.max_submitted_node_index}
              onChangeActiveTask={changeActiveNode}
            />
          </SidebarContainer>

          <ContentContainer height={window.innerHeight}>
            <Row style={{ height: "100%" }}>
              {/* {journey.interface.showProgress && (
                <div style={{ margin: "5px 15px" }}>
                  {(() => {
                    const num_valid = nodes.filter((t) => t.valid).length
                    const num_steps = nodes.length
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
              )} */}

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
        </>
      )}
      {/* </ButtonEventManagerContext> */}
      <ChatPopup />
    </JourneyContext.Provider>
  )
}
const SidebarContainer = styled.div<any>`
  position: sticky;
  display: inline-block;
  vertical-align: top;
  top: 46px;
  height: calc(100vh - 46px);
  width: 25%;
  overflow: auto;
`

const ContentContainer = styled.div<any>`
  position: fixed;
  top: 46px;
  right: 0;
  display: inline-block;
  vertical-align: top;
  height: calc(100vh - 46px);
  width: calc(100% - 25%);
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
