import React from 'react'
import {HTML5Player, Props as HTML5PlayerProps} from './html5'
import {OpencvFlowPlayer, Props as OpencvFlowPlayerProps} from './opencv'
// import { WaveSurferPlayer, Props as WaveSurferPlayerProps} from './wavesurfer'

export { HTML5Player, OpencvFlowPlayer}

export default {
    'HTML5Player': HTML5Player,
    'OpencvFlowPlayer': OpencvFlowPlayer,
    // 'WaveSurferBasicPlayer': WaveSurferPlayer
}

export type PlayerProps = HTML5PlayerProps | OpencvFlowPlayerProps// | WaveSurferPlayerProps

export interface RenderPlayerProps {
    type: string
    ref: (arg0: any) => void
    props: PlayerProps
}
