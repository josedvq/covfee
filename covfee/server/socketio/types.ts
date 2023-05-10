export type Action = {
    type: string
    payload: any
}
export type State = {
    numConnections: number,
    actionIndex: number,
    state: any
}
export type Error = {
    err: string
}
export type JoinRequest = {
    command: 'join'
    responseId: string
    taskName: string
    currState: null | object
}
export type JoinResponse = Error | State

export type LeaveRequest = {
    command: 'leave'
    responseId: string
}
export type LeaveResponse = Error | State

export type ActionRequest = {
    command: 'action'
    responseId: string
    action: Action
}
export type ActionResponse = Error | {actionIndex: number}

export type StateRequest = {
    command: 'state'
    responseId: string
}
export type StateResponse = Error | State

export type Request = JoinRequest   | LeaveRequest  | ActionRequest  | StateRequest
export type Response = JoinResponse | LeaveResponse | ActionResponse | StateResponse