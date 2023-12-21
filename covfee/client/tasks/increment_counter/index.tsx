import * as React from "react"

import { useDispatch } from "../../journey/state"
import { State } from "./slice"
import { slice, actions } from "./slice"
import { useSelector } from "react-redux"
import { TaskExport, TaskType } from "types/node"
import { BaseTaskProps } from "tasks/base"

interface Props extends TaskType, BaseTaskProps {}

function IncrementCounterTask(props: Props) {
  const counter = useSelector((state) => state.counter)
  const dispatch = useDispatch()

  return (
    <>
      <h1>Counter {counter}</h1>

      <button
        onClick={() => {
          console.log(actions.incrementValue())
          dispatch(actions.incrementValue())
        }}
      >
        Increment
      </button>
    </>
  )
}

export default {
  taskComponent: IncrementCounterTask,
  taskSlice: slice,
  useSharedState: true,
} as TaskExport
