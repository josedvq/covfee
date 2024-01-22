import React from "react"
import { slice, actions, State } from "./slice"
import { TaskExport } from "../../types/node"
import { CovfeeTaskProps } from "../base"
import type { TutorialTaskSpec } from "./spec"
import { AllPropsRequired } from "../../types/utils"
import { useDispatch } from "../../journey/state"
import { useSelector } from "react-redux"

interface Props extends CovfeeTaskProps<TutorialTaskSpec> {}

const TutorialTask: React.FC<Props> = (props) => {
  // here we set the defaults for the task props
  // we could use useMemo to avoid recomputing on every render
  const args: AllPropsRequired<Props> = {
    ...props,
    spec: {
      showPhoneField: true,
      ...props.spec,
    },
  }

  // we read the state using useSelector
  const name = useSelector<State, string>((state) => state.name)
  const email = useSelector<State, string>((state) => state.email)
  const phoneNumber = useSelector<State, string>((state) => state.phone)

  // this is a custom dispatch function provided by Covfee
  const dispatch = useDispatch()

  // and we render the component
  return (
    <form>
      <div>
        <label htmlFor="name">Name:</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => dispatch(actions.setName(e.target.value))}
          required
        />
      </div>
      <div>
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => dispatch(actions.setEmail(e.target.value))}
          required
        />
      </div>
      {args.spec.showPhoneField && (
        <div>
          <label htmlFor="phone">Phone:</label>
          <input
            type="tel"
            id="phone"
            value={phoneNumber}
            onChange={(e) => dispatch(actions.setPhone(e.target.value))}
          />
        </div>
      )}
    </form>
  )
}

export default {
  taskComponent: TutorialTask,
  taskSlice: slice,
  useSharedState: false,
} as TaskExport
