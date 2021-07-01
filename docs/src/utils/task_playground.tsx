import * as React from 'react'
import 'covfee-client/css/docs.css'
import TaskSpec from '@covfee-types/task'
import { Alert, Button, Popover, Tabs} from 'antd'
import { ArrowUpOutlined } from '@ant-design/icons'
import { CodeBlock, LivePreviewFrame, arrayUnique} from './utils'
import { HITVisualizer} from './hit_visualizer'
import {Validator} from 'covfee-shared/validator'
import schemata from '@schemata'
import AceEditor from 'react-ace'

import 'antd/dist/antd.css'
import 'ace-builds/src-noconflict/mode-json'
import 'ace-builds/src-noconflict/theme-github'


interface Props {
    tasks: Array<{
        schema: string
        label: string
        spec: TaskSpec
    }>
    schemaName: object
    uiSchema: object
    formEnabled: boolean
}

interface State {
    specs: TaskSpec[]
    currSpec: string // holds the form content
    currTask: number
    currKey: number
    valid: boolean
    error: string
    errorVisible: boolean
}

export class TaskPlayground extends React.Component<Props, State> {

    state: State = {
        specs: [],
        currSpec: null,
        currTask: 0,
        currKey: 0,
        valid: true,
        error: null,
        errorVisible: false
    }

    static defaultProps = {
        formEnabled: false
    }

    validator: any
    taskSpecElem = React.createRef<HTMLPreElement>()

    constructor(props: Props) {
        super(props)
        this.state = {
            ...this.state,
            specs: props.tasks.map(t=>t.spec),
            currSpec: JSON.stringify(props.tasks[0].spec, null, 2)
        }
        this.validator = new Validator(schemata)
    }

    handleUpdatePreview: React.MouseEventHandler<HTMLDivElement> = (e) => {
        e.currentTarget.blur()
        // validate using the schemata
        
        if(this.state.valid) {
            const spec = JSON.parse(this.state.currSpec)
            this.setState({
                currKey: this.state.currKey + 1,
                specs: this.state.specs.map((el, idx) => (idx === this.state.currTask ? spec : el)),
            })
        } else {
            this.setState({errorVisible: true})
        }
    }

    handleFormChange = (data) => {
        let json
        try {
            json = JSON.parse(data)
        } catch (error) {
            return this.setState({
                valid: false,
                error: error.toString(),
                currSpec: data
            })
        }

        const {valid, errors} = this.validator.validate_schema(this.props.tasks[this.state.currTask].schema, json)
        this.setState({
            valid: valid,
            error: valid ? null : `In ${errors[0].friendlyPath}:\n ${errors[0].friendlyMessage}`,
            currSpec: data
        })
    }

    handleSwitchTask = (idx: number) => {
        this.setState({
            currTask: idx,
            currKey: this.state.currKey + 1,
            currSpec: JSON.stringify(this.state.specs[idx], null, 2)
        }, ()=>{ this.handleFormChange(this.state.currSpec) })
        
    }

    render() {
        
        return <>
            <LivePreviewFrame>
                {(()=>{
                    const task = this.state.specs[this.state.currTask]
                    const hitProps = {
                        id: 'test',
                        name: 'Example',
                        tasks: [
                            {
                                name: task.name,
                                type: task.type,
                                spec: task
                            }
                        ]
                    }
                    return <HITVisualizer hit={hitProps} key={this.state.currKey}></HITVisualizer>
                })()}
            </LivePreviewFrame>

            <div style={{margin: '1em auto', textAlign: 'center'}}>
                {this.props.tasks.map((task, idx) => {
                    return <Button 
                                key={idx}
                                onClick={()=>{this.handleSwitchTask(idx)}} 
                                type="primary"
                                shape="round"
                                size={'middle'}
                                style={{margin: '0 5px'}}
                                disabled={idx == this.state.currTask}>{task.label}</Button>
                })}
            </div>

            <div>
                <nav>
                    <Button type="link" size={'middle'} onClick={this.handleReset}>reset</Button>
                    {this.state.valid ? 
                        <Button type="link" size={'middle'} onClick={this.handleUpdatePreview}>update preview<ArrowUpOutlined /></Button>:
                        <Popover placement="bottomLeft" content={<div style={{maxWidth: '400px'}}>{this.state.error}</div>}>
                            <Button type="primary" size={'middle'} onClick={this.handleUpdatePreview} danger>JSON errors</Button>
                        </Popover>
                    }
                    
                </nav>

                <AceEditor
                    width={'100%'}
                    maxLines={Infinity}
                    wrapEnabled={true}
                    value={this.state.currSpec}
                    showPrintMargin={true}
                    showGutter={true}
                    highlightActiveLine={true}
                    mode="json"
                    theme="github"
                    fontSize={16}
                    onChange={this.handleFormChange}
                    name="UNIQUE_ID_OF_DIV"
                    editorProps={{ $blockScrolling: true }}/>
            </div>
        </>
    }
}

