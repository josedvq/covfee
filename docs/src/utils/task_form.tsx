import * as React from 'react'
import 'covfee-client/css/docs.css'
import { withTheme } from '@rjsf/core';
import { Theme as AntDTheme } from '@rjsf/antd';
import { Button, Tabs} from 'antd'
const { TabPane } = Tabs
import { ArrowUpOutlined } from '@ant-design/icons'
import { CodeBlock, LivePreviewFrame} from './utils'
import { HITVisualizer} from './hit_visualizer'
import schemata from '@schemata'

const Form = withTheme(AntDTheme)

interface Props {
    spec: TaskSpec
    schemaName: object
    uiSchema: object
    formEnabled: boolean
}

interface State {
    error: boolean
    spec: TaskSpec
    currKey: number
}

export class TaskForm extends React.Component<Props, State> {

    state: State = {
        error: false,
        spec: null,
        currKey: 0
    }

    static defaultProps = {
        formEnabled: false
    }

    schema: any
    formData: any
    originalSpec: TaskSpec = null
    taskSpecElem = React.createRef<HTMLPreElement>()

    constructor(props: Props) {
        super(props)
        this.formData = props.spec
        this.state = {
            ...this.state,
            spec: props.spec,
        }
        this.originalSpec = props.spec
        this.schema = schemata['definitions'][this.props.schemaName]
    }


    handleUpdatePreview: React.MouseEventHandler<HTMLDivElement> = (e) => {
        e.currentTarget.blur()
        this.setState({
            currKey: this.state.currKey + 1,
            spec: {...this.formData}
        })
    }

    handleFormChange = (data) => {
        this.formData = {...data['formData']}
    }

    handleFormError = (err) => {
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

        return <>
            
            <LivePreviewFrame>
                <HITVisualizer hit={hitProps} key={this.state.currKey}></HITVisualizer>
            </LivePreviewFrame>

            <div style={{margin: '1em auto', textAlign: 'center'}}>
                <Button onClick={this.handleUpdatePreview} type="primary" shape="round" icon={<ArrowUpOutlined />} size={'large'}>UPDATE PREVIEW</Button>
            </div>

            <Tabs type="card">
                <TabPane tab="Form" key="1">
                    <Form schema={this.schema}
                        uiSchema={this.props.uiSchema}
                        children={true}
                        formData={this.state.spec}
                        onChange={this.handleFormChange}
                        onError={this.handleFormError} />
                </TabPane>
                <TabPane tab="JSON" key="2">
                    <CodeBlock code={this.state.spec}/>
                </TabPane>
            </Tabs>
        </>
    }
}
