import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import './OrderModal.scss'

const OrderModal = ({ open, product, initialQty = 1, maxQty = 1, onCancel, onConfirm }) => {
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
    <div className="order-modal__overlay" onMouseDown={onCancel}>
      <div className="order-modal__window" onMouseDown={e => e.stopPropagation()}>
        <div className="order-modal__header">
          <div className="order-modal__header-text">
            <span className="order-modal__subtitle">Добавить в корзину</span>
            <h3 className="order-modal__title">{product.name}</h3>
          </div>
          <button className="order-modal__close" onClick={onCancel} aria-label="Закрыть">
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>

        <div className="order-modal__body">
          <label className="order-modal__label">Количество</label>
          <div className="order__quantity">
            <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1}>−</button>
            <input className="qty-input" type="number" min="1" max={maxQty} value={qty} onChange={handleChange} />
            <button className="qty-btn" onClick={() => setQty(Math.min(maxQty, qty + 1))} disabled={qty >= maxQty}>+</button>
          </div>
          <span className="order-modal__stock">В наличии: {maxQty} шт.</span>
        </div>

        <div className="order-modal__footer">
          <button className="order-modal__btn order-modal__btn--cancel" onClick={onCancel}>Отмена</button>
          <button className="order-modal__btn order-modal__btn--confirm" onClick={() => onConfirm(qty)}>
            В корзину
          </button>
        </div>
      </div>
    </div>
  )
}

export default OrderModal
