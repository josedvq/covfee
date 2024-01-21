import React, { useState } from "react"
import { slice, actions } from "./slice"
import { TaskExport } from "../../types/node"
import { CovfeeTaskProps } from "../base"
import type { TutorialTaskSpec } from "./spec"
import { AllPropsRequired } from "../../types/utils"

interface Props extends CovfeeTaskProps<TutorialTaskSpec> {}

const TutorialTask: React.FC<Props> = (props) => {
  const args: AllPropsRequired<Props> = {
    ...props,
    spec: {
      showPhoneField: true,
      ...props.spec,
    },
  }

  console.log(args.spec)

  return (
    <form>
      <div>
        <label htmlFor="name">Name:</label>
        <input
          type="text"
          id="name"
          onChange={(e) => actions.setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          onChange={(e) => actions.setEmail(e.target.value)}
          required
        />
      </div>
      {args.spec.showPhoneField && (
        <div>
          <label htmlFor="phone">Phone:</label>
          <input
            type="tel"
            id="phone"
            onChange={(e) => actions.setPhone(e.target.value)}
          />
        </div>
      )}
    </form>
  )
}
export type { TutorialTaskSpec }
export default {
  taskComponent: TutorialTask,
  taskSlice: slice,
  useSharedState: false,
} as TaskExport
