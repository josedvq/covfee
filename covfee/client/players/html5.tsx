import * as React from "react";
import "./html5.css";

import {
  HTML5PlayerMedia,
  HTML5PlayerOptions,
} from "@covfee-shared/spec/players/html5";
import { ContinuousPlayerProps } from "./base";
import { PlayerBar } from "./videoplayer_bar";
import { CountdownTimer } from "./utils/countdown";

import { log, urlReplacer } from "../utils";
import { AllPropsRequired } from "types/utils";

export interface Props extends ContinuousPlayerProps, HTML5PlayerOptions {
  /**
   * The numerical ID of the currently-active media element (for multiple video support)
   */
  activeMedia: number;
  /**
   * Media specification for the player
   */
  media: HTML5PlayerMedia;
}

interface State {
  /**
   * The video duration
   */
  duration: number;
  /**
   * True while the countdown is active
   */
  countdownActive: boolean;
}

export const HTML5Player: React.FC<Props> = (props) => {
  const args: AllPropsRequired<Props> = {
    countdown: false,
    useRequestAnimationFrame: false,
    ...props,
  };

  const [duration, setDuration] = React.useState<number>(null);
  const [countdownActive, setCountdownActive] = React.useState<boolean>(null);

  const videoElement = React.useRef<HTMLVideoElement>(null);

  // state
  const lastTime = React.useRef<number>(null);
  const videoFrameCallbackId = React.useRef<number>(null);
  const countdownTimeoutId = React.useRef<NodeJS.Timeout>(null);

  const videoCallback = React.useCallback((node: HTMLVideoElement) => {
    videoElement.current = node;

    args.setCurrentTimeSetter((t) => {
      videoElement.current.currentTime = t;
    });

    args.setCurrentTimeGetter((_) => videoElement.current.currentTime);
  }, []);

  React.useEffect(() => {
    if (args.media.speed) videoElement.current.playbackRate = args.media.speed;

    return () => {
      if (args.useRequestAnimationFrame)
        cancelAnimationFrame(videoFrameCallbackId.current);
      else
        videoElement.current.cancelVideoFrameCallback(
          videoFrameCallbackId.current
        );
    };
  }, []);

  React.useEffect(() => {
    if (props.paused) pause();
    else {
      if (props.countdown) startPlayCountdown();
      else play();
    }
  }, [props.paused]);

  React.useEffect(() => {
    videoElement.current.playbackRate = args.speed;
  }, [props.speed]);

  const handleLoadedData: React.ReactEventHandler<HTMLVideoElement> = (e) => {
    log.debug("loadeddata");
    setDuration(videoElement.current.duration);
    args.onLoad(videoElement.current.duration);
  };

  const handleEnd = () => {
    args.onEnd();
    pause();
  };

  const onVideoFrameCallback = (now: number, metadata: any) => {
    // call the onFrame event
    const time = metadata.mediaTime;
    args.onFrame(time);
    videoFrameCallbackId.current =
      videoElement.current.requestVideoFrameCallback(onVideoFrameCallback);
  };

  const onRequestAnimationFrame = () => {
    // call the onFrame event
    args.onFrame(videoElement.current.currentTime);
    videoFrameCallbackId.current = requestAnimationFrame(
      onRequestAnimationFrame
    );
  };

  const startPlayCountdown = () => {
    setCountdownActive(true);
    countdownTimeoutId.current = setTimeout(() => {
      setCountdownActive(false);
      play();
    }, 1500);
  };

  const play = () => {
    if (args.useRequestAnimationFrame)
      videoFrameCallbackId.current = requestAnimationFrame(
        onRequestAnimationFrame
      );
    else
      videoFrameCallbackId.current =
        videoElement.current.requestVideoFrameCallback(onVideoFrameCallback);

    videoElement.current.play();
  };

  const pause = () => {
    // countdown is underway
    if (countdownActive) {
      setCountdownActive(false);
      clearTimeout(countdownTimeoutId.current);
    }
    if (args.useRequestAnimationFrame)
      cancelAnimationFrame(videoFrameCallbackId.current);
    else
      videoElement.current.cancelVideoFrameCallback(
        videoFrameCallbackId.current
      );
    videoFrameCallbackId.current = null;
    videoElement.current.pause();
  };

  const renderBar = () => {
    return (
      <PlayerBar
        duration={args.duration}
        currentTime={args.getCurrentTime}
        paused={args.paused}
        setPaused={args.setPaused}
        speed={args.speed}
        setSpeed={args.setSpeed}
        muted={args.muted}
        setMuted={args.setMuted}
      />
    );
  };

  return (
    <div
      className="html5player"
      style={{ height: "100%", position: "relative", backgroundColor: "black" }}
    >
      {renderBar()}
      <video
        style={{
          display: "block",
          height: "100%",
          maxWidth: "100%",
          margin: "0 auto",
        }}
        ref={videoCallback}
        onLoadedData={handleLoadedData}
        src={urlReplacer(args.media.url)}
        crossOrigin="anonymous"
        preload="auto"
        muted={args.muted}
      />
      {countdownActive && <CountdownTimer />}
    </div>
  );
};
