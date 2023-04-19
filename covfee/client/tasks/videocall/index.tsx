import * as React from 'react'
import { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { BasicTaskProps, CovfeeTask } from '../base'

import { VideocallTaskSpec } from '@covfee-shared/spec/tasks/videocall'
import { TaskType } from '@covfee-shared/spec/task'

import reducer, {incrementValue} from './videocallSlice'
import AgoraRTC from 'agora-rtc-sdk-ng'
import useAgora from './useAgora'
import MediaPlayer from './mediaPlayer'
import { AudioMutedOutlined, AudioOutlined, CalculatorFilled, CalendarTwoTone, FundProjectionScreenOutlined, VideoCameraOutlined } from '@ant-design/icons'

const client = AgoraRTC.createClient({ codec: 'h264', mode: 'rtc' })

interface Props extends TaskType, BasicTaskProps {
    spec: VideocallTaskSpec
    agoraAppId: string
    agoraToken: string
}

interface State {
}

function VideocallTask(props: Props) {

    const [muted, setMuted] = useState<boolean>(true)
    const [cameraOn, setCameraOn] = useState<boolean>(false)

    const {localVideoTrack, leave, join, publishLocalAudio, publishLocalVideo, unpublishLocalAudio, unpublishLocalVideo, joinState, remoteUsers, volumes} = useAgora(client)

    const observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      for (let entry of entries) {
        entry.target.style.width = entry.contentRect.height * 4/3
      }
    })

    const [shtate, setShtate] = props.getSharedState()

    useEffect(() => {
      join(props.agoraAppId, props.response.id.toString(), props.agoraToken)

      setShtate({asdf: 'asdf'})

      return () => {
        leave()
      }
    }, [])

    const toggleMuted = () => {
      if(muted) {
        publishLocalAudio()
      } else {
        unpublishLocalAudio()
      }
      setMuted(!muted)
    }

    const toggleCamera = () => {
      if(cameraOn) {
        unpublishLocalVideo()
      } else {
        publishLocalVideo()
      }
      setCameraOn(!cameraOn)
    }

    const renderBar = () => {
      return <CommandBar>
        <div onClick={toggleMuted}>
          {muted ? 
            <AudioMutedOutlined style={{color: 'red'}}/> :
            <AudioOutlined />
          }
        </div>
        <div onClick={toggleCamera}>
          <VideoCameraOutlined style={{color: cameraOn ? 'white' : 'red'}}/>
        </div>
        <div>
          <FundProjectionScreenOutlined />
        </div>
      </CommandBar>
    }

    const renderSpeakerMode = () => {
      const speakerIndex = volumes.indexOf(Math.max(...volumes))
      const speaker = remoteUsers[speakerIndex]

      return <div style={{height: 'calc(100vh - 46px)'}}>
        <div style={{backgroundColor: '#202020', height: 'calc(15vh)'}}>
          {remoteUsers.map(user => (<div className='remote-player-wrapper' key={user.uid}>
            <div ref={elem => {if(elem) observer.observe(elem)}}><MediaPlayer videoTrack={user.videoTrack} audioTrack={user.audioTrack}></MediaPlayer></div>
          </div>))}
        </div>
        
        <div style={{height: 'calc(85vh - 46px)', position: 'relative'}}>
          {speaker ?
            <MediaPlayer style={{'width': '100%'}} videoTrack={speaker.videoTrack} audioTrack={speaker.audioTrack}></MediaPlayer> :
            <MediaPlayer style={{'width': '100%'}}></MediaPlayer>
          }
          <MediaPlayer style={{'position': 'absolute', width: '24vh', height: '18vh', border: '1px solid #969696', bottom: '15px', right: '15px'}} videoTrack={localVideoTrack}></MediaPlayer>
          <div style={{position: 'absolute', bottom: '15px', left: '15px'}}>{renderBar()}</div>
        </div>
      </div>
    }

    const renderGalleryMode = () => {

    }

    return <>
        {/* <h1>{state.queryIdx}</h1>
        <Button onClick={increment}>Increment</Button>

        <div className='button-group'>
          <button id='join' type='button' className='btn btn-primary btn-sm' disabled={joinState} onClick={() => {console.log(props); join(props.agoraAppId, props.response.id.toString(), props.agoraToken)}}>Join</button>
          <button id='leave' type='button' className='btn btn-primary btn-sm' disabled={!joinState} onClick={() => {leave()}}>Leave</button>
        </div> */}

        <div className='player-container'>
          {props.spec.mode == 'speaker' &&
            renderSpeakerMode()
          }
          {props.spec.mode == 'gallery' &&
            renderSpeakerMode()
          }
        </div>
    </>
}

const CommandBar = styled.div`
  background-color: #161616;
  border: 2px solid #363636;
  border-radius: 5px;
  color: #fafafa;
  font-size: 50px;

  >div {
    padding: 8px;
    cursor: pointer;
    opacity: 0.7;

    &:hover {
      opacity: 1;
    }
  }
`

export default {taskConstructor: VideocallTask, taskReducer: reducer}