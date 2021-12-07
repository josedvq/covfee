import * as React from 'react'
import 'covfee-client/css/docs.css'
import TaskSpec from '@covfee-types/task'
import Form from '@rjsf/core'
// import { withTheme } from '@rjsf/core';
// import { Theme as AntDTheme } from '@rjsf/antd';
import { Button, Tabs} from 'antd'
import { ArrowUpOutlined } from '@ant-design/icons'
import { CodeBlock, LivePreviewFrame, arrayUnique} from './utils'
import { HITVisualizer} from './hit_visualizer'
import {Validator} from 'covfee-shared/validator'
import schemata from '@schemata'
import AceEditor from 'react-ace'

import 'antd/dist/antd.css'
import 'ace-builds/src-noconflict/mode-json'
import 'ace-builds/src-noconflict/theme-github'

// const Form = withTheme(AntDTheme)

interface Props {
    spec: TaskSpec
    schemaName: object
    uiSchema: object
    formEnabled: boolean
}

interface State {
    error: boolean
    spec: TaskSpec
    formData: TaskSpec
    currKey: number
}

export class TaskForm extends React.Component<Props, State> {

    state: State = {
        error: false,
        spec: null,
        formData: null,
        currKey: 0
    }

    static defaultProps = {
        formEnabled: false
    }

    validator: any
    schema: any
    formData: any
    originalSpec: TaskSpec = null
    taskSpecElem = React.createRef<HTMLPreElement>()

    constructor(props: Props) {
        super(props)
        this.state = {
            ...this.state,
            formData: props.spec,
            spec: props.spec,
        }
        this.originalSpec = props.spec
        this.schema = {
            ...schemata,
            ...schemata['definitions'][this.props.schemaName]
        } 
        this.validator = new Validator(schemata)
    }


    handleUpdatePreview: React.MouseEventHandler<HTMLDivElement> = (e) => {
        e.currentTarget.blur()
        this.setState({
            currKey: this.state.currKey + 1,
            spec: {...this.state.formData}
        })
    }

    handleFormChange = (data) => {
        this.setState({
            formData: {...data['formData']}
        })
    }

    render() {
        const hitProps = {
            id: 'test',
            name: 'Example',
            type: 'annotation',
            tasks: [
                {
                    name: this.state.spec.name,
                    type: this.state.spec.type,
                    spec: this.state.spec
                }
            ]
        }

        const uiSchema = {
            ...this.props.uiSchema,
            'ui:order': arrayUnique(this.props.uiSchema['ui:order'].concat(['type', 'instructions', 'autoSubmit', 'prerequisite', 'children', 'maxSubmissions', 'timer'])),
            'type': {'ui:widget':'hidden'},
            'prerequisite': {'ui:widget':'hidden'},
            'autoSubmit': {'ui:widget': 'hidden'},
            'children': {'ui:widget': 'hidden'},
            'maxSubmissions': {'ui:widget': 'hidden'},
            'timer': {'ui:widget': 'hidden'}
        }

        return <>
            <LivePreviewFrame>
                <HITVisualizer hit={hitProps} key={this.state.currKey}></HITVisualizer>
            </LivePreviewFrame>

            <div style={{margin: '1em auto', textAlign: 'center'}}>
                <Button onClick={this.handleUpdatePreview} type="primary" shape="round" icon={<ArrowUpOutlined />} size={'large'}>UPDATE PREVIEW</Button>
            </div>

            <Tabs type="card">
            <AceEditor
                // props: https://github.com/securingsincity/react-ace/blob/master/docs/Ace.md
                width={'100%'}
                maxLines={Infinity}
                wrapEnabled={true}
                value={JSON.stringify(this.state.formData, null, 2)}
                showPrintMargin={true}
                showGutter={true}
                highlightActiveLine={true}
                mode="json"
                theme="github"
                fontSize={16}
                onChange={null}
                name="UNIQUE_ID_OF_DIV"
                editorProps={{ $blockScrolling: true }}
                setOptions={{
                    useWorker: false
                  }}/>
                {/* <SyntaxHighlighter language="javascript" style={docco}>
                    {JSON.stringify(this.state.formData, null, 2)}
                </SyntaxHighlighter> */}
                {/* <TabPane tab="Form" key="1">
                    <Form schema={this.schema}
                        uiSchema={uiSchema}
                        children={true}
                        formData={this.state.formData}
                        onChange={this.handleFormChange}
                        onError={this.handleFormError} />
                </TabPane>
                <TabPane tab="JSON" key="2">
                    <CodeBlock code={this.state.formData} validate={true}/>
                </TabPane> */}
            </Tabs>
        </>
    }
}
