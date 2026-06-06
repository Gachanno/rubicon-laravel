import React, { useState, useEffect, useRef } from 'react'
import { router, usePage } from '@inertiajs/react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { addToCartAsync } from '../store/cartSlice'
import OrderNowModal from '../Components/OrderNowModal'
import CheckoutModal from '../Components/CheckoutModal'
import PaymentModal from '../Components/PaymentModal'
import ReviewSection from '../Components/ReviewSection'
import { Rating } from 'react-simple-star-rating'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import './product-detail.scss'
import { requestsService } from '../api/api'

const ProductDetail = ({ product: initialProduct }) => {
  const [product, setProduct] = useState(initialProduct)
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [animDir, setAnimDir] = useState('right')
  const dispatch = useAppDispatch()
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const cartItem = useAppSelector(state => state.cart.items.find(i => i.productId === Number(product?.id)))
  const { auth } = usePage().props
  const currentUserId = auth?.user?.id
  const [showNowModal, setShowNowModal] = useState(false)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [pendingQty, setPendingQty] = useState(1)
  const [deliveryInfo, setDeliveryInfo] = useState(null)

  const isAdmin = auth?.user?.role === 'Администратор' || auth?.user?.role === 'Менеджер'

  useEffect(() => {
    const footer = document.querySelector('footer')
    if (footer) {
      footer.style.backgroundColor = '#fff'
    }
    return () => {
      if (footer) {
        footer.style.backgroundColor = ''
      }
    }
  }, [])

  const galleryImages = (product?.images && product.images.length > 0)
    ? product.images
    : (product?.image ? [product.image] : [])

  const alreadyInCartQty = cartItem ? cartItem.quantity : 0
  const remainingAvailable = product ? Math.max(0, product.available_quantity - alreadyInCartQty) : 0

  useEffect(() => {
    if (quantity > remainingAvailable && remainingAvailable > 0) {
      setQuantity(remainingAvailable)
    } else if (remainingAvailable === 0 && quantity !== 1) {
      setQuantity(1)
    }
  }, [remainingAvailable])

  const handleQuantityChange = (e) => {
    const maxAllowed = remainingAvailable
    if (maxAllowed <= 0) return
    const value = Math.max(1, Math.min(maxAllowed, parseInt(e.target.value) || 1))
    setQuantity(value)
  }

  const handleAddToCart = () => {
    if (!product || remainingAvailable === 0) return
    if (!currentUserId) {
      router.visit('/login')
      return
    }
    const qty = Math.min(quantity, remainingAvailable)
    dispatch(addToCartAsync({ productId: product.id, quantity: qty }))
    setToastMessage('товар добавлен в корзину')
    setShowToast(true)
    setTimeout(() => setShowToast(false), 10000)
  }

  const nextImage = () => {
    setAnimDir('right')
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length)
  }

  const prevImage = () => {
    setAnimDir('left')
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
  }

  const touchStartX = useRef(null)

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || galleryImages.length <= 1) return
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(delta) > 40) {
      delta > 0 ? nextImage() : prevImage()
    }
    touchStartX.current = null
  }

  const refreshProduct = async () => {
    try {
      const data = await requestsService.getProductById(product.id)
      if (data) setProduct(data)
    } catch (e) {}
  }

  if (!product) {
    return (
      <div className="product-detail">
        <div className="not-found">
          <p>Товар не найден</p>
          <button onClick={() => router.visit('/products')} className="btn">Вернуться в каталог</button>
        </div>
      </div>
    )
  }

  const displayPrice = product.discount_percent > 0 ? product.discounted_price : product.price

  return (
    <div className="product-detail">
      <div className="product-detail__container">
        <div className="product-detail__gallery-section">
          <div className="gallery">
            <div className="gallery__main" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
              <button className="gallery__arrow gallery__arrow--left" onClick={prevImage} aria-label="Предыдущее изображение">
                <ChevronLeft size={26} strokeWidth={2.4} />
              </button>
              <div className="gallery__image-wrapper">
                <img
                  key={currentImageIndex}
                  src={galleryImages[currentImageIndex]}
                  alt={`${product.name} - вид ${currentImageIndex + 1}`}
                  className={`gallery__image gallery__image--${animDir}`}
                />
                {product.available_quantity === 0 && (
                  <div className="gallery__out-of-stock">Нет в наличии</div>
                )}
                {product.discount_percent > 0 && (
                  <div className="gallery__discount-badge">-{product.discount_percent}%</div>
                )}
              </div>
              <button className="gallery__arrow gallery__arrow--right" onClick={nextImage} aria-label="Следующее изображение">
                <ChevronRight size={26} strokeWidth={2.4} />
              </button>
            </div>
            <div className="gallery__thumbnails">
              {galleryImages.map((url, idx) => (
                <button
                  key={idx}
                  className={`gallery__thumb-btn ${idx === currentImageIndex ? 'active' : ''}`}
                  onClick={() => {
                    if (idx !== currentImageIndex) {
                      setAnimDir(idx > currentImageIndex ? 'right' : 'left')
                      setCurrentImageIndex(idx)
                    }
                  }}
                >
                  <img src={url} alt={`${product.name} ${idx + 1}`} className="gallery__thumb-img" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="product-detail__info-section">
          <div className="product-detail__header">
            <h1 className="product-detail__title">{product.name}</h1>
            <span className="product-detail__article">Артикул: {product.id}</span>

            {product.reviews_count > 0 && (
              <div className="product-detail__rating">
                <Rating readonly initialValue={product.avg_rating} size={18} allowFraction SVGstyle={{ display: 'inline' }} />
                <span className="product-detail__rating-value">{product.avg_rating}</span>
                <span className="product-detail__rating-count">({product.reviews_count} отзывов)</span>
              </div>
            )}

            {product.discount_percent > 0 ? (
              <div className="product-detail__price-block">
                <span className="product-detail__price--old">{product.price} ₽</span>
                <span className="product-detail__price--new">{product.discounted_price} ₽</span>
                <span className="product-detail__discount-badge">Скидка {product.discount_percent}%</span>
              </div>
            ) : (
              <div className="product-detail__price">{product.price} ₽</div>
            )}
          </div>
          <p className="product-detail__description">{product.description}</p>

          <div className='product-detail__counts'>
            <div className="product-detail__stock">Доступно: {product.available_quantity} шт.</div>
            {!isAdmin && cartItem && (
              <div className="product-detail__already-booked">В корзине: {cartItem.quantity}</div>
            )}
          </div>
          {isAdmin ? (
            <div className="product-detail__admin-notice">Сотрудник не может заказать</div>
          ) : (
          <div className="product-detail__booking">
            <div className="booking__quantity">
              <button className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>−</button>
              <input type="number" min="1" max={remainingAvailable} value={quantity} onChange={handleQuantityChange} className="qty-input" disabled={remainingAvailable === 0} />
              <button className="qty-btn" onClick={() => setQuantity(Math.min(remainingAvailable, quantity + 1))} disabled={quantity >= remainingAvailable}>+</button>
            </div>
            <div className="product-detail__booking-btns">
              <button className="btn btn--booking btn--primary" onClick={handleAddToCart} disabled={remainingAvailable === 0}>В корзину</button>
              <button className="btn btn--booking btn--secondary" onClick={() => setShowNowModal(true)} disabled={remainingAvailable === 0}>Заказать сейчас</button>
            </div>
          </div>
          )}

          {showToast && (
            <div className="product-detail__toast">{toastMessage}</div>
          )}

          <OrderNowModal
            open={showNowModal}
            product={product}
            initialQty={quantity}
            maxQty={remainingAvailable}
            onCancel={() => setShowNowModal(false)}
            onConfirm={(qty) => {
              if (!currentUserId) {
                router.visit('/login')
                return
              }
              setPendingQty(qty)
              setShowNowModal(false)
              setShowCheckoutModal(true)
            }}
          />
          <CheckoutModal
            open={showCheckoutModal}
            savedAddress={auth?.user?.address || ''}
            onCancel={() => setShowCheckoutModal(false)}
            onReadyToPay={(info) => {
              setDeliveryInfo(info)
              setShowCheckoutModal(false)
              setShowPaymentModal(true)
            }}
          />
          <PaymentModal
            open={showPaymentModal}
            title="Оплата заказа"
            onBack={() => { setShowPaymentModal(false); setShowCheckoutModal(true) }}
            onCancel={() => { setShowPaymentModal(false); setDeliveryInfo(null) }}
            onConfirm={async () => {
              setShowPaymentModal(false)
              const isDelivery = deliveryInfo?.deliveryMethod === 'delivery'
              const body = {
                userId: currentUserId,
                status: 'в ожидании',
                items: [{ productId: product.id, quantity: pendingQty }],
                deliveryMethod: deliveryInfo?.deliveryMethod ?? null,
                deliveryCarrier: deliveryInfo?.deliveryCarrier ?? null,
                deliveryAddress: deliveryInfo?.deliveryAddress ?? null,
              }
              if (isDelivery && deliveryInfo?.saveAddress && currentUserId && deliveryInfo.deliveryAddress) {
                try { await requestsService.updateUser(currentUserId, { address: deliveryInfo.deliveryAddress }) } catch {}
              }
              const res = await requestsService.createOrder(body)
              setDeliveryInfo(null)
              if (res?.success) {
                const base = 'Спасибо за покупку, заказ создан. Менеджер скоро обработает его. Можно узнать статус заказа в личном профиле.'
                const extra = isDelivery
                  ? ' Трек-номер придёт по СМС или на почту после подтверждения заказа менеджером.'
                  : ''
                setToastMessage(base + extra)
                setShowToast(true)
                setTimeout(() => setShowToast(false), 12000)
                await refreshProduct()
                setQuantity(1)
              } else {
                alert('Ошибка при создании заказа')
              }
            }}
          />

          {product.characteristics && product.characteristics.length > 0 && (
            <div className="product-detail__characteristics">
              <h2 className="specs__title">Характеристики</h2>
              <div className="specs-grid">
                {product.characteristics.map((char, idx) => (
                  <div className='specs-gris__wrapper' key={`${char.name || 'char'}-${char.value || 'value'}-${idx}`}>
                    <div className="specs-grid__label">{char.name}</div>
                    <div className="specs-grid__value">{char.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="product-detail__reviews">
        <ReviewSection
          productId={product.id}
          currentUser={auth?.user}
          isAdmin={auth?.user?.role === 'Администратор'}
          isStaff={auth?.user?.role === 'Администратор' || auth?.user?.role === 'Менеджер'}
        />
      </div>
    </div>
  )
}

export default ProductDetail
