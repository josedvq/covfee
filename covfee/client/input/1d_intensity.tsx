import * as React from 'react'
import { myerror } from '../utils'
import keyboardManagerContext from './keyboard_manager_context'
import { Intensity1DInputSpec} from '@covfee-types/input/1d_intensity'

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
    input: Intensity1DInputSpec
}

interface State {
    speed: number
}

class OneDIntensity extends React.Component<Props, State> {

    static defaultProps = {
        controls: 'mousemove'
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
        this.context.removeEvents(this.buttonEvents)
        document.removeEventListener('mousemove', this.mousemove, false)
        this.observer.disconnect()
    }

    buttonEvents = {
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
        if (this.props.input.device == 'mousemove') {
            document.addEventListener('mousemove', this.mousemove, false)
        } else if (this.props.input.device == 'keyboard') {
            if (this.props.input.controls) {
                for (const [id, key] of Object.entries(this.props.input.controls)) {
                    this.buttonEvents[id]['key'] = key
                    
                }
            }
            this.context.addEvents(this.buttonEvents)
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