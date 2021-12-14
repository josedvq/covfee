import * as React from 'react'
import {
    Row,
    Col,
    Typography
} from 'antd'
const { Title } = Typography
import { OneDIntensity } from '../input/1d_intensity'
import { TaskType} from '@covfee-types/task'
import {  ContinuousTaskProps, CovfeeContinuousTask } from './base'
import { Continuous1DTaskSpec} from '@covfee-types/tasks/continuous_1d'
import { HTML5PlayerMedia } from '@covfee-types/players/html5';

interface Props extends TaskType, ContinuousTaskProps {
    spec: Continuous1DTaskSpec
}

interface State {
}
export default class Continuous1DTask extends CovfeeContinuousTask<Props, State> {
    static taskInfo = {
        bufferDataLen: 1
    }
    
    state: State = {
    }

    // intensity reading
    intensity: number

    reverseCountTimerId: number = null
    frameUpdateTimerId: number = null
 

    constructor(props: Props) {
        super(props)
    }

    componentDidMount() {
        this.props.buttons.addListener('play-pause', ' ', 'Play/pause the video and data capture.')
            .addEvent('keydown', (e: Event) => {
                if (this.props.player.paused) this.props.buffer.log(this.props.player.currentTime() as number, ['play'])
                else this.props.buffer.log(this.props.player.currentTime() as number, ['pause'])
                this.props.player.togglePlayPause()
            })
            
        // this.props.buttons.addListener('back2s', 's', 'Go back 2 seconds')
        //     .addEvent('keydown', () => {
        //         this.back2s()
        //         this.props.buffer.log(this.props.player.currentTime(), ['back2s'])
        //     })

        // this.props.buttons.addListener('back10s', 'a', 'Go back 10 seconds')
        //     .addEvent('keydown', () => {
        //         this.back10s()
        //         this.props.buffer.log(this.props.player.currentTime(), ['back10s'])
        //     })
            
        // update default keyboard keys with props
        if (this.props.spec.controls) {
            this.props.buttons.applyMap(this.props.spec.controls)
        }

        // start listening to the player
        this.props.player.addListener('frame', this.handleFrame)
        this.props.player.addListener('end', this.handleVideoEnded)
        this.props.player.addListener('vidswitch', this.handleVideoSwitch)
    }

    componentWillUnmount() {
        this.props.buttons.removeListener('play-pause')
        this.props.buttons.removeListener('back2s')
        this.props.buttons.removeListener('back10s')
        if (this.frameUpdateTimerId) clearInterval(this.frameUpdateTimerId)
    }

    // Replaying logic
    // Takes care of replaying an annotation given a log
    // writes output to the buffer on every frame
    handleFrame = (time: number) => {
        if (this.props.response) {
            this.replayUntil(time)
        } else {
            this.props.buffer.data(
                time,
                [this.intensity]
            )
        }
    }

    handleVideoSwitch = (from: number, to: number) => {
        if(this.props.response) return
        this.props.buffer.log(this.props.player.currentTime() as number, ['vidswitch', from, to])
    }

    back2s = () => {
        const t = Math.max(0, this.props.player.currentTime() as number - 2)
        this.props.player.currentTime(t)
    }

    back10s = () => {
        const t = Math.max(0, this.props.player.currentTime() as number - 10)
        this.props.player.currentTime(t)
    }

    // recreate annotation (replay mode) until the given frame
    replayUntil = (time: number) => {
        this.props.buffer.seek(time)
        // const data: number[] = this.props.buffer.read(time)
        // if(!data) return
        // let data, logs
        // [data, logs] = this.props.buffer.read(time)

        // if(data)
        //     this.setIntensity(data[1])

        // if(logs) {
        //     logs.forEach(log => {
        //         this.replayAction(log[2])
        //     })
        // }
    }

    replayAction = (action: Array<any>) => {
        switch (action[0]) {
            default:
                break
        }
    }

    handleVideoEnded = () => {
        this.props.onEnd(null)
    }

    // important: do not call setState here (can impair performance)
    setIntensity = (val: number) => {
        this.intensity = val
    }

    wrapPlayer = (player: React.ReactElement) => {
        return player
    }

    render() {
        return <>
            <div style={{height: 'calc(100% - 200px)'}}>
                {this.props.renderPlayer({
                    type: 'HTML5Player',
                    media: this.props.spec.media,
                    countdown: this.props.spec.showCountdown
                    })}
            </div>
            <div style={{height: '200px'}}>
                <OneDIntensity
                    paused={this.props.player.paused}
                    buttons={this.props.buttons}
                    buffer={this.props.buffer}
                    setIntensity={this.setIntensity}
                    getIntensity={()=>{return this.intensity}}
                    input={this.props.spec.intensityInput}
                    visualizationModeOn={!!this.props.response}/>
            </div>
        </>
    }

    instructions = () => {
        return this.props.buttons.renderInfo()
    }
}