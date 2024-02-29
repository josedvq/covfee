import { createSlice } from "@reduxjs/toolkit"

export interface State {
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
