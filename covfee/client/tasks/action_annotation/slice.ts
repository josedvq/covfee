import { createSlice } from "@reduxjs/toolkit"

export interface State {
  active_annotation?: string
  active_participant?: string
  mediaPaused: boolean
}

export const initialState: State = {
  active_annotation: null,
  active_participant: null,
  mediaPaused: null,
}

export const slice = createSlice({
  name: "form",
  initialState,
  reducers: {
    setMediaPaused: (state, action) => {
      state.mediaPaused = action.payload
    },
    setActiveAnnotation: (state, action) => {
      state.active_annotation = action.payload
    },
    setActiveParticipant: (state, action) => {
      state.active_participant = action.payload
    },
  },
})

export const { actions, reducer } = slice
