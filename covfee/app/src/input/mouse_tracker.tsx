import React from 'react'
import classNames from 'classnames'

class MouseTracker extends React.Component {

    private container = React.createRef()
    private videoBorder = React.createRef()

    private resolution: Array<number>

    constructor(props: object) {
        super(props)
        this.handleMouseMove = this.handleMouseMove.bind(this)
        this.handleMouseOver = this.handleMouseOver.bind(this)
        this.handleMouseOut = this.handleMouseOut.bind(this)
        this.handleResize = this.handleResize.bind(this)
    }

    componentDidMount() {
        this.container.current.addEventListener('mouseover', this.handleMouseOver)
        this.container.current.addEventListener('mouseout', this.handleMouseOut)
        window.addEventListener('resize', this.handleResize)
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
        this.container.current.removeEventListener('mouseover', this.handleMouseOver)
        this.container.current.removeEventListener('mouseout', this.handleMouseOut)
        window.removeEventListener('resize', this.handleResize)
    }

    handleResize(e: Event) {
        this.resolution = [this.container.current.offsetWidth, this.container.current.offsetHeight]
    }

    handleMouseMove(e: Event) {
        const data = {
            't': 'm',
            'x': e.offsetX / this.resolution[0],
            'y': e.offsetY / this.resolution[1]
        }
        this.props.onData(data)
    }

    handleMouseOver(e: Event) {
        this.props.onMouseActiveChange(true)
    }

    handleMouseOut(e: Event) {
        this.props.onMouseActiveChange(false)
    }

    public start() {
        this.resolution = [this.container.current.offsetWidth, this.container.current.offsetHeight]
        this.container.current.addEventListener('mousemove', this.handleMouseMove)
    }

    public stop() {
        this.container.current.removeEventListener('mousemove', this.handleMouseMove)
    }

    public getContainer() {
        return this.container.current
    }

    render() {
        return (
            <div className={classNames('video-border', (this.props.mouseActive && !this.props.paused) ? 'video-border-active' : '')} ref={this.videoBorder}>
                <div className='video-container mouse-tracker' ref={this.container}>
                    {this.props.children}
                </div>
            </div>
        )
    }
}

export default MouseTracker;