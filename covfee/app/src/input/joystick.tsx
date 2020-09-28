import * as React from 'react';

class JoystickGUI extends React.Component {
    // animation params
    state: any = {
        position: 0,
        speed: 0,
        jump_speed: 50,
        falling_constant: 10
    };

    container: any
    indicator: any

    constructor(props: any) {
        super(props);
        this.container = React.createRef();
        this.indicator = React.createRef();
    }

    componentDidMount() {
        // start animation
        requestAnimationFrame(this.animation_render.bind(this));
        // key presses: left = 37, up = 38, right = 39, down = 40
        window.addEventListener("keydown", this.keydown.bind(this), false);
    }

    keydown(event) {
        this.setState({
            speed: this.state.jump_speed
        })
    }

    update(timestamp: any) {
        let delta_time = 1;
        let position = Math.max(0, this.state.position + this.state.speed * delta_time);
        let speed = this.state.speed - this.state.falling_constant * delta_time;
        this.setState({
            position: position,
            speed: speed
        })
    }

    draw() {
        // update style
        return;
    }

    animation_render(timestamp: any) {
        this.update(timestamp);
        this.draw();

        requestAnimationFrame(this.animation_render.bind(this));
    }

    render() {
        return <div ref={this.container} style={this.props.style} className='gui-vertical'>
            <div ref={this.indicator} className='gui-indicator' style={{bottom: this.state.position}}></div>
        </div>;
    }
}

export { JoystickGUI }