import * as React from 'react'
import {
    Button,
    Modal,
    Popover,
} from 'antd';
import classNames from 'classnames'

import Constants from 'Constants'
import { myerror, fetcher, throwBadResponse } from '../utils'
import { getTaskClass } from '../task_utils'
import { TaskResponse, TaskType } from '@covfee-types/task'
import { AnnotationBuffer } from '../buffers/buffer';
import { TaskOverlay } from './overlay';
import ButtonEventManagerContext from '../input/button_manager';
import { TaskPlayer } from './task_player';
import buttonManagerContext from '../input/button_manager_context';
import { QuestionCircleOutlined } from '@ant-design/icons';

interface State {
    /**
     * Lifecycle states of the loader
     * loading: nothing displayed yet. Querying responses to decide how to display the task
     * 
     */
    status: 'loading' | 'initready' | 'annotready' | 'replayready' | 'annotended' | 'replayended' | 'annotsubmitted'
    renderAs: string
    /**
     * Player state
     */
    player : {
        currTask: number
        replayMode: boolean
        paused: boolean
    }
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
    parent: TaskType
    previewMode: boolean
    onSubmit: ()=>void
}

export class TaskLoader extends React.Component<Props, State> {

    response: TaskResponse
    parentResponse: TaskResponse
    taskClass: any
    taskPlayer: TaskPlayer
    taskElement: React.ReactElement

    playerLoadPromise: Promise<void>
    playerLoadCallback: () => void

    endTaskResult: any = null
    endTaskBuffer: AnnotationBuffer = null
    
    state: State = {
        status: 'loading',
        renderAs: null,
        player: {
            currTask: 0,
            replayMode: false,
            paused: true
        },
        errorModal: {visible: false},
        overlay: {visible: false}
    }

    constructor(props: Props) {
        super(props)
        this.taskClass = getTaskClass(this.props.task.spec.type)
        this.playerLoadPromise = this.getPlayerLoadPromise()
        this.state.renderAs = this.getTaskRenderAs()
    }

    getTaskRenderAs = () => {
        const taskInfo = this.taskClass.taskInfo
        if (taskInfo) {
            if (taskInfo.continuous) return 'continuous-video'
        } else return 'default'
    }

    getPlayerLoadPromise = () => {
        return new Promise<void>((resolve, _) => {
            this.playerLoadCallback = () => {
                resolve()
            }
        })
    }

    componentDidMount = () => {
        // read the taks and parent responses.
        Promise.all([
            this.props.task.num_submissions > 0 && this.fetchTaskResponse(),
            this.props.parent && this.props.parent.num_submissions > 0 && this.fetchParentResponse()
        ]).then(_ => {
            this.setState({
                status: 'initready',
            })
            // load for annotation if there are no submissions
            if (this.props.task.num_submissions == 0)
                this.loadTask(true)
        })
    }

    fetchTaskResponse = () => {
        const url = this.props.task.url +'/responses?' + new URLSearchParams({
        })
        return fetcher(url)
            .then(throwBadResponse)
            .then((data: TaskResponse) => {
                this.response = data
            }).catch(error => {
                myerror('Error fetching task response.', error)
            })
    }

    fetchParentResponse = () => {
        const url = this.props.parent.url + '/responses?' + new URLSearchParams({
        })
        const p = fetcher(url)
            .then(throwBadResponse)
            .then((response: TaskResponse) => {
                this.parentResponse = response
                
            })
            
        p.catch(error => {
            myerror('Error fetching task response.', error)
        })
        return p
    }

    loadTask = (annot = true) => {
        this.setState({
            player: {
                ...this.state.player, 
                currTask: 0,
                replayMode: !annot
            }
        }, async () => {
            if (this.state.renderAs == 'continuous-video') {
                await this.taskPlayer.loadBuffers()
            }
            this.setState({status: annot ? 'annotready' : 'replayready'})
        })
    }

    loadTaskForAnnotation = () => { this.loadTask(true)}
    loadTaskForReplay = () => { this.loadTask(false) }


    handleTaskSubmit = (taskResult: any, buffer: AnnotationBuffer) => {
        if (!['annotready'].includes(this.state.status))
            console.error(`submit() called in invalid state ${this.state.status}.`)
        if (this.props.previewMode) {
            return this.props.onSubmit()
        }

        let sendResult = () => {
            const url = this.props.task.url + '/submit?' + new URLSearchParams({
            })

            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskResult)
            }

            // now send the task results
            return fetch(url, requestOptions)
        }

        buffer.flush()
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

    handleTaskEnd = (taskResult: any, buffer: AnnotationBuffer, timer=false) => {
        if (!['annotready', 'replayready'].includes(this.state.status))
            console.error(`onEnd called in invalid state ${this.state.status}.`)
        this.endTaskResult = taskResult
        this.endTaskBuffer = buffer
        this.setState({
            status: this.state.status === 'annotready' ? 'annotended' : 'replayended'
        })
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

        // this.buffer.flush(5000)
        // .then(() => {
        //     this.setState({ errorModal: { ...this.state.errorModal, visible: false, loading: false } })
        // }).catch(() => {
        //     this.setState({
        //         errorModal: {
        //             visible: true,
        //             message: modalMessage + ' Unable to send the data. Please communicate with the organizers if the problems persist.',
        //             loading: false
        //         }
        //     })
        // })
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
                    onClick={()=>{}}
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
                    onClick={()=>{this.handleTaskSubmit(this.endTaskResult, this.endTaskBuffer)}}
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
        // this.setState(this.state) // triger re-render
    }

    renderTaskInfo = () => {
        return this.taskElement && this.taskElement.instructions && <Popover
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

    renderVideoTaskWithParent = () => {
        const tasks = [this.props.task]
        const responses = [this.response]
        let media = this.props.task.spec.media
        if (this.props.parent) {
            tasks.push(this.props.parent)
            responses.push(this.parentResponse)
            media = this.props.parent.spec.media
        }
        
        return <TaskPlayer
            ref={e => { this.taskPlayer = e }}
            createTaskRef={this.createTaskRef}
            media={media}
            tasks={tasks}
            responses={responses}
            currTask={this.state.player.currTask}
            replayMode={this.state.player.replayMode}
            onVideoLoad={this.playerLoadCallback}
            onBufferError={this.handleBufferError}
            onEnd={this.handleTaskEnd} />
    }

    renderTaskDefault = () => {
        const taskClass = getTaskClass(this.props.task.spec.type)
        return React.createElement(taskClass, {
            ref: this.createTaskRef,
            // task props
            spec: this.props.task.spec,

            // visualization
            visualizationModeOn: this.state.player.replayMode,
            response: this.response,

            onEnd: () => { },
            onSubmit: this.handleTaskSubmit
        }, null)
    }

    

    render() {
        return <>
            {this.renderOverlay()}
            {this.renderErrorModal()}
            {this.renderTaskInfo()}
            <div className={classNames('task')}>
                <ButtonEventManagerContext>
                    {(()=>{
                        if(this.state.status == 'loading') return <></>
                        switch (this.state.renderAs) {
                            case 'continuous-video':
                                return this.renderVideoTaskWithParent()
                            default:
                                return this.renderTaskDefault()
                        }
                    })()}
                </ButtonEventManagerContext>
            </div>
        </>
    }
}
TaskPlayer.contextType = buttonManagerContext
