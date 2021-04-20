import * as React from 'react'
import {
    Row,
    Col,
    Typography
} from 'antd'
const { Title } = Typography
import { ClockCircleOutlined } from '@ant-design/icons';
import { OneDIntensity } from '../input/1d_intensity'
import keyboardManagerContext from '../input/button_manager_context'
import { TaskInfo, TaskType} from '@covfee-types/task'
import { CovfeeComponent, PlayerTaskProps } from './base'
import { Continuous1DTaskSpec} from '@covfee-types/tasks/continuous_1d'
import { HTML5PlayerMedia } from '@covfee-types/players/html5';

interface Props extends TaskType, PlayerTaskProps {
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
class Continuous1DTask extends CovfeeComponent<Props, State> {
    static taskInfo: TaskInfo = {
        continuous: true,
        can_visualize: true,
        supportsParent: true,    // video task supports having a parent task
        supportsChildren: true   // video task supports children by implementing on-frame visualization
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
        this.context.addListener('play-pause', ' ', 'Play/pause the video and data capture.')
            .addEvent('keydown', (e: Event) => {
                if (this.props.paused) this.props.buffer.log(this.props.currentTime(), ['play'])
                else this.props.buffer.log(this.props.currentTime(), ['pause'])
                this.togglePlayPause()
            })
            
        this.context.addListener('back2s', 's', 'Go back 2 seconds')
            .addEvent('keydown', () => {
                this.back2s()
                this.props.buffer.log(this.props.currentTime(), ['back2s'])
            })

        this.context.addListener('back10s', 'a', 'Go back 10 seconds')
            .addEvent('keydown', () => {
                this.back10s()
                this.props.buffer.log(this.props.currentTime(), ['back10s'])
            })
            
        // update default keyboard keys with props
        if (this.props.spec.controls) {
            this.context.applyMap(this.props.spec.controls)
        }

        // start listening to the player
        this.props.setPlayerListeners({
            'load': ()=>{},
            'frame': this.handleFrame,
            'end': this.handleVideoEnded,
            'vidswitch': this.handleVideoSwitch
        })
    }

    componentWillUnmount() {
        this.context.removeListener('play-pause')
        this.context.removeListener('back2s')
        this.context.removeListener('back10s')
        if (this.frameUpdateTimerId) clearInterval(this.frameUpdateTimerId)
    }

    // Replaying logic
    // Takes care of replaying an annotation given a log
    // writes output to the buffer on every frame
    handleFrame = (time: number) => {
        if (this.props.visualizationModeOn) {
            this.replayUntil(time)
        } else {
            this.props.buffer.data(
                time,
                [this.intensity]
            )
        }
        if (this.props.onFrame)
            this.props.onFrame(time)
    }

    handleVideoSwitch = (from: number, to: number) => {
        this.props.buffer.log(this.props.currentTime(), ['vidswitch', from, to])
    }

    back2s = () => {
        const t1 = Math.max(0, this.props.currentTime() - 2)
        this.goto(t1)
    }

    back10s = () => {
        const t2 = Math.max(0, this.props.currentTime() - 10)
        this.goto(t2)
    }

    goto = (time: number) => {
        this.props.currentTime(time)
        this.cancelReverseCount(this.startReverseCount)
    }

    

    // recreate annotation (replay mode) until the given frame
    replayUntil = (time: number) => {
        const data: number[] = this.props.buffer.read(time)
        if(!data) return

        this.setIntensity(data[1])

        // if(actions && this.props.visualizeActionsOn) {
        //     actions.forEach(action => {
        //         this.replayAction(action)
        //     })
        // }
    }

    replayAction = (action: Array<any>) => {
        if (typeof action[3] == 'number') {
            this.setState({
                replayMode: {
                    ...this.state.replayMode,
                    data: [action[3], action[4]]
                }
            })
            return
        }
        switch (action[1]) {
            case 'back2s':
                this.back2s()
                break
            case 'back10s':
                this.back10s()
                break
            default:
        }
    }

    handleVideoEnded = () => {
        this.props.setPaused(true)
        this.props.onEnd()
    }

    togglePlayPause = () => {
        if (this.props.paused) {
            if (this.state.reverseCount.visible) {
                this.cancelReverseCount()
            } else {
                this.startReverseCount()
            }
        } else {
            this.props.setPaused(true)
        }
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
                this.props.setPaused(false)
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
        
        if (this.props.player) {   // if it is a child (active) task
            return <>
                <Row>
                    <Col span={20}>
                        {this.props.player}
                    </Col>
                    <Col span={4}>
                        <OneDIntensity
                            setIntensity={this.setIntensity}
                            getIntensity={()=>{return this.intensity}}
                            input={this.props.spec.intensityInput}
                            visualizationModeOn={this.props.visualizationModeOn}/>
                    </Col>
                </Row>
            </>
        } else return null
    }

    instructions = () => {
        return <>
            <Row>
                <Col span={24}>
                    <Title level={4}>Keyboard controls</Title>
                    {this.context.renderInfo()}
                </Col>
            </Row>
        </>
    }

    


}
Continuous1DTask.contextType = keyboardManagerContext
export default Continuous1DTask