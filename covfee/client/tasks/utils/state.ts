import {
  Slice,
  SliceCaseReducers,
  createSlice as reduxCreateSlice,
} from "@reduxjs/toolkit"

// createSlice<State, , Name extends string = string>(options: CreateSliceOptions<State, CaseReducers, Name>): Slice<State, CaseReducers, Name>

const covfeeReducers: SliceCaseReducers<any> = {
  setState: (_, action) => {
    return { ...action.payload }
  },
}

export function createSlice<CaseReducers extends SliceCaseReducers<any>>(
  initialState: any,
  reducers: CaseReducers
): Slice<any, CaseReducers, "task"> {
  return reduxCreateSlice({
    name: "task",
    initialState,
    reducers: {
      ...covfeeReducers,
      ...reducers,
    },
  })
}
