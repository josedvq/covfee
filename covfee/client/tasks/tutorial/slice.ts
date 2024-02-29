import { createSlice } from "@reduxjs/toolkit"

export interface State {
  name: string
  email: string
  phone: string
}

export const initialState: State = {
  name: "",
  email: "",
  phone: "",
}

export const slice = createSlice({
  name: "form",
  initialState,
  reducers: {
    setName: (state, action) => {
      state.name = action.payload
    },
    setEmail: (state, action) => {
      state.email = action.payload
    },
    setPhone: (state, action) => {
      state.phone = action.payload
    },
  },
})

export const { actions, reducer } = slice
