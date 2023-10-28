import * as React from "react"
import * as openvidu from "openvidu-browser"
import { useState, useEffect, useRef } from "react"
import styled from "styled-components"
import { BaseTaskProps } from "../base"

import { slice, actions } from "./slice"
import { VideocallTaskSpec } from "@covfee-shared/spec/tasks/videocall"

import {
  AudioMutedOutlined,
  AudioOutlined,
  CalculatorFilled,
  CalendarTwoTone,
  FundProjectionScreenOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons"
import { TaskExport } from "../../types/node"
import ThreeImagesTask from "../three_images"
import { AllPropsRequired } from "../../types/utils"
import { VideocallGUI } from "./gui"


interface Props extends BaseTaskProps {
  spec: VideocallTaskSpec;
  taskData: {
    session_id: string,
    connection_token: string
  }
}

interface State {}

export const VideocallTask: React.FC<Props> = (props) => {
  const args: AllPropsRequired<Props> = React.useMemo(
    () => ({
      ...props,
    }),
    [props]
  )

  const OV = React.useRef(new openvidu.OpenVidu())
  // const [OV, setOV] = React.useState(new openvidu.OpenVidu())
  const [session, setSession] = React.useState<openvidu.Session>(null)
  const [publisher, setPublisher] = React.useState<openvidu.Publisher>(null)
  const [subscribers, setSubscribers] = React.useState<openvidu.Subscriber[]>([])
  const [currentVideoDevice, setCurrentVideoDevice] = React.useState<openvidu.Device>(null)

  const leaveSession = React.useCallback(() => {
    // --- 7) Leave the session by calling 'disconnect' method over the Session object ---
    // Empty all properties...
    setSession(session => {
      if (session) {
        session.disconnect()
      }
      return null
    })
    setSubscribers([])
  }, [])

  React.useEffect(()=>{
    console.log('initSession')
    const session = OV.current.initSession()
    setSession(session)
    console.log('initSession')

    // On every new Stream received...
    session.on("streamCreated", (event) => {
      // Subscribe to the Stream to receive it. Second parameter is undefined
      // so OpenVidu doesn't create an HTML video by its own
      var subscriber = session.subscribe(event.stream, undefined)

      // Update the state with the new subscribers
      setSubscribers(subscribers=>[...subscribers, subscriber])
    })

    // On every Stream destroyed...
    session.on("streamDestroyed", (event) => {
      setSubscribers(subscribers => subscribers.filter(s => s != event.stream.streamManager))
    })

    // On every asynchronous exception...
    session.on("exception", (exception) => {
      console.warn(exception)
    })

    

    session.connect(args.taskData.connection_token, { })
      .then(async () => {

        // --- 5) Get your own camera stream ---

        // Init a publisher passing undefined as targetElement (we don't want OpenVidu to insert a video
        // element: we will manage it on our own) and with the desired properties
        let _publisher = await OV.current.initPublisherAsync(undefined, {
          audioSource: undefined, // The source of audio. If undefined default microphone
          videoSource: undefined, // The source of video. If undefined default webcam
          publishAudio: true, // Whether you want to start publishing with your audio unmuted or not
          publishVideo: true, // Whether you want to start publishing with your video enabled or not
          resolution: "640x480", // The resolution of your video
          frameRate: 30, // The frame rate of your video
          insertMode: "APPEND", // How the video is inserted in the target element 'video-container'
          mirror: false, // Whether to mirror your local video or not
        })

        // --- 6) Publish your stream ---

        session.publish(_publisher)

        // Obtain the current video device in use
        var devices = await OV.current.getDevices()
        var videoDevices = devices.filter(device => device.kind === "videoinput")
        var currentVideoDeviceId = _publisher.stream.getMediaStream().getVideoTracks()[0].getSettings().deviceId
        var _currentVideoDevice = videoDevices.find(device => device.deviceId === currentVideoDeviceId)

        // Set the main video in the page to display our webcam and store our Publisher
        setCurrentVideoDevice(_currentVideoDevice)
        setPublisher(_publisher)
      }).catch((error) => {
        console.log("There was an error connecting to the session:", error.code, error.message)
      })

    return () => {
      leaveSession()
    }
  }, [OV, args.taskData.connection_token, leaveSession])


  const switchCamera = async () => {
    try {
      const devices = await OV.current.getDevices()
      var videoDevices = devices.filter(device => device.kind === "videoinput")

      if (videoDevices && videoDevices.length > 1) {

        var newVideoDevice = videoDevices.filter(device => device.deviceId !== currentVideoDevice.deviceId)

        if (newVideoDevice.length > 0) {
          // Creating a new publisher with specific videoSource
          // In mobile devices the default and first camera is the front one
          var newPublisher = OV.current.initPublisher(undefined, {
            videoSource: newVideoDevice[0].deviceId,
            publishAudio: true,
            publishVideo: true,
            mirror: true
          })

          //newPublisher.once("accessAllowed", () => {
          await session.unpublish(publisher)
          await session.publish(newPublisher)

          setPublisher(newPublisher)
          setCurrentVideoDevice(newVideoDevice[0])
        }
      }
    } catch (e) {
      console.error(e)
    }
  }


  return (
    <VideocallGUI
      subscribers={subscribers.map(s=>s.addVideoElement)}
      clientSubscriber={publisher ? publisher.addVideoElement : null}/>
  )
  // if(args.spec.layout == "grid") {
  //   return (
  //     <div className="container">
  //       {session !== undefined ? (
  //         <div id="session">
  //           <div id="session-header">
  //             <input
  //               className="btn btn-large btn-danger"
  //               type="button"
  //               id="buttonLeaveSession"
  //               onClick={leaveSession}
  //               value="Leave session"
  //             />
  //             <input
  //               className="btn btn-large btn-success"
  //               type="button"
  //               id="buttonSwitchCamera"
  //               onClick={switchCamera}
  //               value="Switch Camera"
  //             />
  //           </div>
  //           <div id="video-container" className="col-md-6">
  //             {publisher !== undefined ? (
  //               <div className="stream-container col-md-6 col-xs-6">
  //                 <UserVideoComponent
  //                   streamManager={this.state.publisher} />
  //               </div>
  //             ) : null}
  //             {subscribers.map((sub, i) => (
  //               <div key={sub.id} className="stream-container col-md-6 col-xs-6">
  //                 <span>{sub.id}</span>
  //                 <UserVideoComponent streamManager={sub} />
  //               </div>
  //             ))}
  //           </div>
  //         </div>
  //       ) : null}
  //     </div>
  //   )
  // } else {
  //   return "Undefined layout"
  // }
}



export default {
  taskComponent: VideocallTask,
  taskReducer: slice.reducer,
} as TaskExport