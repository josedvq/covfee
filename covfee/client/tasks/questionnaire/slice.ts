import { createSlice } from "@reduxjs/toolkit";

export interface State {
  formValues: any;
  mediaPaused: boolean;
  formDisabled: boolean;
}

export const initialState: State = {
  formValues: null,
  mediaPaused: null,
  formDisabled: false,
};

export const slice = createSlice({
  name: "questionnaire",
  initialState,
  reducers: {
    playMedia: (state) => {
      return { ...state, mediaPaused: false };
    },
    pauseMedia: (state) => {
      return { ...state, mediaPaused: true };
    },
    disableForm: (state) => {
      return { ...state, formDisabled: true };
    },
    enableForm: (state) => {
      return { ...state, formDisabled: false };
    },
    setFormValues: (state, action) => {
      return {
        ...state,
        formValues: {
          ...state.formValues,
          ...action.payload,
        },
      };
    },
  },
});

export const { actions, reducer } = slice;
