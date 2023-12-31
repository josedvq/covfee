import * as React from "react"

import { VideocallTaskSpec } from "@covfee-shared/spec/tasks/videocall"
import { AllPropsRequired } from "../types/utils"
import { styled } from "styled-components"
import { nodeContext } from "./node_context"
import { JourneyAssoc, NodeType } from "../types/node"
import { Countdown } from "./timer"
import { Switch } from "antd"

interface Props {
  observer: boolean
  node: NodeType
  journeyData: JourneyAssoc
  handleReady: (val: boolean) => void
}

export const Lobby: React.FC<Props> = (props) => {
  const args: AllPropsRequired<Props> = React.useMemo(
    () => ({
      ...props,
    }),
    [props]
  )

  return (
    <MessageContainer>
      <div>
        {args.node.status == "INIT" && (
          <ReadyBlock>
            <ReadySubblock ready={args.journeyData.ready}>
              <span>{args.journeyData.ready ? "Ready" : "Not Ready"} </span>
              <Switch
                defaultChecked={args.journeyData.ready}
                onChange={(checked) => args.handleReady(checked)}
              ></Switch>
            </ReadySubblock>
          </ReadyBlock>
        )}

        {args.node.status == "COUNTDOWN" && (
          <>
            <h2>Starting in.. </h2>
            <CountdownContainer>
              <Countdown
                show={true}
                countdown={args.node.countdown}
                start={args.node.dt_count}
              />
            </CountdownContainer>
          </>
        )}

        {args.node.status == "PAUSED" && (
          <>
            <h2>Task is paused. Waiting for subjects..</h2>
          </>
        )}

        <h2>Waiting for subjects..</h2>

        <PlayerList>
          {args.node.journeys.map((journey, index) => (
            <PlayerItem key={index} isOnline={journey.online}>
              <StatusCircle isReady={journey.ready} />
              <PlayerName>{journey.journey_id.substr(0, 10)}</PlayerName>
            </PlayerItem>
          ))}
        </PlayerList>
      </div>
    </MessageContainer>
  )
}

const ReadyBlock = styled.div`
  background-color: #eee;
  margin: 1em 0;
  padding: 1em;
`

const ReadySubblock = styled.div<{ ready: boolean }>`
  display: inline-block;
  background-color: ${(props) => (props.ready ? "green" : "red")};
  padding: 0.5em;

  font-size: 1.5em;
  color: white;
  border-radius: 10px;
`

const PlayerList = styled.ul`
  list-style: none;
  padding: 0;
`

const PlayerItem = styled.li<{ isOnline: boolean }>`
  opacity: ${(props) => (props.isOnline ? 1 : 0.3)};
  margin: 10px 0;
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  margin: 0.2em 0;
  padding: 0.5em 0;
`

const StatusCircle = styled.span<{ isReady: boolean }>`
  height: 10px;
  width: 10px;
  background-color: ${(props) => (props.isReady ? "green" : "red")};
  border-radius: 50%;
  display: inline-block;
  margin-left: 10px;
`

const PlayerName = styled.span`
  margin-left: 5px;
`
const MessageContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  height: 100%;

  > div {
    width: 80%;
    min-height: 500px;
    border-radius: 10px;
    margin: 0 auto;
    text-align: center;
  }
`
const CountdownContainer = styled.h2`
  text-align: center;
  font-size: 72px;
`
