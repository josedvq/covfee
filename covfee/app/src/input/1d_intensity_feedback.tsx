import * as React from 'react';

interface Props {
    /**
     * Disables input. Used for visualization.
     */
    disabled: boolean,
    /**
     * Array with keyboard key strings to be used as intensity indicators.
     */
    keys: Array<string>,
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
    falling_constant: number
}

interface State {
    speed: number
}

class OneDIntensityFeedback extends React.Component<Props, State> {

    static defaultProps = {
        keys: ['ArrowUp'],
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
        // key presses: left = 37, up = 38, right = 39, down = 40
        window.addEventListener("keydown", this.keydown, false)

        // update the height of the container
        this.observer = new ResizeObserver((entries) => {
            this.containerHeight = entries[0].contentRect.height - 20
        })
        this.observer.observe(this.container.current)
        
        // init intensity
        this.props.setIntensity(0)
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.keydown)
        cancelAnimationFrame(this.reqId)
        this.observer.disconnect()
    }

    keydown = (e: KeyboardEvent) => {
        // ignore if event occurs in input elements
        const tagName = e.target.tagName.toLowerCase()
        if (['input', 'textarea', 'select', 'button'].includes(tagName)) return

        // ignore if not one of the given keys
        if(!this.props.keys.includes(e.key)) return

        // ignore repeat events
        if (e.repeat) return

        e.preventDefault()
        
        this.setState({
            speed: this.props.jump_speed
        })
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

export { OneDIntensityFeedback }