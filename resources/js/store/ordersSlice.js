import { createSlice } from '@reduxjs/toolkit'

const ordersSlice = createSlice({
  name: 'ordersTable',
  initialState: {
    page: 1,
    limit: 5,
    sortBy: 'id',
    sortDir: 'asc',
    total: 0,
  },
  reducers: {
    setPage(state, action) {
      state.page = action.payload
    },
    setLimit(state, action) {
      state.limit = action.payload
    },
    setSort(state, action) {
      if (state.sortBy === action.payload) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc'
      } else {
        state.sortBy = action.payload
        state.sortDir = 'asc'
      }
    },
    setSortExplicit(state, action) {
      state.sortBy = action.payload.sortBy
      state.sortDir = action.payload.sortDir
    },
    setTotal(state, action) {
      state.total = action.payload
    },
  },
})

export const { setPage, setLimit, setSort, setSortExplicit, setTotal } = ordersSlice.actions
export default ordersSlice.reducer
