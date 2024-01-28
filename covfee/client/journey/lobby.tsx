import * as React from "react"

import { AllPropsRequired } from "../types/utils"
import { styled } from "styled-components"
import { JourneyAssoc, NodeType } from "../types/node"
import { Countdown } from "./timer"
import { Switch } from "antd"
import { PauseOutlined } from "@ant-design/icons"

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
    <LobbyContainer>
      <div>
        {args.node.status == "INIT" && !args.observer && (
          <ReadyBlock>
            <ReadySubblock $ready={args.journeyData.ready}>
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
            <LargeIconContainer>
              <Countdown
                show={true}
                countdown={args.node.countdown}
                start={args.node.dt_count}
              />
            </LargeIconContainer>
          </>
        )}

        {args.node.status == "PAUSED" && (
          <>
            <LargeIconContainer>
              <PauseOutlined />
            </LargeIconContainer>

            {args.node.manual == "PAUSED" ? (
              <h2>
                Task paused by the admin. Please wait for the task to resume.
              </h2>
            ) : (
              <h2>Task is paused. Waiting for subjects..</h2>
            )}
          </>
        )}

        <SubjectsContainer>
          <h2>Subjects</h2>

          <PlayerList>
            {args.node.journeys.map((journey, index) => (
              <PlayerItem key={index} $isOnline={journey.online}>
                {args.node.status == "INIT" && args.node.wait_for_ready && (
                  <StatusCircle $ready={journey.ready} />
                )}
                <PlayerName>{journey.journey_id.substr(0, 10)}</PlayerName>
              </PlayerItem>
            ))}
          </PlayerList>
        </SubjectsContainer>
      </div>
    </LobbyContainer>
  )
}

const ReadyBlock = styled.div`
  background-color: #eee;
  margin: 1em 0;
  padding: 1em;
`

const ReadySubblock = styled.div<{ $ready: boolean }>`
  display: inline-block;
  background-color: ${(props) => (props.$ready ? "green" : "red")};
  padding: 0.5em;

  font-size: 1.5em;
  color: white;
  border-radius: 10px;
`

const PlayerList = styled.ul`
  list-style: none;
  padding: 0;
`

const PlayerItem = styled.li<{ $isOnline: boolean }>`
  opacity: ${(props) => (props.$isOnline ? 1 : 0.3)};
  margin: 10px 0;
  display: flex;
  align-items: center;
  border: 1px solid #c0c0c0;
  margin: 0.2em 0;
  padding: 0.5em 0;
`

const StatusCircle = styled.span<{ $ready: boolean }>`
  height: 10px;
  width: 10px;
  background-color: ${(props) => (props.$ready ? "green" : "red")};
  border-radius: 50%;
  display: inline-block;
  margin-left: 10px;
`

const PlayerName = styled.span`
  margin-left: 5px;
`
const LobbyContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  height: 100%;
  z-index: 100;
  background-color: rgba(0, 0, 0, 0.8);

  > div {
    width: 80%;
    min-height: 500px;
    border-radius: 10px;
    margin: 0 auto;
    padding: 3em;
    text-align: center;
    background-color: #d8d8d8;
  }
`
const LargeIconContainer = styled.h2`
  text-align: center;
  font-size: 72px;
`
const SubjectsContainer = styled.div`
  margin: 3em 0;
`
