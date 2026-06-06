import React, { useState, useEffect } from 'react'
import { X, Store, Truck, ArrowLeft, Info } from 'lucide-react'
import './CheckoutModal.scss'

const CheckoutModal = ({ open, onReadyToPay, onCancel, savedAddress = '' }) => {
  const [step, setStep]             = useState('method')   // 'method' | 'carrier'
  const [animDir, setAnimDir]       = useState('forward')
  const [stepKey, setStepKey]       = useState(0)
  const [carrier, setCarrier]       = useState(null)       // 'pochta' | 'sdek'
  const [address, setAddress]       = useState('')
  const [saveAddress, setSaveAddress] = useState(false)
  const [addressError, setAddressError] = useState('')

  useEffect(() => {
    if (open) {
      setStep('method')
      setAnimDir('forward')
      setStepKey(0)
      setCarrier(null)
      setAddressError('')
      setAddress(savedAddress || '')
      setSaveAddress(false)
    }
  }, [open, savedAddress])

  if (!open) return null

  const goTo = (newStep, dir = 'forward') => {
    setAnimDir(dir)
    setStepKey(k => k + 1)
    setStep(newStep)
  }

  const choosePickup = () => {
    onReadyToPay({ deliveryMethod: 'pickup', deliveryCarrier: null, deliveryAddress: null, saveAddress: false })
  }

  const chooseDelivery = () => goTo('carrier')

  const goBack = () => goTo('method', 'back')

  const handleContinue = () => {
    if (!carrier) return
    if (!address.trim()) { setAddressError('Введите адрес доставки'); return }
    onReadyToPay({
      deliveryMethod:  'delivery',
      deliveryCarrier: carrier,
      deliveryAddress: address.trim(),
      saveAddress,
    })
  }

  const carrierName = carrier === 'pochta' ? 'Почта России' : carrier === 'sdek' ? 'СДЭК' : ''

  return (
    <div className="checkout-modal__overlay" onMouseDown={onCancel}>
      <div className="checkout-modal__window" onMouseDown={e => e.stopPropagation()}>

        {/* Header */}
        <div className="checkout-modal__header">
          {step === 'carrier' && (
            <button className="checkout-modal__back" onClick={goBack} aria-label="Назад">
              <ArrowLeft size={18} strokeWidth={2.2} />
            </button>
          )}
          <h3 className="checkout-modal__title">
            {step === 'method' ? 'Способ получения' : 'Доставка'}
          </h3>
          <button className="checkout-modal__close" onClick={onCancel} aria-label="Закрыть">
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="checkout-modal__steps">
          <div className={`checkout-modal__step-dot${step === 'method' ? ' checkout-modal__step-dot--active' : ' checkout-modal__step-dot--done'}`} />
          <div className="checkout-modal__step-line" />
          <div className={`checkout-modal__step-dot${step === 'carrier' ? ' checkout-modal__step-dot--active' : ''}`} />
        </div>

        {/* Step content */}
        <div key={stepKey} className={`checkout-modal__body checkout-modal__body--${animDir}`}>

          {step === 'method' && (
            <div className="checkout-modal__methods">
              <button className="checkout-method checkout-method--pickup" onClick={choosePickup}>
                <div className="checkout-method__icon">
                  <Store size={32} strokeWidth={1.5} />
                </div>
                <div className="checkout-method__info">
                  <span className="checkout-method__title">Получить в магазине</span>
                  <span className="checkout-method__sub">Самовывоз · Бесплатно</span>
                </div>
              </button>

              <button className="checkout-method checkout-method--delivery" onClick={chooseDelivery}>
                <div className="checkout-method__icon">
                  <Truck size={32} strokeWidth={1.5} />
                </div>
                <div className="checkout-method__info">
                  <span className="checkout-method__title">Заказать доставку</span>
                  <span className="checkout-method__sub">Почта России или СДЭК</span>
                </div>
              </button>
            </div>
          )}

          {step === 'carrier' && (
            <div className="checkout-modal__delivery">
              <p className="checkout-modal__section-label">Служба доставки</p>
              <div className="checkout-carriers">
                <button
                  className={`checkout-carrier${carrier === 'pochta' ? ' checkout-carrier--active' : ''}`}
                  onClick={() => setCarrier('pochta')}
                >
                  <img src="/dataImg/pochta-logo.png" alt="Почта России" className="checkout-carrier__logo" />
                  <span className="checkout-carrier__name">Почта России</span>
                </button>
                <button
                  className={`checkout-carrier${carrier === 'sdek' ? ' checkout-carrier--active' : ''}`}
                  onClick={() => setCarrier('sdek')}
                >
                  <img src="/dataImg/cdek-logo.svg" alt="СДЭК" className="checkout-carrier__logo" />
                  <span className="checkout-carrier__name">СДЭК</span>
                </button>
              </div>

              <p className="checkout-modal__section-label" style={{ marginTop: '16px' }}>Адрес</p>
              <textarea
                className={`checkout-modal__address${addressError ? ' checkout-modal__address--error' : ''}`}
                placeholder="Укажите ваш адрес (город, улица, дом, квартира)"
                value={address}
                rows={3}
                onChange={e => { setAddress(e.target.value); if (addressError) setAddressError('') }}
              />
              {addressError && <span className="checkout-modal__field-error">{addressError}</span>}

              <label className="filter-check-label" style={{ marginTop: '10px' }}>
                <input type="checkbox" className="filter-check-input"
                  checked={saveAddress} onChange={e => setSaveAddress(e.target.checked)} />
                <span className="filter-check-box" />
                <span>Сохранить адрес доставки</span>
              </label>

              <div className="checkout-modal__info-box">
                <Info size={15} strokeWidth={2} className="checkout-modal__info-icon" />
                <p>
                  Доставка осуществляется до ближайшего ПВЗ{carrier === 'sdek' ? ' СДЭК' : ''}{carrier === 'pochta' ? ' / отделения Почты России' : ''} от указанного адреса.
                  Для оформления доставки курьером обратитесь к менеджеру.
                </p>
              </div>

              <div className="checkout-modal__footer">
                <button className="checkout-modal__btn checkout-modal__btn--back" onClick={goBack}>← Назад</button>
                <button
                  className="checkout-modal__btn checkout-modal__btn--confirm"
                  onClick={handleContinue}
                  disabled={!carrier}
                >
                  Продолжить →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CheckoutModal
