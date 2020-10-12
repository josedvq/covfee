import * as React from 'react';

interface Props {
    intensity: number,
    setIntensity: Function
}

interface State {
    speed: number,
    jump_speed: number,
    falling_constant: number
}

class OneDIntensityFeedback extends React.Component<Props, State> {
    // animation params
    state: State = {
        speed: 0,
        jump_speed: 50,
        falling_constant: 10
    }

    container: any
    indicator: any

    constructor(props: Props) {
        super(props)
        this.container = React.createRef()
        this.indicator = React.createRef()
    }

    componentDidMount() {
        // start animation
        requestAnimationFrame(this.animation_render.bind(this))
        // key presses: left = 37, up = 38, right = 39, down = 40
        window.addEventListener("keydown", this.keydown.bind(this), false)
    }

    keydown(event: KeyboardEvent) {
        this.setState({
            speed: this.state.jump_speed
        })
    }

    update(timestamp: any) {
        let delta_time = 1
        let intensity = Math.max(0, this.props.intensity + this.state.speed * delta_time)
        let speed = this.state.speed - this.state.falling_constant * delta_time
        this.setState({
            speed: speed
        })
        this.props.setIntensity(intensity)
    }

    animation_render(timestamp: any) {
        this.update(timestamp);
        requestAnimationFrame(this.animation_render.bind(this));
    }

    render() {
        return <div ref={this.container} className='gui-vertical'>
            <div ref={this.indicator} className='gui-indicator' style={{ bottom: this.props.intensity }}></div>
        </div>
    }
}

export { OneDIntensityFeedback }