import React, { useEffect, useState } from 'react'
import { Link, router, usePage } from '@inertiajs/react'
import './main.scss'
import About from "./img/about.jpg"
import OrderModal from '../Components/OrderModal'
import CartToast, { useCartToast } from '../Components/CartToast'
import HeroSlider from '../Components/HeroSlider'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { addToCartAsync } from '../store/cartSlice'
import { Rating } from 'react-simple-star-rating'

const Main = ({ products: initialProducts = [], slides = [] }) => {
  const products = initialProducts
  const dispatch = useAppDispatch()
  const { auth } = usePage().props
  const isStaff = auth?.user?.role === 'Администратор' || auth?.user?.role === 'Менеджер'
  const cartItems = useAppSelector(state => state.cart.items)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalProduct, setModalProduct] = useState(null)
  const { message: toastMsg, visible: toastVisible, notify } = useCartToast()

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('scrollToAbout')) {
      const aboutSection = document.getElementById('about')
      if (aboutSection) {
        setTimeout(() => {
          aboutSection.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
    }
  }, [])

  return (
    <main className="main">
      <HeroSlider slides={slides} />

      {/* About Company Section */}
      <section className="about" id="about">
        <h2 className="about__title">О нашей компании</h2>
        <div className="about__content">
          <div className="about__text-block">
            <h3 className="about__subtitle">Мы помогаем в создании сада мечты с 2006 года</h3>
            <p className="about__text">
              Компания "Рубикон" специализируется на продаже товаров для сада и огорода. Наша миссия — помощь каждому клиенту создать сой идеальный сад. Профессиональный выбор и помощь в выборе качеств нашей продукции.
            </p>
            <p className="about__text">
              Мы тщательно отбираем поставщиков, чтобы гарантировать высокое качество нашей продукции. Наши консультанты всегда готовы помочь с выбором и дать профессиональный совет по уходу за растениями.
            </p>
          </div>
          <div className="about__image">
            <img src={About} alt="Красивый сад" />
          </div>
        </div>
      </section>

      {/* Popular Products Section */}
      <section className="products">
        <h2 className="products__title">Популярные товары</h2>
        <div className="products__grid">
          {products.map(product => (
            <Link key={product.id} href={`/products/${product.id}`} className="product-card__link">
              <article className="product-card">
                <div className="product-card__image-wrapper">
                  <img src={product.image} alt={product.name} className="product-card__image" />
                  {product.discount_percent > 0 && (
                    <div className="product-card__discount-badge">-{product.discount_percent}%</div>
                  )}
                </div>
                <h3 className="product-card__name">{product.name}</h3>
                <p className="product-card__description">{product.description}</p>

                {product.reviews_count > 0 && (
                  <div className="product-card__rating">
                    <Rating readonly initialValue={product.avg_rating} size={20} allowFraction SVGstyle={{ display: 'inline' }} />
                    <span className="product-card__rating-count">{product.avg_rating} ({product.reviews_count})</span>
                  </div>
                )}

                <div className="product-card__actions">
                  {product.discount_percent > 0 ? (
                    <div className="product-card__price-block">
                      <span className="product-card__price--old">{product.price} ₽</span>
                      <span className="product-card__price--new">{product.discounted_price} ₽</span>
                    </div>
                  ) : (
                    <div className="product-card__price">{product.price} ₽</div>
                  )}
                  {isStaff ? (
                    <span className="product-card__staff-notice">Сотрудник не может заказать</span>
                  ) : (
                  <button
                    className="product-card__button"
                    disabled={product.available_quantity === 0}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setModalProduct(product); setModalOpen(true); }}
                  >
                    В корзину
                  </button>
                  )}
                </div>
              </article>
            </Link>
          ))}
        </div>
        <OrderModal
          open={modalOpen}
          product={modalProduct}
          initialQty={1}
          maxQty={Math.max(0, (modalProduct?.available_quantity || 0) - (cartItems.find(i => i.productId === modalProduct?.id)?.quantity || 0))}
          onCancel={() => setModalOpen(false)}
          onConfirm={(qty) => {
            if (!modalProduct) return
            if (!auth?.user) {
              router.visit('/login')
              return
            }
            dispatch(addToCartAsync({ productId: modalProduct.id, quantity: qty }))
            setModalOpen(false)
            notify('Товар добавлен в корзину')
          }}
        />
      </section>
      <CartToast visible={toastVisible} message={toastMsg} />
    </main>
  )
}

export default Main
