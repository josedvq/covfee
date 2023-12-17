import React, { PropsWithChildren } from "react"
import { createSlice, PayloadAction } from "@reduxjs/toolkit"

import { useDispatch } from "react-redux"

export type BoardValue = "X" | "O" | null

export interface State {
  board: BoardValue[]
  currentPlayer: BoardValue
}

export const initialState: State = {
  board: Array(9).fill(null),
  currentPlayer: "X",
}

export const slice = createSlice({
  name: "tictactoe",
  initialState,
  reducers: {
    makeMove: (state, action: PayloadAction<number>) => {
      const newBoard = state.board.slice()
      if (newBoard[action.payload] === null) {
        newBoard[action.payload] = state.currentPlayer
        const nextPlayer = state.currentPlayer === "X" ? "O" : "X"
        return { ...state, board: newBoard, currentPlayer: nextPlayer }
      }
      return state
    },
  },
})

const { actions } = slice

interface Props {
  state: State
}

const TicTacToe: React.FC<PropsWithChildren<Props>> = (props) => {
  const dispatch = useDispatch()
  const { board, currentPlayer } = props.state

  const handleClick = (index: number) => {
    dispatch(actions.makeMove(index))
  }

  return (
    <div>
      <div>Current Player: {currentPlayer}</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "10px",
        }}
      >
        {board.map((cell, index) => (
          <div
            key={index}
            style={{ width: "50px", height: "50px", border: "1px solid black" }}
            onClick={() => handleClick(index)}
          >
            {cell}
          </div>
        ))}
      </div>
    </div>
  )
}

export default TicTacToe
