import React from 'react'
import './CartToast.scss'

const CartToast = ({ visible, message }) => {
  if (!visible || !message) return null
  return <div className="cart-toast-global">{message}</div>
}

export default CartToast
