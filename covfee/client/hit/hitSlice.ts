import { createSlice } from '@reduxjs/toolkit'

const initialState = {}

const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    
  }
})

// export const { todoAdded, todoToggled, todosLoading } = todosSlice.actions

export default todosSlice.reducer