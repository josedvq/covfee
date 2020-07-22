import React from 'react';

class MouseTracker extends React.Component {

    private container = React.createRef();

    componentDidMount() {
        
    }

    // destroy player on unmount
    componentWillUnmount() {

    }

    public start() {
        this.container.current.onmousemove = (function (e) {
            const data = {
                't': 'm',
                'x': e.offsetX,
                'y': e.offsetY
            }
            this.props.on_data(data)
        }).bind(this)
    }

    public stop() {
        this.container.current.onmousemove = null;
    }

    render() {
        return (
            <div class='video-container mouse-tracker' ref={this.container}>
                {this.props.children}
            </div>
        )
    }
}

export default MouseTracker;