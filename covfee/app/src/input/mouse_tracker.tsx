import React from 'react';

class MouseTracker extends React.Component {

    private container = React.createRef()
    private videoBorder = React.createRef()

    componentDidMount() {
        
    }

    // destroy player on unmount
    componentWillUnmount() {

    }

    public start() {
        this.container.current.onmousemove = (function(e) {
            const data = {
                't': 'm',
                'x': e.offsetX,
                'y': e.offsetY
            }
            this.props.onData(data)
        }).bind(this)

        this.container.current.onmouseover = (function(e) {
            this.props.onMouseActiveChange(true)
        })

        this.container.current.onmouseout = (function (e) {
            this.props.onMouseActiveChange(false)
        })
    }

    public stop() {
        this.container.current.onmousemove = null;
    }

    public getContainer() {
        return this.container.current
    }

    render() {
        return (
            <div className={['video-border', this.props.mouseActive ? 'video-border-active' : '']} ref={this.videoBorder}>
                <div className='video-container mouse-tracker' ref={this.container}>
                    {this.props.children}
                </div>
            </div>
        )
    }
}

export default MouseTracker;