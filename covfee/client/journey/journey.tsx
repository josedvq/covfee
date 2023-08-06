import * as React from "react";
import styled from "styled-components";
import { generatePath } from "react-router";
import { ArrowRightOutlined, PlusOutlined } from "@ant-design/icons";
import { Row, Col, Typography, Menu, Button, Modal, Progress } from "antd";
import "antd/dist/reset.css";
import Collapsible from "react-collapsible";
const { Text } = Typography;

import Constants from "Constants";
import { myerror } from "../utils";
import { MarkdownLoader } from "../tasks/utils/markdown_loader";
import { CovfeeMenuItem } from "../gui";
import { Sidebar } from "./sidebar";
// import ButtonEventManagerContext from "../input/button_manager";

import { JourneyContext, JourneyContextType } from "./journey_context";
import { NodeLoader } from "./node_loader";

import "./journey.scss";
import { FullJourney, fetchJourney, useJourney } from "../models/Journey";
import { useState, useContext } from "react";
import { AllPropsRequired } from "../types/utils";
import { appContext } from "../app_context";
import { useParams } from "react-router-dom";
import { ChatPopup } from "../chat/chat";

// url parameters
interface MatchParams {
  journeyId: string;
  nodeId: string;
}

interface Props {
  /**
   * Enables preview mode where data submission is disabled.
   */
  previewMode?: boolean;
  /**
   * Tells the annotation component to keep urls up to date
   */
  routingEnabled?: boolean;

  // ASYNC OPERATIONS
  // submitTaskResponse: (arg0: TaskResponseType, arg1: any) => Promise<TaskResponseType>
  // fetchTaskResponse: (arg0: TaskType) => Promise<TaskResponseType>
  /**
   * Called when the Hit submit button is clicked
   */
  onSubmit?: () => Promise<any>;
}

export const JourneyPage: React.FC<Props> = (props) => {
  const args: AllPropsRequired<Props> = {
    routingEnabled: true,
    previewMode: false,
    onSubmit: () => null,
    ...props,
  };

  const routeParams = useParams();
  const { socket, chocket, chats, addChats } = useContext(appContext);
  const { journey, setJourney } = useJourney<FullJourney>(null);

  const [currNode, setCurrNode] = useState(null);

  const [extraOpen, setExtraOpen] = useState(false);
  const [loadingJourney, setLoadingJourney] = useState(true);
  const [loadingNode, setLoadingNode] = useState(true);
  const [currKey, setCurrKey] = useState(0);
  const journeyContext: JourneyContextType = {
    id: routeParams.journeyId,
    socket,
  };

  React.useEffect(() => {
    fetchJourney(routeParams.journeyId).then((response) => {
      console.log(`loaded journey ${response.id}`);
      setJourney(response);

      if (routeParams.nodeId !== undefined) {
        changeActiveNode(parseInt(routeParams.nodeId));
      } else {
        changeActiveNode(0);
      }

      setLoadingJourney(false);
    });
  }, []);

  React.useEffect(() => {
    if (chocket && journey) {
      chocket.emit("join_chat", { chatId: journey.chat_id });
      addChats([journey.chat_id]);
    }
  }, [chocket, journey]);

  const changeActiveNode = (nodeIndex: number) => {
    // instructionsFn = null
    setCurrNode(nodeIndex);
    setCurrKey((k) => k + 1);
    updateUrl(nodeIndex);
  };

  const gotoNextNode = () => {
    // if done with nodes
    if (currNode[0] === journey.nodes.length - 1) {
      handleHitSubmit();
    } else {
      // go to next node
      changeActiveNode(currNode + 1);
    }
  };

  const handleNodeSubmitted = () => {
    gotoNextNode();
  };

  const updateUrl = (nodeIndex: number) => {
    if (args.routingEnabled) {
      window.history.pushState(
        null,
        null,
        "#" +
          generatePath("/journeys/:journeyId/:nodeId", {
            journeyId: routeParams.journeyId,
            nodeId: nodeIndex.toString(),
          })
      );
    }
  };

  const handleMenuClick = (e: any) => {
    if (e.key == "extra") setExtraOpen((v) => !v);
  };

  const showCompletionInfo = () => {
    const config = journey.completionInfo;
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
    });
  };

  const handleHitSubmit = () => {
    args
      .onSubmit()
      .then(() => {
        showCompletionInfo();
      })
      .catch((err) => {
        if (err.message.includes("required tasks")) {
          myerror(
            err.message +
              " Please make sure all tasks are marked green before submitting.",
            err
          );
        } else {
          myerror(
            "Error submitting HIT. Please try again or contact the organizers.",
            err
          );
        }
      });
  };

  /**
   * True if the hit can be submitted:
   * - all required nodes have a valid response
   */
  const canSubmitHit = () => {
    let canSubmit = true;
    journey.nodes.forEach((node) => {
      if (node.required && !node.valid) canSubmit = false;
    });
    return canSubmit;
  };

  const getHitExtra = () => {
    if (args.extra) return <MarkdownLoader content={args.extra} />;
    else return false;
  };

  const renderTaskSubmitButton = (extraProps: any) => {
    return (
      <Button type="primary" htmlType="submit" {...extraProps}>
        Submit
      </Button>
    );
  };

  const renderTaskNextButton = (extraProps: any) => {
    return (
      <Button type="primary" onClick={gotoNextNode} {...extraProps}>
        Next
      </Button>
    );
  };

  if (loadingJourney) return <></>;
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

  const nodeProps = journey.nodes[currNode];
  const hitExtra = getHitExtra();

  return (
    <>
      <JourneyContext.Provider value={journeyContext}>
        {/* <ButtonEventManagerContext> */}
        <Menu
          onClick={handleMenuClick}
          mode="horizontal"
          theme="dark"
          style={{ position: "sticky", top: 0, width: "100%", zIndex: 1000 }}
        >
          <Menu.Item key="logo" disabled>
            <CovfeeMenuItem />
          </Menu.Item>
          <Menu.Item key="task" disabled>
            <Text strong style={{ color: "white" }}>
              {nodeProps.name}
            </Text>
          </Menu.Item>
          {hitExtra && (
            <Menu.Item key="extra" icon={<PlusOutlined />}>
              Extra
            </Menu.Item>
          )}
        </Menu>
        <SidebarContainer height={window.innerHeight}>
          <Sidebar
            nodes={journey.nodes}
            currNode={currNode}
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

        <ContentContainer height={window.innerHeight}>
          {hitExtra && (
            <Collapsible open={extraOpen}>
              <Row>
                <Col span={24}>{hitExtra}</Col>
              </Row>
            </Collapsible>
          )}
          <Row style={{ height: "100%" }}>
            {journey.interface.showProgress && (
              <div style={{ margin: "5px 15px" }}>
                {(() => {
                  const num_valid = journey.nodes.filter((t) => t.valid).length;
                  const num_steps = journey.nodes.length;
                  return (
                    <Progress
                      percent={(100 * num_valid) / num_steps}
                      format={(p) => {
                        return num_valid + "/" + num_steps;
                      }}
                      trailColor={"#c0c0c0"}
                    />
                  );
                })()}
              </div>
            )}
            <NodeLoader
              key={currKey}
              node={nodeProps}
              disabled={nodeProps.submitted}
              previewMode={props.previewMode}
              // render props
              renderSubmitButton={renderTaskSubmitButton}
              renderNextButton={renderTaskNextButton}
              // callbacks
              onClickNext={gotoNextNode}
              onSubmit={handleNodeSubmitted}
            />
          </Row>
        </ContentContainer>
        {/* </ButtonEventManagerContext> */}
      </JourneyContext.Provider>
      <ChatPopup chats={chats} />
    </>
  );
};
const SidebarContainer = styled.div<any>`
  position: sticky;
  display: inline-block;
  vertical-align: top;
  top: 46px;
  height: ${(props) => Math.floor(window.innerHeight) - 46 + "px;"};
  width: 25%;
  overflow: auto;
`;

const ContentContainer = styled.div<any>`
  position: fixed;
  top: 46px;
  right: 0;
  display: inline-block;
  vertical-align: top;
  height: ${(props) => Math.floor(window.innerHeight) - 46 + "px;"};
  width: calc(100% - 25%);
  overflow: auto;
`;
