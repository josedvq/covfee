import * as React from 'react';

interface Props {
    /*
    Array with keyboard key strings to be used as intensity indicators.
    */
    keys: Array<string>,
    /*
    Value of intensity reading.
    */
    intensity: number,
    /*
    To be called by the component to update the intensity reading.
    */
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
        jump_speed: 1/10,
        falling_constant: 5/600
    }

    container = React.createRef<HTMLDivElement>()
    indicator = React.createRef<HTMLDivElement>()
    containerHeight: number = 0

    componentDidMount() {
        // start animation
        requestAnimationFrame(this.animation_render.bind(this))
        // key presses: left = 37, up = 38, right = 39, down = 40
        window.addEventListener("keydown", this.keydown.bind(this), false)

        // update the height of the container
        let observer = new ResizeObserver((entries) => {
            this.containerHeight = entries[0].contentRect.height - 20
        })
        observer.observe(this.container.current)
    }

    keydown(e: KeyboardEvent) {
        // ignore if event occurs in input elements
        const tagName = e.target.tagName.toLowerCase()
        if (['input', 'textarea', 'select', 'button'].includes(tagName)) return

        // ignore if not one of the given keys
        if(!this.props.keys.includes(e.key)) return

        // ignore repeat events
        if (e.repeat) return

        e.preventDefault()
        
        this.setState({
            speed: this.state.jump_speed
        })
    }

    update(timestamp: any) {
        let delta_time = 1
        let intensity = Math.max(0, Math.min(1, this.props.intensity + this.state.speed * delta_time))
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
        const position = Math.round(this.props.intensity * this.containerHeight)
        return <div ref={this.container} className='gui-vertical'>
            <div ref={this.indicator} className='gui-indicator' style={{ bottom: position}}></div>
        </div>
    }
}

export { OneDIntensityFeedback }