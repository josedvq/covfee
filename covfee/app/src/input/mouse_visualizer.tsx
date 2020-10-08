import * as React from 'react'
import classNames from 'classnames'

interface Props {
    data?: Array<number>
    disable: boolean
}

class MouseVisualizer extends React.Component<Props> {
    container = React.createRef<HTMLDivElement>()
    rect: DOMRectReadOnly = null

    componentDidMount() {
        // observe the visualizer div
        // update rect and ratio when the resolution changes
        let observer = new ResizeObserver((entries) => {
            this.rect = entries[0].contentRect
        })

        if(!this.props.disable) observer.observe(this.container.current)
    }
    render() {
        // do not render to save cycles when disabled
        if(this.props.disable) return this.props.children

        let pos = [0,0]
        if(this.props.data != null) {
            pos = [
                Math.round(this.props.data[0] * this.rect.width),
                Math.round(this.props.data[1] * this.rect.height)
            ]
        }

        return <div className='mouse-visualizer' ref={this.container}>
            <div className='mouse-visualizer-pointer' style={{
                top: pos[1] + 'px',
                left: pos[0] + 'px'
            }}></div>
            
            {this.props.children}
            
        </div>
    }
}

export default MouseVisualizer