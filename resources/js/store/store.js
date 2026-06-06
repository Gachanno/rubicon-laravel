import { configureStore } from '@reduxjs/toolkit'
import cartReducer from './cartSlice'
import ordersTableReducer from './ordersSlice'

const store = configureStore({
  reducer: {
    cart: cartReducer,
    ordersTable: ordersTableReducer,
  },
})

export default store
