import { createSlice } from "../utils/state"

export interface State {}

export const initialState: State = {}

export const slice = createSlice(initialState, {})

export const { actions, reducer } = slice
