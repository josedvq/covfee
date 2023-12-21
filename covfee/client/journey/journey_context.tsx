import { createContext } from "react"
import { Chat } from "../types/chat"
import { UseChats } from "../models/Chat"

export type TimerState = {
  show: boolean
  freeze: boolean
  init: number
  since: number
  max: number
}

export type JourneyContextType = {
  id: string
  socket: any

  timer: TimerState
  setTimer: (s: TimerState) => void
}

export const defaultTimerState: TimerState = {
  show: false,
  freeze: false,
  init: 0,
  since: 0,
  max: 0,
}

export const JourneyContext = createContext<JourneyContextType>({
  id: null,
  socket: null,
  timer: defaultTimerState,
  setTimer: (s) => {},
})
