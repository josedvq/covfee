import { configureStore } from '@reduxjs/toolkit'

import hitReducer from './hit/hitSlice'

const store = configureStore({
  reducer: {
    // Define a top-level state field named `todos`, handled by `todosReducer`
    hit: hitReducer,
  }
})

export default store