import { createSlice } from "@reduxjs/toolkit";

export interface State {
}

export const initialState: State = {
};

export const slice = createSlice({
  name: "questionnaire",
  initialState,
  reducers: {
    
  },
});

export const { actions, reducer } = slice;
