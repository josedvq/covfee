import { createSlice } from "../utils/state";

export interface State {
  counter: number;
}

export const initialState: State = {
  counter: 0,
};

export const slice = createSlice(initialState,
  {
    setState: (_, action) => {
      return { ...action.payload };
    },
    incrementValue: (state) => {
      state.counter += 1;
    },
  }
);

export const { actions, reducer } = slice;
