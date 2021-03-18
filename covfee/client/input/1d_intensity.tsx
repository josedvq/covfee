import * as React from 'react'
import { myerror } from '../utils'
import keyboardManagerContext from './keyboard_manager_context'


interface Props {
    /**
     * Disables input. Used for visualization.
     */
    disabled: boolean
    /*
     * Value of intensity reading.
     */
    intensity: number
    /**
     * To be called by the component to update the intensity reading.
     */
    setIntensity: Function
    /**
     * Indicates how the intensity is input
     */
    input: 'mouse' | {
        device: 'keyboard' | 'gamepad',
        /**
         * Increase intensity
         */
        up: string,
        /**
         * Decrease intensity
         */
        down: string
    }
}

interface State {
    speed: number
}

class OneDIntensity extends React.Component<Props, State> {

    static defaultProps = {
        input: 'mouse'
    }

    container = React.createRef<HTMLDivElement>()
    indicator = React.createRef<HTMLDivElement>()
    observer: ResizeObserver = null
    containerHeight: number = 0

    componentDidMount() {
        // update the height of the container
        this.observer = new ResizeObserver((entries) => {
            this.containerHeight = entries[0].contentRect.height - 20
        })
        this.observer.observe(this.container.current)
        
        // init intensity
        this.props.setIntensity(0)

        this.startInput()
    }

    componentWillUnmount() {
        this.context.removeEvents(this.keyboardEvents)
        document.removeEventListener('mousemove', this.mousemove)
        this.observer.disconnect()
    }

    keyboardEvents = {
        'up': {
            key: 'ArrowUp',
            description: 'Increase',
            handler: () => {
                this.props.setIntensity(this.props.intensity + 0.05)
            }
        },
        'down': {
            key: 'ArrowDown',
            description: 'Decrease',
            handler: () => {
                this.props.setIntensity(this.props.intensity - 0.05)
            }
        }
    }

    startInput = () => {
        if (this.props.input == 'mouse') {
            document.addEventListener('mousemove', this.mousemove, false)
        } else if (this.props.input.device == 'keyboard') {
            this.context.addEvents(this.keyboardEvents)
        } else {
            myerror('Unrecognized input device.')
        }
    }

    mousemove = (e: MouseEvent) => {
        const rect = this.container.current.getBoundingClientRect()
        const unboundedIntensity = (rect.bottom - e.clientY) / this.containerHeight
        const intensity = Math.max(0.0, Math.min(1.0, unboundedIntensity))
        this.props.setIntensity(intensity)
    }

    render() {
        const position = Math.round(this.props.intensity * this.containerHeight)
        return <div ref={this.container} className='gui-vertical'>
            <div ref={this.indicator} className='gui-indicator' style={{ bottom: position}}></div>
        </div>
    }
}

OneDIntensity.contextType = keyboardManagerContext
export { OneDIntensity }