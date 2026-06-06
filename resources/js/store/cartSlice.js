import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { requestsService } from '../api/api'

export const fetchCart = createAsyncThunk('cart/fetch', async () => {
  return await requestsService.getCart()
})

export const addToCartAsync = createAsyncThunk('cart/add', async ({ productId, quantity }) => {
  return await requestsService.addToCart(productId, quantity)
})

export const updateCartItemAsync = createAsyncThunk('cart/updateItem', async ({ productId, quantity }) => {
  return await requestsService.updateCartItem(productId, quantity)
})

export const removeCartItemAsync = createAsyncThunk('cart/removeItem', async (productId) => {
  return await requestsService.removeCartItem(productId)
})

export const clearCartAsync = createAsyncThunk('cart/clear', async () => {
  return await requestsService.clearCart()
})

export const confirmCartAsync = createAsyncThunk('cart/confirm', async ({ productIds = null, delivery = null } = {}) => {
  return await requestsService.confirmCart(productIds, delivery)
})

const applyCartData = (state, data) => {
  state.cartId = data?.id ?? null
  state.items = data?.items ?? []
  state.loading = false
}

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    cartId: null,
    items: [],
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => { state.loading = true })
      .addCase(fetchCart.fulfilled, (state, action) => applyCartData(state, action.payload))
      .addCase(fetchCart.rejected, (state) => { state.loading = false })

      .addCase(addToCartAsync.fulfilled, (state, action) => applyCartData(state, action.payload))
      .addCase(updateCartItemAsync.fulfilled, (state, action) => applyCartData(state, action.payload))
      .addCase(removeCartItemAsync.fulfilled, (state, action) => applyCartData(state, action.payload))
      .addCase(clearCartAsync.fulfilled, (state, action) => applyCartData(state, action.payload))

      .addCase(confirmCartAsync.fulfilled, (state, action) => {
        applyCartData(state, action.payload.cart)
      })
  },
})

export default cartSlice.reducer
