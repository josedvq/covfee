import * as React from 'react'
import { Button, Input, Modal, Select, Form, Typography } from 'antd'
const { Option } = Select
const { Text } = Typography

import { PresetsSpec, TaskSpec, TaskType, EditableTaskFields} from '@covfee-types/task'

interface Props {
    visible: boolean
    /**
     * True if the editor should be for a newly created task
     */
    new: boolean
    /**
     * Spec of the types of tasks that can be created
     */
    presets: PresetsSpec
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
                presets={{enabled: true, presets:this.props.presets}}
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
    presets: {
        enabled : boolean,
        presets: PresetsSpec
    },
    task: EditableTaskFields
    onChange: (arg0: any) => void
}

interface FormState {
    preset: string,
}
class TaskEditorForm extends React.Component<FormProps, FormState> {

    componentDidMount() {
        if (this.props.task === undefined) { 
            // empty task, set default settings
            this.props.onChange({
                name: '',
                type: this.props.presets.enabled ? Object.values(this.props.presets.presets)[0].type : ''
            })
        }
        if(this.props.presets.enabled) {
            this.setState({ preset: Object.keys(this.props.presets.presets)[0] })
        }
    }

    handlePresetChange = (value: string) => {
        this.setState({ preset: value })
        this.props.onChange({
            type: Object.values(this.props.presets.presets)[0].type
        })
    }

    handleTypeChange = (value: string) => {
        this.props.onChange({ type: value })
    }

    handleNameChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        this.props.onChange({ name: e.target.value })
    }

    render() {
        if(this.props.task === undefined) return <></>

        let presetSelect = <></>
        let typeSelect = <></>
        
        if (this.props.presets.enabled) {
            presetSelect = <Form.Item label="Preset">
                <Select value={this.state.preset} style={{ width: 120 }} onChange={this.handlePresetChange} >
                    {Object.entries(this.props.presets.presets).map(([key, value], i) => {
                        return <Option key={key} value={key}>{key}</Option>
                    })}
                </Select>
            </Form.Item>
        }

        typeSelect = <Form.Item label="Type">
            <Select value={this.props.task.spec.type} style={{ width: 120 }} onChange={this.handleTypeChange} disabled>
                <Option key={0} value={this.props.task.spec.type}>{this.props.task.spec.type}</Option>
            </Select>
        </Form.Item>

        return <>
            {presetSelect}

            {typeSelect}

            <Form.Item label="Name">
                <Input value={this.props.task.name} onChange={this.handleNameChange} />
            </Form.Item>
        </> 
    }
}