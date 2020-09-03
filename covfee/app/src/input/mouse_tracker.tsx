import React from 'react';

class MouseTracker extends React.Component {

    private container = React.createRef()
    private videoBorder = React.createRef()

    constructor(props: object) {
        super(props)
        this.onMouseMove = this.onMouseMove.bind(this)
        this.onMouseOver = this.onMouseOver.bind(this)
        this.onMouseOut = this.onMouseOut.bind(this)
    }

    componentDidMount() {

    }

    componentDidUpdate(prevProps: object) {
        if (this.props.paused !== prevProps.paused) {
            if (this.props.paused) this.stop()
            else this.start()
        }
    }

    // destroy player on unmount
    componentWillUnmount() {
        if(this.props.paused) this.stop()
    }

    onMouseMove(e: Event) {
        const data = {
            't': 'm',
            'x': e.offsetX,
            'y': e.offsetY
        }
        this.props.onData(data)
    }

    onMouseOver(e: Event) {
        this.props.onMouseActiveChange(true)
    }

    onMouseOut(e: Event) {
        this.props.onMouseActiveChange(false)
    }

    public start() {
        this.container.current.addEventListener('mousemove', this.onMouseMove)
        this.container.current.addEventListener('mouseover', this.onMouseOver)
        this.container.current.addEventListener('mouseout', this.onMouseOut)
    }

    public stop() {
        this.container.current.removeEventListener('mousemove', this.onMouseMove)
        this.container.current.removeEventListener('mouseover', this.onMouseOver)
        this.container.current.removeEventListener('mouseout', this.onMouseOut)
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