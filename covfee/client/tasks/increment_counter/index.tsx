import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { BasicTaskProps, CovfeeTask } from "../base";

import { TaskType } from "@covfee-shared/spec/task";
import { useNodeState } from "../../journey/state";
import { State } from "./slice";
import { slice, actions } from "./slice";
import { useSelector } from "react-redux";

interface Props extends TaskType, BasicTaskProps {}

function IncrementCounterTask(props: Props) {
  const counter = useSelector((state) => state.counter);
  const { dispatch } = useNodeState<State>(slice);

  return (
    <>
      <h1>Counter {counter}</h1>

      <button
        onClick={() => {
          console.log(actions.incrementValue());
          dispatch(actions.incrementValue());
        }}
      >
        Increment
      </button>
    </>
  );
}

export default {
  taskConstructor: IncrementCounterTask,
  taskReducer: slice.reducer,
};
