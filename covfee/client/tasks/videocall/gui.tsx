import React from 'react';
import styled from 'styled-components';
import { AllPropsRequired } from '../../types/utils';
// eslint-disable-next-line semi
import NoVideo from "./novideo.svg";
import { AudioMutedOutlined, AudioOutlined, VideoCameraOutlined } from '@ant-design/icons';


const GridContainer = styled.div<{columns: number}>`
  display: grid;
  grid-template-columns: ${props => `repeat(${props.columns}, 1fr)`};
  grid-gap: 0;
  width: 100%;
  height: calc(100vh - 46px);
  position: relative;  // To allow floating ClientVideo on top
  background-color: black;
`;

const VideoElement = styled.video`
  width: 100%;
  max-height: inherit;
  object-fit: contain;
`;

const VideoContainer = styled.div<{columns: number}>`
  align-self: stretch;
  position: relative;
  max-height: ${props=> `${(100/props.columns)}%`};
  display: flex;
  align-items: center;
`

const ClientVideoContainer = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  overflow: auto;
  z-index: 2;
  width: 150px;
  height: 100px;
  border: 3px solid #black;
  background-color: black;
  border-radius: 5px;
`;

const EndCallButton = styled.button`
  padding: 10px;
  background-color: red;
  color: white;
  cursor: pointer;
`;

const Button = styled.button<{active: boolean}>`
  border: 0;
  padding: 18px;
  background-color: ${props => props.active ? 'red' : 'gray'};
  color: black;
  cursor: pointer;
`

const Bar = styled.div`
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  padding: 0;
  border-radius: 5px;
  overflow: hidden;
  z-index: 3;

  > button:not(:first-child) {
    border-left: 1px solid white;
  }
`;

interface Props {
    subscribers: ((elem: HTMLVideoElement)=>void)[]
    clientSubscriber: null | ((elem: HTMLVideoElement)=>void)

    muted: boolean,
    videoStopped: boolean,

    allowMute?: boolean,
    allowStopVideo?: boolean
    allowEndCall?: boolean
    
    
    onMute?: () => void
    onStopVideo?: () => void
    onFinish?: () => void
}

export const VideocallGUI: React.FC<Props> = (props) => {
  const args: AllPropsRequired<Props> = React.useMemo(
    () => ({
      allowMute: !!props.onMute,
      allowStopVideo: !!props.onStopVideo,
      allowEndCall: !!props.onFinish,

      onMute: () => {},
      onStopVideo: () => {},
      onFinish: () => {},
      ...props,
    }),
    [props]
  )

  const numColumns = Math.ceil(Math.sqrt(args.subscribers.length))
  return (
    <GridContainer columns={numColumns}>
      {args.subscribers.map((subscriber, index) => (
        <VideoContainer key={index} columns={numColumns}>
          <VideoElement  ref={e=>{if(e) {subscriber(e)}}}/>
        </VideoContainer>
      ))}

      {args.clientSubscriber &&
        <ClientVideoContainer>
          <VideoElement ref={e=>{if(e) {args.clientSubscriber(e)}}}></VideoElement>
        </ClientVideoContainer>}

      <Bar>
        {args.allowMute && <Button active={args.muted} onClick={args.onMute}><AudioOutlined /></Button>}
        {args.allowStopVideo && <Button active={args.videoStopped} onClick={args.onStopVideo}><VideoCameraOutlined /></Button>}
        {args.allowEndCall && <EndCallButton onClick={args.onFinish}>End Call</EndCallButton>}
      </Bar>
      
    </GridContainer>
  );
};
