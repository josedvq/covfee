import * as React from 'react';
import keyboardManagerContext from './keyboard_manager_context';

interface Props {
    /**
     * Disables input. Used for visualization.
     */
    disabled: boolean,
    /**
     * Value of intensity reading.
     */
    intensity: number,
    /**
     * To be called by the component to update the intensity reading.
     */
    setIntensity: Function
    /**
     * Constant speed for when the indicator jumps
     */
    jump_speed: number
    /**
     * Acceleration constant. Speed is reduced by this number on every timestep.
     */
    falling_constant: number,
    /**
     * Indicates how the intensity is input
     */
    input: {
        device: 'keyboard' | 'gamepad'
        /**
         * Increase intensity
         */
        up: string
    }
}

interface State {
    speed: number
}

class OneDInterval extends React.Component<Props, State> {

    static defaultProps = {
        jump_speed: 1 / 10,
        falling_constant: 5 / 600
    }
    // animation params
    state: State = {
        speed: 0
    }

    container = React.createRef<HTMLDivElement>()
    indicator = React.createRef<HTMLDivElement>()
    observer:ResizeObserver = null
    containerHeight: number = 0

    // animation req_id
    reqId: number = null

    componentDidMount() {
        // start animation
        this.reqId = requestAnimationFrame(this.animationRender)

        // update the height of the container
        this.observer = new ResizeObserver((entries) => {
            this.containerHeight = entries[0].contentRect.height - 20
        })
        this.observer.observe(this.container.current)
        
        // init intensity
        this.props.setIntensity(0)

        this.context.addEvents(this.keyboardEvents)
    }

    componentWillUnmount() {
        this.context.removeEvents(this.keyboardEvents)
        cancelAnimationFrame(this.reqId)
        this.observer.disconnect()
    }

    keyboardEvents = {
        'up': {
            key: 'ArrowUp',
            description: 'Increase',
            handler: () => {
                this.setState({
                    speed: this.props.jump_speed
                })
            }
        }
    }

    update = (timestamp: any) => {
        let delta_time = 1
        let intensity = Math.max(0, Math.min(1, this.props.intensity + this.state.speed * delta_time))
        let speed = this.state.speed - this.props.falling_constant * delta_time
        this.setState({
            speed: speed
        })
        this.props.setIntensity(intensity)
    }

    animationRender = (timestamp: any) => {
        if(!this.props.disabled) this.update(timestamp)
        this.reqId = requestAnimationFrame(this.animationRender);
    }

    render() {
        const position = Math.round(this.props.intensity * this.containerHeight)
        return <div ref={this.container} className='gui-vertical'>
            <div ref={this.indicator} className='gui-indicator' style={{ bottom: position}}></div>
        </div>
    }
}

OneDInterval.contextType = keyboardManagerContext
export { OneDInterval }