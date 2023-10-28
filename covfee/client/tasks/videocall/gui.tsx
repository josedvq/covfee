import React from 'react';
import styled from 'styled-components';
import { AllPropsRequired } from '../../types/utils';

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  grid-gap: 10px;
  width: 100%;
  height: 100vh;
  position: relative;  // To allow floating ClientVideo on top
`;

const VideoElement = styled.video`
  width: 100%;
  height: 100%;
`;

const ClientVideoContainer = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  resize: both;
  overflow: auto;
  z-index: 2;
  width: 150px;
  height: 100px;
`;

const EndCallButton = styled.button`
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  background-color: red;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  z-index: 3;
`;

interface Props {
    subscribers: ((elem: HTMLVideoElement)=>void)[]
    clientSubscriber: null | ((elem: HTMLVideoElement)=>void)
    onFinish?: () => void
}

export const VideocallGUI: React.FC<Props> = (props) => {
  const args: AllPropsRequired<Props> = React.useMemo(
    () => ({
      ...props,
      onFinish: () => {}
    }),
    [props]
  )

  
  return (
    <GridContainer>
      {args.subscribers.map((subscriber, index) => (
        <VideoElement key={index} ref={subscriber}></VideoElement>
      ))}

      {args.clientSubscriber &&
        <ClientVideoContainer>
          <VideoElement ref={args.clientSubscriber}></VideoElement>
        </ClientVideoContainer>}

      <EndCallButton onClick={args.onFinish}>End Call</EndCallButton>
    </GridContainer>
  );
};
