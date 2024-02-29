import * as React from "react";

export type PlayerOnLoad = (duration: number, fps?: number) => void;
export type PlayerOnFrame = (arg0: number) => void;
export type PlayerOnEnd = () => void;

export abstract class CovfeeContinuousPlayer<
  T extends ContinuousPlayerProps,
  S
> extends React.Component<T, S> {
  /**
   * get or set the player's currrent time
   * The callback should be called when the player has finished seeking.
   */
  abstract currentTime: (arg0?: number, callback?: () => {}) => void;
}
export interface BasePlayerStateProps {
  duration: number;
  setDuration: (arg0: boolean) => void;
  paused: boolean;
  setPaused: (arg0: boolean) => void;
  speed: number;
  setSpeed: (arg0: number) => void;
  muted: boolean;
  setMuted: (arg0: boolean) => void;
  getCurrentTime: () => number;
  setCurrentTimeGetter: (arg0: (arg0: number) => void) => void;
  setCurrentTimeSetter: (arg0: (arg0: number) => void) => void;
}
export interface BasePlayerProps extends BasePlayerStateProps {
  /**
   * Called when the media is loaded and ready to play.
   */
  onLoad: PlayerOnLoad;
  /**
   * Called on every frame of the data. It is passed the media time.
   * Media time is obtained from the underlying HTML element
   */
  onFrame: PlayerOnFrame;
  /**
   * Called when the media finishes playing
   */
  onEnd: PlayerOnEnd;
  /**
   * Called to report on other player events
   */
  onEvent: (arg0: string, ...args: any[]) => void;
}

export interface ContinuousPlayerProps extends BasePlayerProps {}

export type PlayerListenerProps = Pick<
  BasePlayerProps,
  "onLoad" | "onFrame" | "onEnd"
>;

export type PlayerControllerProps = Pick<
  BasePlayerProps,
  "paused" | "setPaused"
>;
