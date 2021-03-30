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
    getIntensity?: number
    /**
     * Called by the component to update the intensity reading. Should not call setState as it is called inside a requestAnimationFrame.
     */
    setIntensity: Function
    /**
     * Indicates how the intensity is input
     */
    input: Intensity1DInputSpec
}

class OneDIntensity extends React.Component<Props, State> {

    static defaultProps = {
        controls: 'mousemove'
    }

    // animation variables
    intensity: number = 0
    speed: number = 0

    animationId: number
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
        
        this.startInput()
    }

    componentWillUnmount() {
        this.context.removeEvents(this.buttonEventsContinuousKeyboard)
        document.removeEventListener('mousemove', this.mousemove, false)
        this.observer.disconnect()
        if(this.animationId) {
            cancelAnimationFrame(this.animationId)
        }
    }

    mousemove = (e: MouseEvent) => {
        const rect = this.container.current.getBoundingClientRect()
        const unboundedIntensity = (rect.bottom - e.clientY) / this.containerHeight
        this.intensity = Math.max(0.0, Math.min(1.0, unboundedIntensity))
    }

    buttonEventsContinuousKeyboard = {
        'up': {
            key: 'ArrowUp',
            description: 'Increase',
            handler: () => {
                this.intensity = Math.min(1.0, this.intensity + 0.05)
            }
        },
        'down': {
            key: 'ArrowDown',
            description: 'Decrease',
            handler: () => {
                this.intensity = Math.max(0, this.intensity - 0.05)
            }
        }
    }

    buttonEventsGravityKeyboard = {
        'up': {
            key: 'a',
            description: 'Increase',
            handler: () => {
                this.intensity = 1
                this.speed = 0//this.props.input.jump_speed
            }
        }
    }

    startInput = () => {
        if (this.props.input.mode == 'continuous-mousemove') {
            document.addEventListener('mousemove', this.mousemove, false)
        } else if (this.props.input.mode == 'continuous-keyboard') {
            if (this.props.input.controls) {
                for (const [id, key] of Object.entries(this.props.input.controls)) {
                    this.buttonEventsContinuousKeyboard[id]['key'] = key
                }
            }
            this.context.addEvents(this.buttonEventsContinuousKeyboard)
        } else if (this.props.input.mode == 'gravity-keyboard') {
            if (this.props.input.controls) {
                for (const [id, key] of Object.entries(this.props.input.controls)) {
                    this.buttonEventsGravityKeyboard[id]['key'] = key
                }
            }
            this.context.addEvents(this.buttonEventsGravityKeyboard)
        } else {
            myerror('Unrecognized input device.')
        }

        requestAnimationFrame(this.animate)
    }


    animate = (timestamp: number) => {
        if (this.props.input.mode == 'continuous-mousemove') {
            //pass
        } else if (this.props.input.mode == 'continuous-keyboard') {
            //pass
        } else if (this.props.input.mode == 'gravity-keyboard') {
            let delta_time = 1
            // TODO: implement delta_time calculation
            this.intensity = Math.max(0, Math.min(1, this.intensity + this.speed * delta_time))
            this.speed = this.speed - this.props.input.acceleration_constant * delta_time
        }

        this.props.setIntensity(this.intensity)
        const position = Math.round(this.intensity * this.containerHeight)
        this.indicator.current.style.bottom = position.toString() + 'px'

        this.animationId = requestAnimationFrame(this.animate)
    }

    render() {
        return <div ref={this.container} className='gui-vertical'>
            <div ref={this.indicator} className='gui-indicator' style={{bottom: 0}}></div>
        </div>
    }
}

OneDIntensity.contextType = keyboardManagerContext
export { OneDIntensity }