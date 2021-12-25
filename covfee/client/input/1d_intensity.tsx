import * as React from 'react'
import { myerror } from '../utils'
import { BinaryInputSpec, ContinuousKeyboardInputSpec, GravityKeyboardInputSpec, Intensity1DInputSpec} from '@covfee-types/input/1d_intensity'
import { ButtonManagerClient } from './button_manager'
import styled from 'styled-components'

interface Props {
    /**
     * Recording / replay is paused
     */
    paused: boolean
    /**
     * Called by the component to update the intensity reading. Should not call setState as it is called inside a requestAnimationFrame.
     */
    setIntensity: Function
    /*
     * Returns the value of the intensity reading.
     */
    getIntensity?: ()=>number
    /**
     * Indicates how the intensity is input
     */
    input: Intensity1DInputSpec
    /**
     * Turns on visualization where the UI is fully controlled by the parent.
     * The component will read its data via getIntensity()
     */
    replay?: boolean
    buttons: ButtonManagerClient
    buffer: any
}


export class OneDIntensity extends React.Component<Props> {

    static defaultProps = {
    }
    // inputProps: Intensity1DInputSpec

    // animation variables
    intensity: number = 0
    speed: number = 0

    animateFn: (time: number) => void
    animationId: number
    container: HTMLDivElement
    indicator: HTMLDivElement
    observer: ResizeObserver = null
    containerHeight: number = 0

    constructor(props: Props) {
        super(props)
        this.animateFn = this.getAnimateFn(props.input.mode)
    }

    componentDidMount() {
        // update the height of the container
        this.observer = new ResizeObserver((entries: any) => {
            this.containerHeight = entries[0].contentRect.height - 20
        })
        this.observer.observe(this.container)
        
        this.startInput()
        this.animationId = requestAnimationFrame(this.animateFn)
    }

    componentWillUnmount() {
        // this.props.buttons.removeEvents()
        this.stopInput()
        this.observer.disconnect()
        cancelAnimationFrame(this.animationId)
    }

    componentDidUpdate(prevProps: Props) {
        
        cancelAnimationFrame(this.animationId)
        this.setState(this.state, ()=>{
            this.animationId = requestAnimationFrame(this.animateFn)
        })
    }

    get controls() {
        if(this.props.input.mode == 'continuous-mousemove') return null

        return {
            up: 's',
            down: 'a',
            ...(this.props.input.controls ? this.props.input.controls : {})
        }
    }

    mousemove = (e: MouseEvent) => {
        const rect = this.container.getBoundingClientRect()
        const unboundedIntensity = (rect.bottom - e.clientY) / this.containerHeight
        this.intensity = Math.max(0.0, Math.min(1.0, unboundedIntensity))
    }

    startBinaryKeyboard = () => {
        this.props.buttons.addListener('up', 'q', 'Activate')
        this.props.buttons.applyMap(this.controls)
    }

    startMousemove = () => {
        document.addEventListener('mousemove', this.mousemove, false)
    }

    startContinuousKeyboard = () => {
        this.props.buttons.addListener('up', 'ArrowUp', 'Increase')
            .addEvent('keydown', () => {
                this.intensity = Math.min(1.0, this.intensity + 0.05)
            })

        this.props.buttons.addListener('down', 'ArrowDown', 'Decrease')
            .addEvent('keydown', () => {
                this.intensity = Math.max(0, this.intensity - 0.05)
            })
            
        this.props.buttons.applyMap(this.controls)
    }

    startGravityKeyboard = () => {
        this.props.buttons.addListener('up', 'a', 'Increase')
            .addEvent('keydown', () => {
                this.intensity = 1
                this.speed = 0//this.props.input.jump_speed
            })
        
        this.props.buttons.applyMap(this.controls)
    }

    startInput = () => {
        return {
            'binary': this.startBinaryKeyboard,
            'continuous-mousemove': this.startMousemove,
            'continuous-keyboard': this.startContinuousKeyboard,
            'gravity-keyboard': this.startGravityKeyboard
        }[this.props.input.mode]()
    }

    stopInput = () => {
        document.removeEventListener('mousemove', this.mousemove, false)
    }

    read = () => {
        return this.intensity
    }

    getAnimateFn = (mode: string) => {
        return {
            'binary': () => {
                this.animationId = requestAnimationFrame(this.animateFn)

                this.intensity = this.props.buttons.getStatus('up') ? 1 : 0
                this.props.setIntensity(this.intensity)
                this.container.style.backgroundColor = this.intensity ? 'green' : 'black'
            },
            'continuous-mousemove': () => {
                this.animationId = requestAnimationFrame(this.animateFn)

                this.props.setIntensity(this.intensity)

                const position = Math.round(this.intensity * this.containerHeight)
                this.indicator.style.bottom = position.toString() + 'px'
            },
            'continuous-keyboard': () => {
                this.animationId = requestAnimationFrame(this.animateFn)

                this.props.setIntensity(this.intensity)

                const position = Math.round(this.intensity * this.containerHeight)
                this.indicator.style.bottom = position.toString() + 'px'
            },
            'gravity-keyboard': () => {
                this.animationId = requestAnimationFrame(this.animateFn)

                let delta_time = 1
                // TODO: implement delta_time calculation
                this.intensity = Math.max(0, Math.min(1, this.intensity + this.speed * delta_time))
                this.speed = this.speed - this.props.input.acceleration_constant * delta_time

                this.props.setIntensity(this.intensity)

                const position = Math.round(this.intensity * this.containerHeight)
                this.indicator.style.bottom = position.toString() + 'px'
            }
        }[mode]
    }

    render() {
        return <Container ref={e=>{this.container = e}}>
            {!['binary'].includes(this.props.input.mode) &&
            <Indicator ref={e=>{this.indicator = e}} style={{bottom: 0}}/>
            }
        </Container>
    }
}

const Container = styled.div`
    position: relative;
    width: 100%;
    height: 100%;
    background-color: black;
    border: 5px solid #202020;
`

const Indicator = styled.div`
    position: absolute;
    width: 100%;
    height: 20px;
    background-color: green;
`