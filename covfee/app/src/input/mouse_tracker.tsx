import * as React from 'react'
import classNames from 'classnames'

class MouseTracker extends React.Component {

    private container = React.createRef()
    private videoBorder = React.createRef()

    private resolution: Array<number>

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

    handleResize = (e: Event) => {
        this.resolution = [this.container.current.offsetWidth, this.container.current.offsetHeight]
    }

    handleMouseMove = (e: MouseEvent) => {
        const data = [
            e.offsetX / this.resolution[0],
            e.offsetY / this.resolution[1]
        ]
        this.props.onData(data, e)
    }

    handleMouseOver = (e: Event) => {
        this.props.onMouseActiveChange(true)
    }

    handleMouseOut = (e: Event) => {
        this.props.onMouseActiveChange(false)
    }

    start() {
        this.resolution = [this.container.current.offsetWidth, this.container.current.offsetHeight]
        this.container.current.addEventListener('mousemove', this.handleMouseMove)
    }

    stop() {
        this.container.current.removeEventListener('mousemove', this.handleMouseMove)
    }

    getContainer() {
        return this.container.current
    }

    render() {
        return (
            <div className={classNames({
                'mouse-tracker': true, 
                'mouse-tracker-active': this.props.mouseActive && !this.props.paused,
                'mouse-tracker-occluded': this.props.mouseActive && !this.props.paused && this.props.occluded
                })} ref={this.videoBorder}>

                <div className='video-container' ref={this.container}>
                    {this.props.children}
                </div>
            </div>
        )
    }
}

export default MouseTracker