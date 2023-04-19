import * as React from 'react'
import { Button, Input, Modal, Select, Form, Typography, Alert } from 'antd'
const { Option } = Select
const { Text } = Typography

import { EditableTaskFields, TaskSpec} from '@covfee-shared/spec/task'

interface Props {
    visible: boolean
    /**
     * True if the editor should be for a newly created task
     */
    new: boolean
    /**
     * Spec of the types of tasks that can be created
     */
    presets: { [key: string]: TaskSpec }
    /**
     * Initial content to be edited
     */
    task: EditableTaskFields,
    onSubmit: (arg0: EditableTaskFields) => Promise<void>
    onDelete: () => Promise<void>
    onClose: () => void
}

interface State {
    task: EditableTaskFields
    loading: boolean
    pressedDelete: boolean
    /**
     * Triggers re-mounting of the form
     */
    formKey: number
}

export class TaskEditorModal extends React.Component<Props, State> {

    state: any = {
        task: undefined,
        loading: false,
        pressedDelete: false,
        formKey: 0
    }

    componentDidMount() {
        this.resetForm()
    }

    resetForm = () => {
        this.setState({
            task: this.props.new ? undefined : this.props.task,
            loading: false,
            pressedDelete: false,
            formKey: this.state.formKey + 1
        })
    }

    componentDidUpdate(prevProps: Props) {
        if (this.props.visible == prevProps.visible) return

        if (!this.props.visible) return

        // re-initialize the state when the component is shown
        this.resetForm()
    }

    handleSubmit = () => {
        this.props.onSubmit(this.state.task).then(() => {
            this.props.onClose()
        })
    }

    handleChange = (task: EditableTaskFields) => {
        this.setState({
            task: {
                ...this.state.task,
                ...task
            }
        })
    }

    handleDelete = () => {
        this.props.onDelete().then(() => {
            this.props.onClose()
        })
    }

    handleDeleteClick: React.MouseEventHandler<HTMLElement> = e => {
        this.setState({
            pressedDelete: true
        })
    }

    render() {
        let deletePrompt = <></>
        if (!this.props.new) {
            if (!this.state.pressedDelete) {
                deletePrompt = <Button danger type="primary" onClick={this.handleDeleteClick}>Delete</Button>
            } else {
                deletePrompt = <>
                    <Text type="danger">All annotations submitted for this task may be lost. Are you sure you want to delete?</Text><br />
                    <Button danger type="primary" onClick={this.handleDelete}>Delete</Button>
                    <Button type="default" onClick={() => { this.setState({ pressedDelete: false }) }}>Cancel</Button>
                </>
            }
        }

        return <Modal
            visible={this.props.visible}
            title="Create new task"
            onOk={this.handleSubmit}
            onCancel={this.props.onClose}
            footer={[
                <Button key="back" onClick={this.props.onClose}>
                    Cancel
                </Button>,
                <Button key="submit" type="primary" loading={this.state.loading} onClick={this.handleSubmit}>
                    Submit
                </Button>
            ]}>
            <TaskEditorForm
                key={this.state.formKey}
                presets={this.props.presets}
                task={this.state.task}
                onChange={this.handleChange}/>
            
            {deletePrompt}

        </Modal>
    }
}

/**
 * Allows the user to edit some fields of a task specification.
 * Receives an optional set of presets that the user can pick from
 */
interface FormProps {
    presets: { [key: string]: TaskSpec }
    task: EditableTaskFields
    onChange: (arg0: any) => void
}

interface FormState {
    error: string
    preset: string,
}
class TaskEditorForm extends React.Component<FormProps, FormState> {

    state: FormState = {
        error: null,
        preset: ''
    }

    constructor(props: FormProps) {
        super(props)
        if(props.task === undefined && !props.presets)
            this.state.error = 'Task or presets must be given.'

        if (props.task === undefined) {
            props.onChange(Object.values(this.props.presets)[0])
            this.state.preset = Object.keys(this.props.presets)[0]
        }
    }

    componentDidMount() {
    }

    handlePresetChange = (value: string) => {
        this.setState({ preset: value })
        this.props.onChange(this.props.presets[value])
    }

    handleNameChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        this.props.onChange({ name: e.target.value })
    }

    render() {
        if(this.props.task === undefined) return null

        if(this.state.error)
            return <Alert message={this.state.error} type="error"/>

        return <>
            {this.props.presets &&
            <Form.Item label="Preset">
                <Select value={this.state.preset} style={{ width: 120 }} onChange={this.handlePresetChange} >
                    {Object.entries(this.props.presets).map(([key, _]) => {
                        return <Option key={key} value={key}>{key}</Option>
                    })}
                </Select>
            </Form.Item>}

            <Form.Item label="Type">
                <Select value={this.props.task.type} style={{ width: 120 }} disabled>
                    <Option key={0} value={this.props.task.type}>{this.props.task.type}</Option>
                </Select>
            </Form.Item>

            <Form.Item label="Name">
                <Input value={this.props.task.name} onChange={this.handleNameChange} />
            </Form.Item>
        </> 
    }
}