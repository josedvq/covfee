import { useState, useEffect } from 'react';
import AgoraRTC, {
  IAgoraRTCClient, IAgoraRTCRemoteUser, MicrophoneAudioTrackInitConfig, CameraVideoTrackInitConfig, IMicrophoneAudioTrack, ICameraVideoTrack, ILocalVideoTrack, ILocalAudioTrack } from 'agora-rtc-sdk-ng';

export default function useAgora(client: IAgoraRTCClient | undefined)
  :
   {
      localAudioTrack: ILocalAudioTrack | undefined,
      localVideoTrack: ILocalVideoTrack | undefined,
      joinState: boolean,
      leave: Function,
      join: Function,
      publishLocalAudio: Function,
      publishLocalVideo: Function,
      unpublishLocalAudio: Function,
      unpublishLocalVideo: Function,
      remoteUsers: IAgoraRTCRemoteUser[],
      volumes: number[]
    }
    {
  const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack | undefined>(undefined);
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | undefined>(undefined);

  const [joinState, setJoinState] = useState(false);

  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);

  const [volumes, setVolumes] = useState<number[]>([]);

  

  async function createLocalTracks(audioConfig?: MicrophoneAudioTrackInitConfig, videoConfig?: CameraVideoTrackInitConfig)
  : Promise<[IMicrophoneAudioTrack, ICameraVideoTrack]> {
    const [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(audioConfig, videoConfig);
    setLocalAudioTrack(microphoneTrack);
    setLocalVideoTrack(cameraTrack);
    return [microphoneTrack, cameraTrack];
  }

  async function publishLocalAudio(audioConfig?: MicrophoneAudioTrackInitConfig)
  : Promise<IMicrophoneAudioTrack> {
    const microphoneTrack = await AgoraRTC.createMicrophoneAudioTrack(audioConfig);
    setLocalAudioTrack(microphoneTrack);
    await client.publish(microphoneTrack)
    return microphoneTrack;
  }

  async function publishLocalVideo(videoConfig?: CameraVideoTrackInitConfig)
  : Promise<ICameraVideoTrack> {
    const cameraTrack = await AgoraRTC.createCameraVideoTrack(videoConfig);
    setLocalVideoTrack(cameraTrack);
    await client.publish(cameraTrack)
    return cameraTrack;
  }

  async function unpublishLocalAudio() {
    await client.unpublish(localAudioTrack)
    if (localAudioTrack) {
      localAudioTrack.stop();
      localAudioTrack.close();
    }
  }

  async function unpublishLocalVideo() {
    await client.unpublish(localVideoTrack)
    if (localVideoTrack) {
      localVideoTrack.stop();
      localVideoTrack.close();
    }
  }

  async function join(appid: string, channel: string, token?: string, uid?: string | number | null) {
    if (!client) return;
    // const [microphoneTrack, cameraTrack] = await createLocalTracks();
    
    await client.join(appid, channel, token || null);
    // await client.publish([microphoneTrack, cameraTrack]);

    // (window as any).client = client;
    // (window as any).videoTrack = cameraTrack;

    setJoinState(true);
  }

  async function leave() {
    await unpublishLocalAudio()
    await unpublishLocalVideo()
    setRemoteUsers([]);
    setJoinState(false);
    await client?.leave();
  }

  useEffect(() => {
    if (!client) return;
    setRemoteUsers(client.remoteUsers);
    client.enableAudioVolumeIndicator()

    const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      await client.subscribe(user, mediaType);
      // toggle rerender while state of remoteUsers changed.
      setRemoteUsers(_ => Array.from(client.remoteUsers));
    }
    const handleUserUnpublished = (user: IAgoraRTCRemoteUser) => {
      setRemoteUsers(_ => Array.from(client.remoteUsers));
    }
    const handleUserJoined = (user: IAgoraRTCRemoteUser) => {
      setRemoteUsers(_ => Array.from(client.remoteUsers));
    }
    const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
      setRemoteUsers(_ => Array.from(client.remoteUsers));
    }
    const handleVolumeIndicator = (result: any[]) => {
      const volumeMap : {[key: string]: number} = {}
      result.forEach((elem, _) => {
        volumeMap[elem.uid] = elem.level
      })
      const volumes = remoteUsers.map(user => (user.uid in volumeMap) ? volumeMap[user.uid] : 0)
      setVolumes(_ => volumes)
    }

    client.on('volume-indicator', handleVolumeIndicator);
    client.on('user-published', handleUserPublished);
    client.on('user-unpublished', handleUserUnpublished);
    client.on('user-joined', handleUserJoined);
    client.on('user-left', handleUserLeft);

    return () => {
      client.off('volume-indicator', handleVolumeIndicator);
      client.off('user-published', handleUserPublished);
      client.off('user-unpublished', handleUserUnpublished);
      client.off('user-joined', handleUserJoined);
      client.off('user-left', handleUserLeft);
    };
  }, [client]);

  return {
    localAudioTrack,
    localVideoTrack,
    joinState,
    leave,
    join,
    publishLocalAudio,
    publishLocalVideo,
    unpublishLocalAudio,
    unpublishLocalVideo,
    remoteUsers,
    volumes
  };
}