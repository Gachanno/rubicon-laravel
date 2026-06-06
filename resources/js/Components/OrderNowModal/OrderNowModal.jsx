import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import './OrderNowModal.scss'

const OrderNowModal = ({ open, product, initialQty = 1, maxQty = 1, onCancel, onConfirm }) => {
  const [qty, setQty] = useState(initialQty)

  useEffect(() => {
    setQty(initialQty)
  }, [initialQty, product, open])

  if (!open || !product) return null

  const handleChange = (e) => {
    const v = Math.max(1, Math.min(maxQty, parseInt(e.target.value) || 1))
    setQty(v)
  }

  return (
    <div className="order-now__overlay" onMouseDown={onCancel}>
      <div className="order-now__window" onMouseDown={e => e.stopPropagation()}>
        <div className="order-now__header">
          <div className="order-now__header-text">
            <span className="order-now__subtitle">Быстрый заказ</span>
            <h3 className="order-now__title">{product.name}</h3>
          </div>
          <button className="order-now__close" onClick={onCancel} aria-label="Закрыть">
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>

        <div className="order-now__body">
          <label className="order-now__label">Количество</label>
          <div className="order__quantity">
            <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1}>−</button>
            <input className="qty-input" type="number" min="1" max={maxQty} value={qty} onChange={handleChange} />
            <button className="qty-btn" onClick={() => setQty(Math.min(maxQty, qty + 1))} disabled={qty >= maxQty}>+</button>
          </div>
          <span className="order-now__stock">В наличии: {maxQty} шт.</span>
        </div>

        <div className="order-now__footer">
          <button className="order-now__btn order-now__btn--cancel" onClick={onCancel}>Отмена</button>
          <button className="order-now__btn order-now__btn--confirm" onClick={() => onConfirm(qty)}>
            Заказать
          </button>
        </div>
      </div>
    </div>
  )
}

export default OrderNowModal
