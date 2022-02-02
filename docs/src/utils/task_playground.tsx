import * as React from 'react'
import 'covfee-client/css/docs.css'
import TaskSpec from '@covfee-types/task'
import { Alert, Button, Popover, Tabs} from 'antd'
import { AlignLeftOutlined, ArrowUpOutlined, CopyOutlined, FormOutlined, UndoOutlined } from '@ant-design/icons'
import {CopyToClipboard} from 'react-copy-to-clipboard'
import { CodeBlock, LivePreviewFrame, arrayUnique} from './utils'
import { HITVisualizer} from './hit_visualizer'
import {Validator} from 'covfee-shared/validator'
import schemata from '@schemata'
import BrowserOnly from '@docusaurus/BrowserOnly'
import { withTheme } from '@rjsf/core'
import {theme} from './rjsf_theme'

import 'antd/dist/antd.css'



const ThemedForm = withTheme(theme)

type EditorType = 'ace' | 'rjsf'

interface Props {
    height: number,
    tasks: Array<{
        schema: string
        label: string
        spec: TaskSpec
    }>
    defaultEditor: EditorType,
    schemaName: object
    uiSchema: object
    formEnabled: boolean
}

interface State {
    specs: TaskSpec[]
    currSpec: any // holds the form values
    currSpecString: any // holds the text spec
    currTask: number
    currKey: number
    valid: boolean
    error: string
    errorVisible: boolean
    editor: EditorType
}

export class TaskPlayground extends React.Component<Props, State> {

    state: State = {
        specs: [],
        currSpec: null,
        currSpecString: null,
        currTask: 0,
        currKey: 0,
        valid: true,
        error: null,
        errorVisible: false,
        editor: 'ace'
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
            editor: props.defaultEditor,
            specs: props.tasks.map(t=>t.spec),
            currSpec: props.tasks[0].spec,
            currSpecString: JSON.stringify(props.tasks[0].spec, null, 2)
        }
        this.validator = new Validator(schemata)
    }

    componentDidMount(): void {
        this.handleFormChange(this.state.currSpecString)
    }

    handleUpdatePreview: React.MouseEventHandler<HTMLDivElement> = (e) => {
        e.currentTarget.blur()
        // validate using the schemata
        
        if(this.state.valid) {
            const spec = this.state.currSpec
            this.setState({
                currKey: this.state.currKey + 1,
                specs: this.state.specs.map((el, idx) => (idx === this.state.currTask ? spec : el)),
            })
        } else {
            this.setState({errorVisible: true})
        }
    }

    handleEditorChange = (e) => {
        this.setState({
            valid: true,
            error: null,
            currSpec: e.formData
        })
    }

    handleFormChange = (data) => {
        let json
        try {
            json = JSON.parse(data)
        } catch (error) {
            return this.setState({
                valid: false,
                error: error.toString(),
                currSpecString: data
            })
        }

        this.setState({
            currSpec: json,
            currSpecString: data
        }, () =>{ 
            this.updateValidation()
        })

        
    }

    updateValidation = () => {
        const {valid, errors} = this.validator.validate_schema(this.props.tasks[this.state.currTask].schema, this.state.currSpec)
        this.setState({
            valid: valid,
            error: valid ? null : `In ${errors[0].friendlyPath}:\n ${errors[0].friendlyMessage}`
        })
    }

    handleSwitchTask = (idx: number) => {
        this.setState({
            currTask: idx,
            currKey: this.state.currKey + 1,
            currSpec: this.state.specs[idx],
            currSpecString: JSON.stringify(this.state.specs[idx], null, 2),
        }, ()=>{ this.updateValidation() })
    }

    toggleEditor = () => {
        if(this.state.editor == 'rjsf')
            this.setState({
                currSpecString: JSON.stringify(this.state.currSpec, null, 2),
                editor: 'ace'
            })
        else
            this.setState({
                currSpec: JSON.parse(this.state.currSpecString),
                editor: 'rjsf'
            })
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
                    <Button type="text" size={'middle'} icon={<UndoOutlined />} onClick={this.handleReset}>reset</Button>
                    {this.state.valid ? 
                        <Button type="text" size={'middle'} icon={<ArrowUpOutlined />} onClick={this.handleUpdatePreview}>update preview</Button>:
                        <Popover placement="bottomLeft" content={<div style={{maxWidth: '400px'}}>{this.state.error}</div>}>
                            <Button type="primary" size={'middle'} onClick={this.handleUpdatePreview} danger>Errors</Button>
                        </Popover>
                    }
                    <Button type='text' size={'middle'} icon={(this.state.editor === 'rjsf') ? <AlignLeftOutlined /> : <FormOutlined />} onClick={this.toggleEditor}>{this.state.editor === 'rjsf' ? 'Text Editor' : 'Form Editor'}</Button>
                    <CopyToClipboard text={this.state.currSpecString}><Button type="text" size={'middle'} icon={<CopyOutlined />}>copy</Button></CopyToClipboard>
                </nav>

                <BrowserOnly fallback={<div>The fallback content to display on prerendering</div>}>
                {()=>{
                    const AceEditor = require('react-ace').default
                    require('ace-builds/src-noconflict/mode-json')
                    require('ace-builds/src-noconflict/theme-github')

                    

                    if(this.state.editor === 'rjsf') {
                        const currSchema = this.validator.get_deref_schema(this.props.tasks[0].schema) 
                        delete currSchema.properties['children']
                        currSchema['$schema'] = schemata['$schema']
                        // currSchema['definitions'] = schemata['definitions']
                        return <ThemedForm 
                            schema={currSchema} 
                            formData={this.state.currSpec} 
                            onChange={this.handleEditorChange} 
                            uiSchema={{
                                'ui:order':['type', 'id', 'name', 'required', 'prerequisite', 'autoSubmit', 'maxSubmissions', '*'],
                                'id': {'ui:widget': 'hidden'},
                                'media': {
                                    'ui:order': ['type', '*']
                                }}
                            }
                            children={true}
                        />

                    } else {
                        return <AceEditor
                            width={'100%'}
                            maxLines={Infinity}
                            wrapEnabled={true}
                            value={this.state.currSpecString}
                            showPrintMargin={true}
                            showGutter={true}
                            highlightActiveLine={true}
                            mode="json"
                            theme="github"
                            fontSize={16}
                            onChange={this.handleFormChange}
                            editorProps={{ $blockScrolling: true }}
                            setOptions={{
                                useWorker: false
                            }}/>
                    }
                }}
                </BrowserOnly>
            </div>
        </>
    }
}

