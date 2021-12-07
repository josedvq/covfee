import * as React from 'react'
import classNames from 'classnames'

interface Props {
    disable: boolean
}

class MouseVisualizer extends React.Component<Props> {
    container:HTMLDivElement = null
    rect: DOMRectReadOnly = null
    pointerRef: HTMLDivElement = null
    posPx: [number, number] = [0,0]

    static defaultProps: Props = {
        disable: false
    }

    componentDidMount() {
        // observe the visualizer div
        // update rect and ratio when the resolution changes
        let observer = new ResizeObserver((entries) => {
            this.rect = entries[0].contentRect
        })

        observer.observe(this.container)
    }

    setData = (data: [number, number]) => {
        if(!this.pointerRef) return

        this.posPx = [
            Math.round(data[0] * this.rect.width),
            Math.round(data[1] * this.rect.height)
        ]
        this.pointerRef.style.top = this.posPx[1] + 'px'
        this.pointerRef.style.left = this.posPx[0] + 'px'
    }

    render() {
        // do not render to save cycles when disabled
        return <div className='mouse-visualizer' ref={e=>{this.container=e}}>
            {this.props.children}
            {!this.props.disable &&
                <div className='mouse-visualizer-pointer' ref={e=>{this.pointerRef = e}} style={{
                    top: this.posPx[1] + 'px',
                    left: this.posPx[0] + 'px'
                }}></div>}
        </div>
    }
}

export default MouseVisualizer