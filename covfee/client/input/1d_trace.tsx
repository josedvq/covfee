import * as React from 'react'
import styled from 'styled-components'
import { myerror } from '../utils'
import { 
    Trace1DInputSpec,
    RankTraceInputSpec
} from '@covfee-types/input/1d_trace'
import { ButtonManagerClient } from './button_manager';

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
    input: Trace1DInputSpec
    /**
     * Turns on visualization where the UI is fully controlled by the parent.
     * The component will read its data via getIntensity()
     */
    replay?: boolean
    buttons: ButtonManagerClient
    buffer: any
    graphUpdatePeriod?: number
}

// Returns a number value clamped between a min and max value
function clamp(number: number, min: number, max: number) {
    return Math.max(min, Math.min(number, max));
}


function hsl2rgb(h: number, s: number, l:number) {
    s = s/100;
    l = l/100;
    let a=s*Math.min(l,1-l);
    let f= (n: number,k=(n+h/30)%12) => l - a*Math.max(Math.min(k-3,9-k,1),-1);                 
    return [f(0)*255,f(8)*255,f(4)*255];
}

interface Point {
    x: number,
    y: number
}

function gradient(a: any, b:any) {
    return (b.y-a.y)/(b.x-a.x);
}

function bzCurve(ctx: CanvasRenderingContext2D, points: Point[], f: number, t: number) {
    //f = 0, will be straight line
    //t suppose to be 1, but changing the value can control the smoothness too
    if (typeof(f) == 'undefined') f = 0.3;
    if (typeof(t) == 'undefined') t = 0.6;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    var m = 0;
    var dx1 = 0;
    var dy1 = 0;

    var preP = points[0];
    for (var i = 1; i < points.length; i++) {
        var curP = points[i];
        const nexP = points[i + 1];

        let dx2, dy2
        if (nexP) {
            m = gradient(preP, nexP);
            dx2 = (nexP.x - curP.x) * -f;
            dy2 = dx2 * m * t;
        } else {
            dx2 = 0;
            dy2 = 0;
        }
        ctx.bezierCurveTo(preP.x - dx1, preP.y - dy1, curP.x + dx2, curP.y + dy2, curP.x, curP.y);
        dx1 = dx2;
        dy1 = dy2;
        preP = curP;
    }
    ctx.stroke();
}


export class OneDTrace extends React.Component<Props> {

    static defaultProps = {
        graphUpdatePeriod: 100
    }
    inputProps: Trace1DInputSpec

    // animation variables
    intensity: number = 0
    intensityMin = 0
    intensityMax = 0
    speed: number = 0

    animationId: number
    canvas: HTMLCanvasElement
    context: CanvasRenderingContext2D
    container: HTMLDivElement
    indicator: HTMLDivElement

    trace: number[] = []

    // ranktrace-new variables
    nextGraphNode = 0
    lastModifier = 0
    maxTrace = 5
    minTrace = -5

    // gtrace variables
    annotationMod = 1
    mod = 0

    constructor(props: Props) {
        super(props)
    }

    componentDidMount() {
        this.startInput()
        // this.animationId = requestAnimationFrame(this.animateFn)
    }

    componentWillUnmount() {
        this.stopInput()
        cancelAnimationFrame(this.animationId)
    }

    componentDidUpdate(prevProps: Props) {
        if(this.props.paused) {
            cancelAnimationFrame(this.animationId)
        } else {
            this.animationId = requestAnimationFrame(this.animateFn)
        }
    }

    get animateFn() {
        return {
            'ranktrace': this.animateRankTrace,
            'ranktrace-new': this.animateRankTraceNew,
            'gtrace': this.animateGtrace
        }[this.props.input.mode]
    }

    get bounds() {
        if(this.props.input.bounds)
            return this.props.input.bounds
        if(['ranktrace', 'ranktrace-new'].includes(this.props.input.mode)) 
            return [-Infinity, Infinity]
        if(this.props.input.mode == 'gtrace')
            return [-100, 100]
        return [0.0, 1.0]
    }

    get step() {
        if(this.props.input.mode == 'gtrace')
            return this.annotationMod
        return 1
    }

    get controls() {
        return {
            up: 's',
            down: 'a',
            ...(this.props.input.controls ? this.props.input.controls : {})
        }
    }

    requestUpdate = (intensity: number) => {
        if(isNaN(intensity)) return
        this.intensity = Math.max(this.bounds[0], Math.min(this.bounds[1], intensity))
        this.intensityMax = Math.max(this.intensityMax, this.intensity)
        this.intensityMin = Math.min(this.intensityMin, this.intensity)
       
    }

    startInput = () => {
        this.props.buttons.addListener('up', 'Increase')
            .addEvent('keydown', () => {
                this.requestUpdate(this.intensity + this.step)
            })

        this.props.buttons.addListener('down', 'Decrease')
            .addEvent('keydown', () => {
                this.requestUpdate(this.intensity - this.step)
            })
            
        this.props.buttons.applyMap({
            'up': 'ArrowUp',
            'down': 'ArrowDown'
        },this.controls)
    }

    stopInput = () => {
        this.props.buttons.removeListener('up')
        this.props.buttons.removeListener('down')
    }
    

    read = () => {
        return this.intensity
    }

    

    norm(val: number, max: number, min: number) {
        return (val - min) / (max - min);
    }

    // Return normalised Y and X positions for the display
    normPosY = (val: number, max: number, min: number) => {
        var position = Math.abs((this.norm(val, max, min) * (this.canvas.height - 40)) - (this.canvas.height - 40)) + 20;
        if (position !== position) {
            return this.canvas.height / 2;
        } else {
            return position;
        }
    }

    animateRankTrace = (timestamp: number) => {
        this.animationId = requestAnimationFrame(this.animateRankTrace)

        // read the intensity value
        if(this.props.replay) {
            const [data, _] = this.props.buffer.readHead()
            if(data)
                this.requestUpdate(data[2])
        } else {
            this.props.setIntensity(this.intensity)
        }

        

        const context = this.context,
              canvas = this.canvas,
              trace = this.trace

        context.clearRect(0, 0, canvas.width, canvas.height)
        context.fillStyle = '#2d2d2d'
        context.fillRect(0, 0, canvas.width, canvas.height)

        const length = this.props.buffer.head

        if(length === 0) return
        const iter = this.props.buffer.makeIterator(0, 0, length)

        const normTrace = []
        let res = iter.next()
        while(!res.done) {
            const [index, value] = res.value

            if(index !== 0) {
                normTrace.push({
                    x: index * ((this.canvas.width - 50) / length) + 20,
                    y: this.normPosY(value, this.intensityMax, this.intensityMin)
                })
            }
            res = iter.next()
        }

        if(normTrace.length === 0) return

        context.lineCap="round";
        context.strokeStyle = '#86a3c6';
        context.lineWidth = 4;
        context.beginPath();
        // Move to start position
        context.moveTo(normTrace[0].x, normTrace[0].y);
        // For every point, calculate the control point and draw quadratic curve
        for (var i = 1; i < normTrace.length - 2; i ++) {
            var xc = (normTrace[i].x + normTrace[i + 1].x) / 2;
            var yc = (normTrace[i].y + normTrace[i + 1].y) / 2;
            context.quadraticCurveTo(normTrace[i].x, normTrace[i].y, xc, yc);
        }
        // Curve to the last two segments
        if (i > 2) {
            context.quadraticCurveTo(normTrace[i].x, normTrace[i].y, normTrace[i+1].x, normTrace[i+1].y);
            context.stroke();
            // Annotation cursor
            context.beginPath();
            context.arc(normTrace[i+1].x, normTrace[i+1].y, 10, 0, 2 * Math.PI, false);
            context.stroke();
        }
    }

    animateRankTraceNew = (timestamp: number) => {
        // Request new frame, clear canvas, and redraw background
        this.animationId = requestAnimationFrame(this.animateRankTraceNew)

         // read the intensity value
         if(this.props.replay) {
            const [data, _] = this.props.buffer.readHead()
            if(data)
                this.requestUpdate(data[2])
        } else {
            this.props.setIntensity(this.intensity)
        }

        const context = this.context,
              canvas = this.canvas,
              trace = this.trace
    
        if (new Date().getTime() > this.nextGraphNode) {
            this.nextGraphNode = new Date().getTime() + this.props.graphUpdatePeriod;
    
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = '#4d4d4d';
            context.fillRect(0, 0, canvas.width, canvas.height);

            const length = this.props.buffer.head

            if(length === 0) return
            const iter = this.props.buffer.makeIterator(0, 0, length)
    
            const normTrace = []
            let res = iter.next()
            while(!res.done) {
                const [index, value] = res.value

                if(index !== 0) {

                    const normX = index * ((this.canvas.width - 50) / length) + 20
                    let normY

                    if (this.intensity > this.maxTrace) {
                        normY = ((canvas.height/2) - ((value-(this.intensity-5)) * ((canvas.height-40)/10)));
                        this.lastModifier = (this.intensity-5);
                        this.maxTrace = this.intensity;
                        this.minTrace = this.intensity-10;
                    } else if (this.intensity < this.minTrace) {
                        normY = (canvas.height/2) - ((value-(this.intensity+5)) * ((canvas.height-40)/10));
                        this.lastModifier = (this.intensity+5);
                        this.minTrace = this.intensity;
                        this.maxTrace = this.intensity+10;
                    } else {
                        normY = (canvas.height/2) - ((value-this.lastModifier) * ((canvas.height-40)/10));
                    }
                
                    normTrace.push({
                        x: normX,
                        y: normY
                    })
                }
                res = iter.next()
            }

    
            // Sytle setup
            context.lineCap = "round";
            context.strokeStyle = '#86a3c6';
            context.lineWidth = 4;
    
            bzCurve(context, normTrace, 1, 0);
    
            // Annotation cursor
            context.beginPath();
            context.arc(normTrace[normTrace.length-1].x, normTrace[normTrace.length-1].y, 10, 0, 2 * Math.PI, false);
            context.stroke();
        }
    }

    animateGtrace = () => {
        // Request new frame, clear canvas, and redraw background
        this.animationId = requestAnimationFrame(this.animateGtrace);

        // read the intensity value
        if(this.props.replay) {
            const [data, _] = this.props.buffer.readHead()
            if(data)
                this.requestUpdate(data[2])
        } else {
            this.props.setIntensity(this.intensity)
        }

        const context = this.context,
              canvas = this.canvas,
              trace = this.trace

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#4d4d4d';
        context.fillRect(0, 0, canvas.width, canvas.height);
    
        if (this.props.buttons.getStatus('up') || this.props.buttons.getStatus('down')) {
            this.annotationMod = this.annotationMod + (Math.pow(2, this.mod)-1);
            this.mod += 0.01;
        } else {
            this.annotationMod = 1;
            this.mod = 0;
        }

        const length = this.props.buffer.head
        // iterate with 1s step
        var drawTime = this.props.buffer.headMediatime

        // iterate over values in recerse with 1s step, for 5 second
        const iter = this.props.buffer.makeReverseIterator(length-1, length - Math.round(5*this.props.buffer.fps), 0, this.props.buffer.fps)
        
        let res = iter.next()
        while(!res.done) {
            const [index, value] = res.value

            let h = (value + 100)/2,
                s = 85 * (Math.abs(value)/100),
                l = 55 + (Math.abs(value)/10),
                t = index * this.props.buffer.fps,
                pos = (value/100)*((canvas.width/2)-40)

            var rgb = hsl2rgb(h,s,l);
            var alpha = 0;
            if (drawTime -t < 100) {
                alpha = (drawTime - t)/100;
            } else {
                alpha = clamp(0.9 - ((drawTime - t - 3000)/3000), 0, 1);
            }
            context.strokeStyle = 'rgba('+ rgb[0] +','+ rgb[1] +','+ rgb[2] +','+alpha+')';
            context.lineWidth = 4;
            context.beginPath();
            context.arc(canvas.width/2 + pos, canvas.height/2, 30*alpha, 0, 2 * Math.PI, false);
            context.stroke();
            
            res = iter.next()
        }
    
        // Current annotation cursor
        const hue = (this.intensity + 100)/2;
        const saturation = 85 * (Math.abs(this.intensity)/100);
        const lightness = 55 + (Math.abs(this.intensity)/10);
        context.strokeStyle = 'hsl('+ hue +','+ saturation +'%,'+ lightness +'%)';
        context.lineWidth = 10;
        context.beginPath();
        const xPos = (this.intensity/100)*((canvas.width/2)-40);
        context.arc(canvas.width/2 + xPos, canvas.height/2, 20, 0, 2 * Math.PI, false);
        context.stroke();
    
        // Draw bounds of the annotator over the cursor
        context.beginPath();
        context.lineWidth = 2;
        context.fillStyle = 'hsl('+ 10 +','+ 55 +'%,'+ 53 +'%)';
        context.fillRect(142, 0, 2, canvas.height);
        context.fillStyle = 'hsl('+ 30 +','+ 55 +'%,'+ 53 +'%)';
        context.fillRect(278, 0, 2, canvas.height);
        context.fillStyle = 'hsl('+ 80 +','+ 55 +'%,'+ 53 +'%)';
        context.fillRect(canvas.width-142, 0, 2, canvas.height);
        context.fillStyle = 'hsl('+ 60 +','+ 55 +'%,'+ 53 +'%)';
        context.fillRect(canvas.width-278, 0, 2, canvas.height);
        context.fillStyle = context.strokeStyle = 'hsl('+ 50 +','+ 0 +'%,'+ 50 +'%)';
        context.fillRect(canvas.width/2-1, 0, 2, canvas.height/2-34);
        context.fillRect(canvas.width/2-1, canvas.height/2+34, 2, canvas.height/2-34);
        context.arc(canvas.width/2, canvas.height/2, 34, 0, 2 * Math.PI, false);    
        context.stroke();
        context.beginPath();
        context.strokeStyle = 'hsl('+ 0 +','+ 85 +'%,'+ 53 +'%)';
        context.arc(40, canvas.height/2, 34, Math.PI/2, Math.PI + (Math.PI * 1) / 2, false);
        context.stroke();
        context.beginPath();
        context.strokeStyle = 'hsl('+ 100 +','+ 85 +'%,'+ 53 +'%)';
        context.arc(canvas.width - 40, canvas.height/2, 34, Math.PI/2, Math.PI + (Math.PI * 1) / 2, true);
        context.stroke();
    }

    render() {
        return <Container>
            <Canvas ref={e=>{this.canvas = e; if(e) this.context=e.getContext('2d')}} width={810} height={150} />
        </Container>
    }
}

const Container = styled.div`
    position: relative;
    width: 100%;
    height: 100%;
    background-color: #2d2d2d;
    border: 5px solid #202020;
`

const Canvas = styled.canvas`
    display: block;
    position: relative;
    top: 50%;
    transform: translateY(-50%);
    margin: 0 auto;
    max-width: 100%;
    max-height: 100%;
`