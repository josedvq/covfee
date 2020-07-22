import React from 'react';

class PreloadingPlayer extends React.Component {
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

    render() {
        return <div ref={this.container} style={this.props.style} class='gui-vertical'>
            <div ref={this.indicator} class='gui-indicator' style={{ bottom: this.state.position }}></div>
        </div>;
    }
}

export { PreloadingPlayer }