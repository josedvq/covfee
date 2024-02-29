import { createSlice } from "../utils/state"

export interface State {
  formValues: any
  formDisabled: boolean
}

export const initialState: State = {
  formValues: null,
  formDisabled: false,
}

export const slice = createSlice(initialState, {
  disableForm: (state) => {
    return { ...state, formDisabled: true }
  },
  enableForm: (state) => {
    return { ...state, formDisabled: false }
  },
  setFormValues: (state, action) => {
    return {
      ...state,
      formValues: {
        ...state.formValues,
        ...action.payload,
      },
    }
  },
})

export const { actions, reducer } = slice
