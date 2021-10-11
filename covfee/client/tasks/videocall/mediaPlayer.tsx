import { ILocalVideoTrack, IRemoteVideoTrack, ILocalAudioTrack, IRemoteAudioTrack } from "agora-rtc-sdk-ng";
import React, { useRef, useEffect } from "react";
import NoVideo from './novideo.svg'

export interface VideoPlayerProps {
  style?: any,
  videoTrack?: ILocalVideoTrack | IRemoteVideoTrack | undefined;
  audioTrack?: ILocalAudioTrack | IRemoteAudioTrack | undefined;
}

const MediaPlayer = (props: VideoPlayerProps) => {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!container.current) return;
    props.videoTrack?.play(container.current);
    return () => {
      props.videoTrack?.stop();
    };
  }, [container, props.videoTrack]);
  useEffect(() => {
    props.audioTrack?.play();
    return () => {
      props.audioTrack?.stop();
    };
  }, [props.audioTrack]);
  return <>
      <div ref={container} style={props.style} className="video-player">
        {!props.videoTrack ?
          <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', backgroundColor: 'black'}}>
            <NoVideo style={{width: '25%', display: 'block', margin: 'auto'}}/>
          </div> :
          
          <></>}
      </div>
  </>
}

export default MediaPlayer;