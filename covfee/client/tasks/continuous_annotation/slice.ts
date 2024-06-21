import { createSlice } from "@reduxjs/toolkit"

export interface State {
  // Note: delete selectedAnnotationIndex as state as soon as it is confirmed
  //       that this not influence the "response" object for an active
  //       covfee instance. This is because we don't really need it, and using
  //       it might be a source of bugs due to the use of the custom dispatch.
  selectedAnnotationIndex?: number | null
  mediaPaused: boolean
}

export const initialState: State = {
  selectedAnnotationIndex: null,
  mediaPaused: null,
}

export const slice = createSlice({
  name: "form",
  initialState,
  reducers: {
    setMediaPaused: (state, action) => {
      state.mediaPaused = action.payload
    },
    setSelectedAnnotationIndex: (state, action) => {
      state.selectedAnnotationIndex = action.payload
    },
  },
})

export const { actions, reducer } = slice
