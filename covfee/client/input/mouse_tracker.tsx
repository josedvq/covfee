import * as React from 'react'
import classNames from 'classnames'

interface Props {
    disable: boolean
    paused: boolean
    mouseActive: boolean
    occluded: boolean
    onData: Function
    onMouseActiveChange: Function
}

class MouseTracker extends React.Component<Props> {

    private container = React.createRef<HTMLDivElement>()
    private videoBorder = React.createRef<HTMLDivElement>()

    private resolution: Array<number>

    componentDidMount() {
        if(this.props.disable) return

        this.container.current.addEventListener('mouseover', this.handleMouseOver)
        this.container.current.addEventListener('mouseout', this.handleMouseOut)
        // update the height of the container
        let observer = new ResizeObserver((entries) => {
            this.resolution = [entries[0].contentRect.width, entries[0].contentRect.height]
        })
        observer.observe(this.container.current)

        if(!this.props.paused) this.start()
    }

    componentDidUpdate(prevProps: Props) {
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
        if(this.props.disable) return
        
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