import * as React from "react"
import { AllPropsRequired } from "../types/utils"
import { JourneyContext } from "./journey_context"

export interface TimerProps {}

export const Timer: React.FC<React.PropsWithChildren<TimerProps>> = (props) => {
  const args: AllPropsRequired<TimerProps> = {
    ...props,
  }

  const { timer } = React.useContext(JourneyContext)

  const [time, setTime] = React.useState<number>()

  React.useEffect(() => {
    const unixTimestamp = Math.floor(Date.now() / 1000)

    setTime(Math.min(timer.max, timer.init + (unixTimestamp - timer.since)))
    const id = setInterval(() => {
      setTime((t) => Math.min(timer.max, t + 1))
    }, 1000)

    return () => {
      clearTimeout(id)
    }
  }, [timer])

  if (!timer.show) {
    return <></>
  }

  return (
    <span>
      {time} / {timer.max}
    </span>
  )
}
