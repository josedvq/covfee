export type Action = {
  type: string;
  payload?: any;
};
export type State = {
  numConnections: number;
  actionIndex: number;
  state: any;
};
export type Error = {
  err: string;
};
export type JoinRequest = {
  command: "join";
  responseId: number;
  taskName: string;
  currState: null | object;
};
export type JoinResponse = Error | State;

export type LeaveRequest = {
  command: "leave";
  responseId: number;
};
export type LeaveResponse = Error | State;

export type ActionRequestPayload = {
  responseId: number;
  action: Action;
};
export type ActionRequest = ActionRequestPayload & {
  command: "action";
};
export type ActionResponse = Error | { actionIndex: number };

export type StateRequestPayload = {
  responseId: number;
};
export type StateRequest = StateRequestPayload & {
  command: "state";
};
export type StateResponse = Error | State;

export type Request = JoinRequest | LeaveRequest | ActionRequest | StateRequest;
export type Response =
  | JoinResponse
  | LeaveResponse
  | ActionResponse
  | StateResponse;
