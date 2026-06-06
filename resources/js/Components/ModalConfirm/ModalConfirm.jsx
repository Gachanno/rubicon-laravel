import React from 'react'
import { Trash2, AlertTriangle, ShoppingCart, CheckCircle2, X } from 'lucide-react'
import './ModalConfirm.scss'

const config = {
  remove:     { Icon: Trash2,        title: 'Удалить товар?',    body: 'Этот товар будет удалён из корзины.',              btn: 'Удалить',  variant: 'danger'  },
  clearAll:   { Icon: AlertTriangle, title: 'Очистить корзину?', body: 'Все товары будут удалены из корзины.',             btn: 'Очистить', variant: 'danger'  },
  confirmAll: { Icon: ShoppingCart,  title: 'Оформить заказ?',   body: 'Все выбранные товары будут оформлены в заказ.',    btn: 'Оформить', variant: 'success' },
  confirm:    { Icon: ShoppingCart,  title: 'Оформить товар?',   body: 'Этот товар будет оформлен в заказ.',               btn: 'Оформить', variant: 'success' },
}

const variantIcon = { danger: Trash2, success: CheckCircle2, warning: AlertTriangle }

// Props can be driven by `action` (предустановленный конфиг) или переданы напрямую
// (title / body / confirmLabel / variant / icon) — для переиспользования стиля где угодно.
const ModalConfirm = ({ open, onConfirm, onCancel, action, title, body, confirmLabel, variant, icon }) => {
  if (!open) return null

  const base = action ? (config[action] ?? config.remove) : {}
  const v     = variant ?? base.variant ?? 'danger'
  const Icon  = icon ?? base.Icon ?? variantIcon[v] ?? Trash2
  const head  = title ?? base.title ?? 'Подтвердите действие'
  const text  = body ?? base.body ?? ''
  const btn   = confirmLabel ?? base.btn ?? 'Подтвердить'

  return (
    <div className="modal-confirm__overlay" onMouseDown={onCancel}>
      <div className="modal-confirm__window" onMouseDown={e => e.stopPropagation()}>
        <div className={`modal-confirm__header modal-confirm__header--${v}`}>
          <div className="modal-confirm__icon-wrap">
            <Icon size={20} strokeWidth={2} />
          </div>
          <h3 className="modal-confirm__title">{head}</h3>
          <button className="modal-confirm__close" onClick={onCancel} aria-label="Закрыть">
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>
        <div className="modal-confirm__body">
          <p className="modal-confirm__text">{text}</p>
        </div>
        <div className={`modal-confirm__actions modal-confirm__actions--${v}`}>
          <button className="modal-confirm__btn modal-confirm__btn--cancel" onClick={onCancel}>Отмена</button>
          <button className={`modal-confirm__btn modal-confirm__btn--${v}`} onClick={onConfirm}>{btn}</button>
        </div>
      </div>
    </div>
  )
}

export default ModalConfirm
