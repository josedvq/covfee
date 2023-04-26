import { createSlice } from '@reduxjs/toolkit'

export interface State {
    counter: number
}

export const initialState: State = {
    counter: 0,
}

export const slice = createSlice({
    name: 'increment_counter',
    initialState,
    reducers: {
      incrementValue: (state) => {
          state.counter += 1
      }
    }
})


export const { actions, reducer } = slice