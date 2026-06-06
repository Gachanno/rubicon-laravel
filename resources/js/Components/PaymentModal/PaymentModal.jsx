import React, { useState, useEffect } from 'react'
import { X, Plus } from 'lucide-react'
import './PaymentModal.scss'

const STORAGE_KEY = 'paymentCards'

function loadCards() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function persistCards(cards) { localStorage.setItem(STORAGE_KEY, JSON.stringify(cards)) }

function formatCardNumber(value) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})(?=.)/g, '$1 ')
}

function formatExpiry(value) {
  const d = value.replace(/\D/g, '').slice(0, 4)
  return d.length <= 2 ? d : d.slice(0, 2) + '/' + d.slice(2)
}

function validateCard(number, expiry, cvv) {
  const errors = {}
  const digits = number.replace(/\s/g, '')
  if (digits.length !== 16 || !/^\d+$/.test(digits)) {
    errors.number = 'Введите корректный номер карты (16 цифр)'
  }
  const m = expiry.match(/^(\d{2})\/(\d{2})$/)
  if (!m) {
    errors.expiry = 'Введите срок в формате ММ/ГГ'
  } else {
    const mm = parseInt(m[1]), yy = parseInt(m[2])
    const now = new Date(), cy = now.getFullYear() % 100, cm = now.getMonth() + 1
    if (mm < 1 || mm > 12) errors.expiry = 'Некорректный месяц'
    else if (yy < cy || (yy === cy && mm < cm)) errors.expiry = 'Срок действия истёк'
  }
  if (!/^\d{3,4}$/.test(cvv)) errors.cvv = 'Введите CVV (3–4 цифры)'
  return errors
}

const PaymentModal = ({ open, onConfirm, onCancel, onBack, title = 'Оплата заказа' }) => {
  const [cards, setCards] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [number, setNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [saveCard, setSaveCard] = useState(false)
  const [errors, setErrors] = useState({})
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    if (open) {
      const loaded = loadCards()
      setCards(loaded)
      setSelectedId(null)
      setShowForm(loaded.length === 0)
      setNumber(''); setExpiry(''); setCvv('')
      setSaveCard(false); setErrors({})
    }
  }, [open])

  if (!open) return null

  const selectCard = (card) => {
    setSelectedId(card.id)
    setShowForm(true)
    setNumber(formatCardNumber(card.number))
    setExpiry(card.expiry)
    setCvv('')
    setSaveCard(false)
    setErrors({})
  }

  const removeCard = (e, id) => {
    e.stopPropagation()
    const updated = cards.filter(c => c.id !== id)
    setCards(updated)
    persistCards(updated)
    if (selectedId === id) {
      setSelectedId(null)
      setShowForm(updated.length === 0)
      setNumber(''); setExpiry(''); setCvv('')
    }
  }

  const startNewCard = () => {
    setSelectedId(null)
    setShowForm(true)
    setNumber(''); setExpiry(''); setCvv('')
    setSaveCard(false); setErrors({})
  }

  const handleNumberChange = (e) => {
    if (selectedId) return
    setNumber(formatCardNumber(e.target.value))
    setErrors(p => ({ ...p, number: undefined }))
  }

  const handleExpiryChange = (e) => {
    if (selectedId) return
    setExpiry(formatExpiry(e.target.value))
    setErrors(p => ({ ...p, expiry: undefined }))
  }

  const handleCvvChange = (e) => {
    setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))
    setErrors(p => ({ ...p, cvv: undefined }))
  }

  const handlePay = async () => {
    const errs = validateCard(number, expiry, cvv)
    if (Object.keys(errs).length) { setErrors(errs); return }

    if (!selectedId && saveCard) {
      const digits = number.replace(/\s/g, '')
      const card = { id: Date.now().toString(), number: digits, expiry, last4: digits.slice(-4) }
      const updated = [...cards, card]
      setCards(updated)
      persistCards(updated)
    }

    setPaying(true)
    await new Promise(r => setTimeout(r, 500))
    setPaying(false)
    onConfirm()
  }

  return (
    <div className="payment-modal__overlay" onMouseDown={onCancel}>
      <div className="payment-modal__window" onMouseDown={e => e.stopPropagation()}>
        <div className="payment-modal__header">
          <h3 className="payment-modal__title">{title}</h3>
          <button className="payment-modal__close" onClick={onCancel} aria-label="Закрыть">
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>

        {cards.length > 0 && (
          <div className="payment-modal__cards">
            <div className="payment-modal__cards-label">Сохранённые карты</div>
            {cards.map(card => (
              <div
                key={card.id}
                className={`payment-card${selectedId === card.id ? ' payment-card--active' : ''}`}
                onClick={() => selectCard(card)}
              >
                  <div className="payment-card__info">
                  <span className="payment-card__number">**** **** **** {card.last4}</span>
                  <span className="payment-card__expiry">{card.expiry}</span>
                </div>
                <button className="payment-card__delete" onClick={e => removeCard(e, card.id)} title="Удалить" aria-label="Удалить карту">
                  <X size={16} strokeWidth={2.2} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button className="payment-modal__add-btn" onClick={startNewCard}>
          <Plus size={16} strokeWidth={2.2} />
          <span>Добавить карту</span>
        </button>

        {showForm && (
          <div className="payment-modal__form">
            <div className="payment-modal__field">
              <label className="payment-modal__label">Номер карты</label>
              <input
                className={`payment-modal__input${errors.number ? ' payment-modal__input--error' : ''}`}
                type="text"
                placeholder="0000 0000 0000 0000"
                value={number}
                onChange={handleNumberChange}
                maxLength={19}
                readOnly={!!selectedId}
              />
              {errors.number && <span className="payment-modal__error">{errors.number}</span>}
            </div>
            <div className="payment-modal__row">
              <div className="payment-modal__field">
                <label className="payment-modal__label">Срок действия</label>
                <input
                  className={`payment-modal__input${errors.expiry ? ' payment-modal__input--error' : ''}`}
                  type="text"
                  placeholder="ММ/ГГ"
                  value={expiry}
                  onChange={handleExpiryChange}
                  maxLength={5}
                  readOnly={!!selectedId}
                />
                {errors.expiry && <span className="payment-modal__error">{errors.expiry}</span>}
              </div>
              <div className="payment-modal__field">
                <label className="payment-modal__label">CVV/CVC</label>
                <input
                  className={`payment-modal__input${errors.cvv ? ' payment-modal__input--error' : ''}`}
                  type="password"
                  placeholder="•••"
                  value={cvv}
                  onChange={handleCvvChange}
                  maxLength={4}
                />
                {errors.cvv && <span className="payment-modal__error">{errors.cvv}</span>}
              </div>
            </div>
            {!selectedId && (
              <label className="filter-check-label">
                <input type="checkbox" className="filter-check-input" checked={saveCard} onChange={e => setSaveCard(e.target.checked)} />
                <span className="filter-check-box" />
                Сохранить карту
              </label>
            )}
          </div>
        )}

        <div className="payment-modal__actions">
          {onBack
            ? <button className="payment-modal__btn payment-modal__btn--back" onClick={onBack}>← Назад</button>
            : <button className="payment-modal__btn payment-modal__btn--cancel" onClick={onCancel}>Отмена</button>
          }
          <button
            className="payment-modal__btn payment-modal__btn--pay"
            onClick={handlePay}
            disabled={!showForm || paying}
          >
            {paying ? 'Обработка...' : 'Оплатить'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentModal
