import React from 'react'
import {HTML5Player, Props as HTML5PlayerProps} from './html5'
import {OpencvFlowPlayer, Props as OpencvFlowPlayerProps} from './opencv'
import { WaveSurferBasicPlayer, Props as WaveSurferBasicPlayerProps} from './wavesurfer_basic'

export { HTML5Player, OpencvFlowPlayer, WaveSurferBasicPlayer}

export default {
    'HTML5Player': HTML5Player,
    'OpencvFlowPlayer': OpencvFlowPlayer,
    'WaveSurferBasicPlayer': WaveSurferBasicPlayer
}

export type PlayerProps = HTML5PlayerProps | OpencvFlowPlayerProps | WaveSurferBasicPlayerProps

export interface RenderPlayerProps {
    type: string
    ref: (arg0: any) => void
    props: PlayerProps
}
