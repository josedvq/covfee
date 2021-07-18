import * as React from 'react'
import {
    Row,
    Col,
    Typography
} from 'antd'
const { Title } = Typography
import { OneDIntensity } from '../input/1d_intensity'
import { TaskType} from '@covfee-types/task'
import {  ContinuousTaskProps, CovfeeContinuousTask, TaskInfo } from './base'
import { Continuous1DTaskSpec} from '@covfee-types/tasks/continuous_1d'
import { HTML5PlayerMedia } from '@covfee-types/players/html5';

interface Props extends TaskType, ContinuousTaskProps {
    spec: Continuous1DTaskSpec
}

interface State {
    reverseCount: {
        visible: boolean
        count: number
    },
    replayMode: {
        data: Array<number>
    }
}
class Continuous1DTask extends CovfeeContinuousTask<Props, State> {
    static taskInfo: TaskInfo = {
        supportsVisualization: true
    }
    
    state: State = {
        reverseCount: {
            visible: false,
            count: 0
        },
        replayMode: {
            data: null
        }
    }

    // intensity reading
    intensity: number

    reverseCountTimerId: number = null
    frameUpdateTimerId: number = null
 

    constructor(props: Props) {
        super(props)
    }

    static getPlayerProps = (media: HTML5PlayerMedia) => {
        return {
            type: 'HTML5Player'
        }
    }

    componentDidMount() {
        this.props.buttons.addListener('play-pause', ' ', 'Play/pause the video and data capture.')
            .addEvent('keydown', (e: Event) => {
                if (this.props.player.paused) this.props.buffer.log(this.props.player.currentTime(), ['play'])
                else this.props.buffer.log(this.props.player.currentTime(), ['pause'])
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
        this.props.buffer.log(this.props.player.currentTime(), ['vidswitch', from, to])
    }

    back2s = () => {
        const t1 = Math.max(0, this.props.player.currentTime() - 2)
        this.goto(t1)
    }

    back10s = () => {
        const t2 = Math.max(0, this.props.player.currentTime() - 10)
        this.goto(t2)
    }

    goto = (time: number) => {
        this.props.player.currentTime(time)
        this.cancelReverseCount(this.startReverseCount)
    }

    // recreate annotation (replay mode) until the given frame
    replayUntil = (time: number) => {
        // const data: number[] = this.props.buffer.read(time)
        // if(!data) return
        let data, logs
        [data, logs] = this.props.buffer.read(time)

        if(data)
            this.setIntensity(data[1])

        if(logs) {
            logs.forEach(log => {
                this.replayAction(log[2])
            })
        }
    }

    replayAction = (action: Array<any>) => {
        switch (action[0]) {
            case 'vidswitch':
                this.props.player.setActiveMedia(action[2])
                break
            default:
                break
        }
    }

    handleVideoEnded = () => {
        this.props.onEnd(null)
    }

    togglePlayPause = () => {
        this.props.player.togglePlayPause()
    }

    startReverseCount = () => {
        this.setState({
            reverseCount: {
                visible: true,
                count: 3
            }
        })

        this.reverseCountTimerId = window.setInterval(() => {
            if (this.state.reverseCount.count == 1) {
                // play the video
                this.cancelReverseCount()
                this.props.player.setPaused(false)
            } else {
                this.setState({
                    reverseCount: {
                        ...this.state.reverseCount,
                        count: this.state.reverseCount.count - 1
                    }
                })
            }
        }, 300)
    }

    cancelReverseCount = (cb?: Function) => {
        if (this.reverseCountTimerId != null) {
            window.clearInterval(this.reverseCountTimerId)
            this.reverseCountTimerId = null
        }
        this.setState({
            reverseCount: {
                ...this.state.reverseCount,
                visible: false,
            }
        }, () => { if (cb) cb() })
    }

    // important: do not call setState here (can impair performance)
    setIntensity = (val: number) => {
        this.intensity = val
    }

    wrapPlayer = (player: React.ReactElement) => {
        return player
    }

    render() {
        if (this.props.renderPlayer) {   // if it is a child (active) task
            return <>
                <Row>
                    <Col span={20}>
                        {this.props.renderPlayer()}
                    </Col>
                    <Col span={4}>
                        <OneDIntensity
                            buttons={this.props.buttons}
                            setIntensity={this.setIntensity}
                            getIntensity={()=>{return this.intensity}}
                            input={this.props.spec.intensityInput}
                            visualizationModeOn={!!this.props.response}/>
                    </Col>
                </Row>
            </>
        } else return null
    }

    instructions = () => {
        return this.props.buttons.renderInfo()
    }
}
export default Continuous1DTask