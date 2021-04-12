import * as React from 'react'
import {
    Typography,
    Button,
    Modal,
    Popover,
} from 'antd';
import classNames from 'classnames'

import Constants from 'Constants'
import { myerror, fetcher, throwBadResponse } from '../utils'
import { getTaskClass } from '../task_utils'
import { TaskResponse, TaskType } from '@covfee-types/task'
import {CircularDataCaptureBuffer} from '../buffers/circular_dc_buffer'
import { DataCaptureBuffer, DataPlaybackBuffer } from '../buffers/buffer';
import { SimplePlaybackBuffer } from '../buffers/playback_buffer';
import { TaskOverlay } from './overlay';
import KeyboardManagerContext from '../input/keyboard_manager';
import { QuestionCircleOutlined } from '@ant-design/icons';

interface State {
    status: 'loading' | 'initready' | 'annotready' | 'annotstarted' | 'annotended' | 'annotsubmitted' | 'replayready' | 'replaystarted' | 'replayended'
    /**
     * Replay options
     */
    replay: {
        dataIndex: number
        enabled: boolean
    },
    /**
     * State of the error modal 
     */
    errorModal: {
        visible: boolean
        message?: string
        loading?: boolean
    },
    /**
     * State of the overlay shown at the end of tasks
     */
    overlay: {
        visible: boolean
        submitting?: boolean
    }
}

interface Props {
    task: TaskType
    url: string,
    previewMode: boolean
    onSubmit: ()=>void
}

export class TaskLoader extends React.Component<Props, State> {

    response: TaskResponse
    captureBuffer: DataCaptureBuffer
    visualizationBuffer: DataPlaybackBuffer
    taskClass: any
    taskElement:any = null

    state: State = {
        status: 'loading',
        replay: {
            enabled: false,
            dataIndex: 0
        },
        errorModal: {visible: false},
        overlay: {visible: false}
    }

    constructor(props: Props) {
        super(props)
        this.taskClass = getTaskClass(this.props.task.spec.type)
    }

    componentDidMount = () => {
        // if the task has previous responses, query them
        if (this.props.task.num_submissions > 0) {
            this.fetchTaskResponse()
        } else {
            // no previous responses, prepare task
            this.loadTaskForAnnotation()
        }
    }

    fetchTaskResponse = () => {
        const url = this.props.url +'/responses?' + new URLSearchParams({
        })
        fetcher(url)
            .then(throwBadResponse)
            .then((data: TaskResponse) => {
                this.response = data
                this.setState({
                    status: 'initready',
                })
            }).catch(error => {
                myerror('Error fetching task response.', error)
            })
    }

    startDataCapture = async (dummy: boolean = false) => {
        this.captureBuffer = new CircularDataCaptureBuffer(
            200, // chunkLength
            8, //numChunks
            this.props.url + '/chunk',
            this.handleBufferError,
            dummy)

        return Promise.resolve()
    }

    startPlaybackBuffer = async (dummy: boolean = false) => {
        const url = Constants.api_url + '/responses/' + this.response.id + '/chunks'
        this.visualizationBuffer = new SimplePlaybackBuffer(
            url,
            this.handleBufferError)
        return this.visualizationBuffer._load()
    }

    loadTaskForAnnotation = () => {
        this.setState({status: 'loading'}, async ()=>{
            if (this.taskClass.taskInfo.continuous) {
                await this.startDataCapture(this.props.previewMode)
                await this.startPlaybackBuffer(true) // dummy playback buffer
            }
            this.setState({
                status: 'annotready',
            })
        })
    }

    // Overlay actions
    loadTaskForReplay = () => {
        this.setState({ status: 'loading' }, async () => {
            await this.startDataCapture(true) // dummy DC buffer
            await this.startPlaybackBuffer()
            this.setState({
                status: 'replayready',
            })
        })
    }

    submitTask = (taskResult: any) => {
        if (this.props.previewMode) {
            return this.props.onSubmit()
        }

        let sendResult = () => {
            const url = this.props.url + '/submit?' + new URLSearchParams({
            })

            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskResult)
            }

            // now send the task results
            return fetch(url, requestOptions)
        }

        this.captureBuffer.flush()
            .then(sendResult)
            .then(throwBadResponse)
            .then((data) => {
                this.response = data
                this.setState({
                    status: 'annotsubmitted'
                })
                this.props.onSubmit()
            }).catch((error) => {
                myerror('Error submitting the task.', error)
                this.setState({
                    status: 'annotended'
                })
            })

    }

    handleTaskEnd = () => {
        if (!['annotready', 'replayready'].includes(this.state.status))
            console.error(`onEnd called in invalid state ${this.state.status}.`)
        this.setState({
            status: this.state.status === 'annotready' ? 'annotended' : 'replayended'
        })
    }

    handleTimerEnd = () => {
        if (!['annotready', 'replayready'].includes(this.state.status))
            console.error(`timer ended in invalid state ${this.state.status}.`)
        this.setState({
            status: this.state.status === 'annotready' ? 'annotended' : 'replayended'
        })
    }

    handleClickSubmit = () => {

    }

    /**
     * HANDLING OF BUFFER ERRORS
     */

    handleBufferError = (msg: string) => {
        this.setState({
            errorModal: {
                ...this.state.errorModal,
                visible: true,
                message: msg
            }
        })
    }

    handleErrorOk = () => {
        const modalMessage = 'Attempting to submit. The window will be closed if successful.'
        this.setState({
            errorModal: {
                visible: true,
                message: modalMessage,
                loading: true
            }
        })

        this.captureBuffer.flush(5000)
        .then(() => {
            this.setState({ errorModal: { ...this.state.errorModal, visible: false, loading: false } })
        }).catch(() => {
            this.setState({
                errorModal: {
                    visible: true,
                    message: modalMessage + ' Unable to send the data. Please communicate with the organizers if the problems persist.',
                    loading: false
                }
            })
        })
    }

    handleErrorCancel = () => {
        this.setState({
            errorModal: {
                ...this.state.errorModal,
                visible: false
            }
        })
    }

    renderErrorModal = () => {
        return <Modal
            title="Error"
            visible={this.state.errorModal.visible}
            confirmLoading={this.state.errorModal.loading}
            onOk={this.handleErrorOk}
            onCancel={this.handleErrorCancel}
            cancelButtonProps={{ disabled: true }}
            okButtonProps={{}}
        >
            <p>{this.state.errorModal.message}</p>
        </Modal>
    }

    getOverlayInitTimedTask = () => {
        return {
            title: 'This is a timed task!',
            subtext: 'Make sure to set up and be ready before you hit "Start". Once you do you will not be able to stop the countdown.',
            mainOptions: [
                <Button
                    type="primary"
                    onClick={this.handleStartTimeTask}
                >Start</Button>
            ]
        }
    }

    /**
     * Uset must be able to:
     * - Redo the task if num_submissions < maxSubmissions
     * - Keep replaying the task indefinitely
     */
    getOverlayAfterReplayOrStop = () => {
        return {
            title: 'Replay finished',
            mainOptions:[
                <Button danger
                    type="primary"
                    onClick={this.loadTaskForAnnotation}
                    disabled={this.props.task.num_submissions >= this.props.task.maxSubmissions}
                    >Restart Task</Button>,

                <Button
                    type="primary"
                    onClick={this.loadTaskForReplay}
                    loading={this.state.overlay.submitting}
                    >Watch again</Button>
            ]
        }
    }

    /**
     * User must be able to:
     * - discard and re-do
     * - submit
     * - discard and replay last submission
     */
    getOverlayNonSubmittedTask = () => {
        return {
            title: 'Done!',
            mainOptions: [
                <Button danger
                    type="primary"
                    onClick={this.loadTaskForAnnotation}
                    disabled={this.props.task.num_submissions >= this.props.task.maxSubmissions}
                    >Discard &amp; Restart</Button>,

                <Button
                    type="primary"
                    onClick={this.submitTask}
                    loading={this.state.overlay.submitting}
                    >Submit</Button>
            ],
            secondaryOptions: [
                this.props.task.num_submissions > 0 &&
                <Button danger
                    type="text"
                    onClick={this.loadTaskForReplay}
                >Discard and replay last submission</Button>
            ]
        }
    }

    /**
     * User must be able to:
     * - Restart the task if num_submissions < maxSubmissions
     * - Replay the submitted task
     * - Go to the next task
     */
    getOverlaySubmittedTask = () => {
        return {
            title: 'Your task is submitted!',
            mainOptions: [
                <Button danger
                    type="primary"
                    onClick={this.loadTaskForAnnotation}
                    disabled={this.props.task.num_submissions >= this.props.task.maxSubmissions}
                    >Submit again</Button>,

                <Button
                    type="default"
                    onClick={this.loadTaskForReplay}
                    loading={this.state.overlay.submitting}
                    >Replay submission</Button>
            ]
        }
    }

    renderOverlay = () => {
        if(this.state.status === 'initready') {
            if(this.props.task.num_submissions > 0)
                return <TaskOverlay visible={true} {...this.getOverlaySubmittedTask()} />
            if (this.props.task.timer)
                return <TaskOverlay visible={true} {...this.getOverlayInitTimedTask()} />
        } else if (this.state.status === 'annotended') {
            return <TaskOverlay visible={true} {...this.getOverlayNonSubmittedTask()}/>
        } else if (this.state.status === 'replayended') {
            return <TaskOverlay visible={true} {...this.getOverlayAfterReplayOrStop()} />
        } else if (this.state.status === 'annotsubmitted') {
            return <TaskOverlay visible={true} {...this.getOverlaySubmittedTask()} />
        }
        return <></>
    }

    createTaskRef = (element:any) => {
        this.taskElement = element
        this.setState(this.state) // triger re-render
    }

    renderTaskInfo = () => {
        return this.taskElement && <Popover
                    placement="bottom"
                    content={()=>{
                        return this.taskElement.instructions()
                    }}
                    trigger="click">
            <div className="task-instructions-button">
                <QuestionCircleOutlined/> Instructions
            </div>
        </Popover>
    }

    render() {

        const task = React.createElement(this.taskClass, {
            // task props
            ref: this.createTaskRef,
            spec: this.props.task.spec,

            // base task props
            onSubmit: this.submitTask,
            visualizationModeOn: ['replayready', 'replaystarted'].includes(this.state.status),
            visualizationData: {},

            // Continuous task props
            buffer: this.captureBuffer,
            onEnd: this.handleTaskEnd,
            visualizationBuffer: this.visualizationBuffer,
        }, null)

        return <>
            {this.renderOverlay()}
            {this.renderErrorModal()}
            {this.renderTaskInfo()}
            <div className={classNames('task-container')}>
                
                <KeyboardManagerContext>
                    {task}
                </KeyboardManagerContext>
            </div>
        </>
    }
}