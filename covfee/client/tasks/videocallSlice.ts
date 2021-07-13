import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    queryIdx: 0
}

const stateSlice = createSlice({
    name: 'videocall',
    initialState,
    reducers: {
      incrementValue: (state) => {
          state.queryIdx += 1
      }
    }
})

export default stateSlice.reducer
  
export const { incrementValue } = stateSlice.actions