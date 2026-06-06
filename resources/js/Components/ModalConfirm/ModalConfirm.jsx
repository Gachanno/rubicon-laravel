import React from 'react'
import { Trash2, AlertTriangle, ShoppingCart, X } from 'lucide-react'
import './ModalConfirm.scss'

const config = {
  remove:     { Icon: Trash2,        title: 'Удалить товар?',    body: 'Этот товар будет удалён из корзины.',              btn: 'Удалить',  variant: 'danger'  },
  clearAll:   { Icon: AlertTriangle, title: 'Очистить корзину?', body: 'Все товары будут удалены из корзины.',             btn: 'Очистить', variant: 'danger'  },
  confirmAll: { Icon: ShoppingCart,  title: 'Оформить заказ?',   body: 'Все выбранные товары будут оформлены в заказ.',    btn: 'Оформить', variant: 'success' },
  confirm:    { Icon: ShoppingCart,  title: 'Оформить товар?',   body: 'Этот товар будет оформлен в заказ.',               btn: 'Оформить', variant: 'success' },
}

const ModalConfirm = ({ open, onConfirm, onCancel, action }) => {
  if (!open) return null
  const { Icon, title, body, btn, variant } = config[action] ?? config.remove

  return (
    <div className="modal-confirm__overlay" onMouseDown={onCancel}>
      <div className="modal-confirm__window" onMouseDown={e => e.stopPropagation()}>
        <div className={`modal-confirm__header modal-confirm__header--${variant}`}>
          <div className="modal-confirm__icon-wrap">
            <Icon size={20} strokeWidth={2} />
          </div>
          <h3 className="modal-confirm__title">{title}</h3>
          <button className="modal-confirm__close" onClick={onCancel} aria-label="Закрыть">
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>
        <div className="modal-confirm__body">
          <p className="modal-confirm__text">{body}</p>
        </div>
        <div className={`modal-confirm__actions modal-confirm__actions--${variant}`}>
          <button className="modal-confirm__btn modal-confirm__btn--cancel" onClick={onCancel}>Отмена</button>
          <button className={`modal-confirm__btn modal-confirm__btn--${variant}`} onClick={onConfirm}>{btn}</button>
        </div>
      </div>
    </div>
  )
}

export default ModalConfirm
