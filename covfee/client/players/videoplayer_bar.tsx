import { CaretRightOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { Slider } from 'antd'
import * as React from 'react'
import { BasePlayerProps } from './base'

type BarProps = Pick<BasePlayerProps, 'paused' | 'speed' | 'muted' | 'setPaused' | 'setSpeed' | 'setMuted'> & {
    /**
     * Duration of the video in seconds
     */
    duration: number
    /**
     * Called every second to update the video time
     */
    currentTime: ()=>number
    /**
     * Speed lever can be changed
     */
    speedEnabled: boolean
}

interface State {
    currentTime: number
}
/**
 * The bar with video player controls and information
 */
export class PlayerBar extends React.Component<BarProps, State> {

    static defaultProps = {
        speedEnabled: true
    }

    state: State = {
        currentTime: null
    }
    timeoutId: any

    componentDidMount() {
        // update currentTime
        this.setState({currentTime: this.props.currentTime()})
        this.timeoutId = setInterval(()=>{
            this.setState({currentTime: this.props.currentTime()})
        }, 1000)
    }

    componentWillUnmount() {
        clearInterval(this.timeoutId)
    }

    render() {
        return <div className="annot-bar">
            <div className="annot-bar-section">
                <ClockCircleOutlined /> {this.state.currentTime && this.state.currentTime.toFixed(0)} / {this.props.duration && this.props.duration.toFixed(0)}
            </div>
            {this.props.setSpeed &&
            <div className="annot-bar-section">
                <CaretRightOutlined/> {this.props.speed.toPrecision(2)}
                <Slider 
                    style={{ display: 'inline-block', margin: '0 0 0 8px', width: '200px' }}
                    min={0.1}
                    max={4}
                    step={0.1}
                    defaultValue={30}
                    value={this.props.speed}
                    onChange={this.props.setSpeed}/>
            </div>}
            {this.props.children}
        </div>
    }
}
