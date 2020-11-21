import * as React from 'react'
import {
    Row,
    Col,
    Button,
    Alert
} from 'antd'
import VideojsPlayer from '../players/videojs'
import WaveSurferBasicPlayer from '../players/wavesurfer_basic'
import {Form} from '../input/form'
import { BaseTaskProps } from './task'

interface Props extends BaseTaskProps {
    /**
     * Specification of the form to be created.
     */
   form: object
   /**
    * If true, the form will only become active after the media playback ends
    */
    disabledUntilEnd?: boolean
}

class QuestionnaireTask extends React.Component<Props> {

    private player = React.createRef()
    public state = {
        media: {
            paused: true
        },
        form: {
            values: [[]],
            completed: false,
            disabled: true
        }
    }

    static defaultProps = {
        disabledUntilEnd: false
    }

    constructor(props: Props) {
        super(props)
        this.state.form.disabled = props.disabledUntilEnd
    }

    handleChange = (values: object) => {
        const has_null = values[0].some((val) => {
            return val === null
        })

        this.setState({
            form: {
                ...this.state.form,
                values: values,
                completed: !has_null
            }
        })
    }

    handleMediaEnded = () => {
        this.setState({
            form: {
                ...this.state.form,
                disabled: false
            }
        })
    }

    handleSubmit = () => {
        this.props.onSubmit(this.state.form.values)
    }

    render() {
        // instructions
        let instructions = <></>
        if(this.props.instructions) {
            instructions = <Row gutter={16}>
                <Col span={24} style={{padding: '2em'}}>
                    <Alert type="info" message={'Instructions'} description={this.props.instructions} showIcon/>
                </Col>
            </Row>
        }

        // media
        let media
        switch(this.props.media.type) {
            case 'video':
                media = <VideojsPlayer {...this.props.media} onEnded={this.handleMediaEnded} />
                break
            case 'audio':
                media = <WaveSurferBasicPlayer 
                            {...this.props.media} 
                            paused={this.state.media.paused} 
                            onEnded={this.handleMediaEnded}/>
                break
            default:
                media = <p>Unrecognized media type.</p>
        }
        return <>
            {instructions}
            <Row gutter={16}>
                <Col span={16}>
                    {media}
                </Col>
                <Col span={8}>
                    <Form {...this.props.form}
                        key={this.props.form}
                        values={this.state.form.values} 
                        disabled={this.state.form.disabled} 
                        setValues={this.handleChange}></Form>
                    <Button disabled={!this.state.form.completed} onClick={this.handleSubmit}>Next</Button>
                </Col>
            </Row>
        </>
    }
}

export default QuestionnaireTask