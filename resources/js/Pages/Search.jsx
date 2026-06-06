import React, { useState, useEffect } from 'react'
import { Link, router, usePage } from '@inertiajs/react'
import './search.scss'
import './products.scss'
import { requestsService } from '../api/api'
import { Search as SearchLucide } from 'lucide-react'
import { Rating } from 'react-simple-star-rating'
import OrderModal from '../Components/OrderModal'
import CartToast, { useCartToast } from '../Components/CartToast'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { addToCartAsync } from '../store/cartSlice'

const PAGE_SIZE = 16

const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null

  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const set = new Set([1, totalPages, page, page - 1, page + 1].filter(p => p >= 1 && p <= totalPages))
    const sorted = [...set].sort((a, b) => a - b)
    const result = []
    let prev = 0
    for (const n of sorted) {
      if (n - prev > 1) result.push('...')
      result.push(n)
      prev = n
    }
    return result
  }

  return (
    <div className="pagination">
      <button className="pagination__btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>←</button>
      {getPages().map((n, i) =>
        n === '...'
          ? <span key={`e${i}`} className="pagination__ellipsis">…</span>
          : <button key={n} className={`pagination__btn${page === n ? ' pagination__btn--active' : ''}`} onClick={() => onPageChange(n)}>{n}</button>
      )}
      <button className="pagination__btn" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>→</button>
    </div>
  )
}

const FilterSection = ({ title, sectionKey, open, onToggle, children }) => (
  <div className="filter-group">
    <div className="filter-group__header" onClick={() => onToggle(sectionKey)}>
      <span className="filter-group__arrow">{open ? '▾' : '▸'}</span>
      <span className="filter-group__title">{title}</span>
    </div>
    <div className={`filter-group__body${open ? ' filter-group__body--open' : ''}`}>
      {children}
    </div>
  </div>
)

const Search = () => {
  const dispatch = useAppDispatch()
  const { auth } = usePage().props
  const isStaff = auth?.user?.role === 'Администратор' || auth?.user?.role === 'Менеджер'
  const cartItems = useAppSelector(state => state.cart.items)

  // --- URL state (applied / committed) ---
  const params = new URLSearchParams(window.location.search)
  const qParam       = params.get('q') || ''
  const urlPage      = parseInt(params.get('page') || '1')
  const urlSortBy    = params.get('sortBy') || 'id'
  const urlSortDir   = params.get('sortDir') || 'asc'
  const urlMinPrice  = params.get('minPrice') || ''
  const urlMaxPrice  = params.get('maxPrice') || ''
  const urlInStock   = params.get('inStockOnly') === 'true'
  const urlOutStock  = params.get('outOfStockOnly') === 'true'
  const urlDiscount  = params.get('hasDiscount') === 'true'
  const urlMinRating = params.get('minRating') ? Number(params.get('minRating')) : null

  // --- Local (staged) state ---
  const [query,          setQuery]         = useState(qParam)
  const [localSortBy,    setLocalSortBy]   = useState(urlSortBy)
  const [localSortDir,   setLocalSortDir]  = useState(urlSortDir)
  const [localMinPrice,  setLocalMinPrice] = useState(urlMinPrice)
  const [localMaxPrice,  setLocalMaxPrice] = useState(urlMaxPrice)
  const [localInStock,   setLocalInStock]  = useState(urlInStock)
  const [localOutStock,  setLocalOutStock] = useState(urlOutStock)
  const [localDiscount,  setLocalDiscount] = useState(urlDiscount)
  const [localMinRating, setLocalMinRating] = useState(urlMinRating)
  const [priceError,     setPriceError]    = useState('')
  const [filtersOpen,    setFiltersOpen]   = useState(false)

  const [sectionsOpen, setSectionsOpen] = useState({
    availability: true, price: true, rating: true, sort: true,
  })
  const toggleSection = (key) => setSectionsOpen(prev => ({ ...prev, [key]: !prev[key] }))
  const isSectionOpen = (key) => sectionsOpen[key] !== false

  const [products,   setProducts]  = useState([])
  const [total,      setTotal]     = useState(0)
  const [isLoading,  setIsLoading] = useState(false)
  const [modalOpen,  setModalOpen] = useState(false)
  const [modalProduct, setModalProduct] = useState(null)
  const { message: toastMsg, visible: toastVisible, notify } = useCartToast()

  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Sync local state when URL changes
  useEffect(() => {
    setQuery(qParam)
    setLocalSortBy(urlSortBy)
    setLocalSortDir(urlSortDir)
    setLocalMinPrice(urlMinPrice)
    setLocalMaxPrice(urlMaxPrice)
    setLocalInStock(urlInStock)
    setLocalOutStock(urlOutStock)
    setLocalDiscount(urlDiscount)
    setLocalMinRating(urlMinRating)
    setPriceError('')
  }, [window.location.search])

  // Fetch products on URL change
  useEffect(() => {
    if (!qParam) { setProducts([]); setTotal(0); return }
    setIsLoading(true)
    requestsService.getProducts({
      q: qParam,
      sortBy: urlSortBy, sortDir: urlSortDir,
      minPrice: urlMinPrice !== '' ? Number(urlMinPrice) : null,
      maxPrice: urlMaxPrice !== '' ? Number(urlMaxPrice) : null,
      inStockOnly: urlInStock,
      outOfStockOnly: urlOutStock,
      hasDiscount: urlDiscount,
      minRating: urlMinRating,
      page: urlPage, limit: PAGE_SIZE,
    }).then(data => {
      setProducts(data?.data || [])
      setTotal(data?.total || 0)
    }).finally(() => setIsLoading(false))
  }, [window.location.search])

  const navigateWithParams = (newParams) => {
    const p = new URLSearchParams(window.location.search)
    p.delete('page')
    if (qParam) p.set('q', qParam)
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === undefined || val === '') p.delete(key)
      else p.set(key, String(val))
    })
    router.visit(`/search?${p.toString()}`, { preserveState: false })
  }

  const doSearch = (e) => {
    if (e) e.preventDefault()
    if (!query.trim()) return
    const p = new URLSearchParams()
    p.set('q', query.trim())
    if (localSortBy !== 'id')   p.set('sortBy', localSortBy)
    if (localSortDir !== 'asc') p.set('sortDir', localSortDir)
    if (localMinPrice)          p.set('minPrice', localMinPrice)
    if (localMaxPrice)          p.set('maxPrice', localMaxPrice)
    if (localInStock)           p.set('inStockOnly', 'true')
    if (localOutStock)          p.set('outOfStockOnly', 'true')
    if (localDiscount)          p.set('hasDiscount', 'true')
    if (localMinRating)         p.set('minRating', String(localMinRating))
    router.visit(`/search?${p.toString()}`, { preserveState: false })
  }

  const handleFilterEnter = (e) => { if (e.key === 'Enter') applyFilters() }

  const applyFilters = () => {
    const min = localMinPrice === '' ? null : Number(localMinPrice)
    const max = localMaxPrice === '' ? null : Number(localMaxPrice)
    if (min != null && max != null && !Number.isNaN(min) && !Number.isNaN(max) && min > max) {
      setPriceError('Мин. цена не может быть больше макс.')
      return
    }
    setPriceError('')
    navigateWithParams({
      sortBy:         localSortBy !== 'id'   ? localSortBy  : null,
      sortDir:        localSortDir !== 'asc' ? localSortDir : null,
      minPrice:       min,
      maxPrice:       max,
      inStockOnly:    localInStock  ? 'true' : null,
      outOfStockOnly: localOutStock ? 'true' : null,
      hasDiscount:    localDiscount ? 'true' : null,
      minRating:      localMinRating ?? null,
    })
  }

  const resetFilters = () => {
    setLocalSortBy('id'); setLocalSortDir('asc')
    setLocalMinPrice(''); setLocalMaxPrice('')
    setLocalInStock(false); setLocalOutStock(false); setLocalDiscount(false)
    setLocalMinRating(null); setPriceError('')
    const p = new URLSearchParams()
    if (qParam) p.set('q', qParam)
    router.visit(`/search?${p.toString()}`, { preserveState: false })
  }

  const handleLocalSort = (field) => {
    if (localSortBy === field) setLocalSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setLocalSortBy(field); setLocalSortDir('asc') }
  }

  const navigateToPage = (n) => {
    const p = new URLSearchParams(window.location.search)
    p.set('page', String(n))
    router.visit(`/search?${p.toString()}`, { preserveState: false })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const hasActiveFilters = urlMinPrice || urlMaxPrice || urlInStock || urlOutStock ||
    urlDiscount || urlMinRating || urlSortBy !== 'id'

  return (
    <div className="search-page">
      <div className="search-page__box">
        <form className="search-form" onSubmit={doSearch}>
          <input
            type="search"
            placeholder="Поиск по названию и описанию"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
            aria-label="Поиск по товарам"
          />
          <button type="submit" className="search-button" aria-label="Найти">
            <SearchLucide size={20} color="white" />
          </button>
        </form>
      </div>

      {qParam && (
        <>
          <button
            className={`products-page__filter-toggle${filtersOpen ? ' products-page__filter-toggle--open' : ''}`}
            onClick={() => setFiltersOpen(o => !o)}
          >
            Фильтры {filtersOpen ? '▴' : '▾'}
            {hasActiveFilters && <span className="products-page__filter-badge" />}
          </button>

          {!isLoading && total > 0 && (
            <div className="search-count">Найдено: {total} {total === 1 ? 'товар' : total < 5 ? 'товара' : 'товаров'}</div>
          )}

          <div className="products-page__container">
            <aside className={`products-page__sidebar${filtersOpen ? ' products-page__sidebar--open' : ''}`}>
              <div className="filters">
                <div className="filters__title-row">
                  <h3 className="filters__title">Фильтры</h3>
                  {hasActiveFilters && (
                    <button className="filters__active-badge" onClick={resetFilters}>Сброс</button>
                  )}
                </div>

                <FilterSection title="Сортировка" sectionKey="sort"
                  open={isSectionOpen('sort')} onToggle={toggleSection}>
                  <div className="sort-buttons">
                    {[
                      { key: 'name',       label: 'По названию' },
                      { key: 'price',      label: 'По цене' },
                      { key: 'rating',     label: 'По рейтингу' },
                      { key: 'popularity', label: 'По популярности' },
                    ].map(s => (
                      <button key={s.key}
                        className={`sort-btn${localSortBy === s.key ? ' active' : ''}`}
                        onClick={() => handleLocalSort(s.key)}>
                        {s.label}
                        {localSortBy === s.key && (localSortDir === 'asc' ? ' ↑' : ' ↓')}
                      </button>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection title="Наличие" sectionKey="availability"
                  open={isSectionOpen('availability')} onToggle={toggleSection}>
                  <label className="filter-check-label">
                    <input type="checkbox" className="filter-check-input"
                      checked={localInStock}
                      onChange={e => { setLocalInStock(e.target.checked); if (e.target.checked) setLocalOutStock(false) }} />
                    <span className="filter-check-box" />
                    <span>Только в наличии</span>
                  </label>
                  <label className="filter-check-label">
                    <input type="checkbox" className="filter-check-input"
                      checked={localOutStock}
                      onChange={e => { setLocalOutStock(e.target.checked); if (e.target.checked) setLocalInStock(false) }} />
                    <span className="filter-check-box" />
                    <span>Нет в наличии</span>
                  </label>
                  <label className="filter-check-label">
                    <input type="checkbox" className="filter-check-input"
                      checked={localDiscount}
                      onChange={e => setLocalDiscount(e.target.checked)} />
                    <span className="filter-check-box" />
                    <span>Со скидкой</span>
                  </label>
                </FilterSection>

                <FilterSection title="Цена (₽)" sectionKey="price"
                  open={isSectionOpen('price')} onToggle={toggleSection}>
                  <div className={`price-inputs${priceError ? ' has-error' : ''}`}>
                    <input type="number" placeholder="Мин" value={localMinPrice}
                      onChange={e => { setLocalMinPrice(e.target.value); if (priceError) setPriceError('') }}
                      onKeyDown={handleFilterEnter} />
                    <input type="number" placeholder="Макс" value={localMaxPrice}
                      onChange={e => { setLocalMaxPrice(e.target.value); if (priceError) setPriceError('') }}
                      onKeyDown={handleFilterEnter} />
                  </div>
                  {priceError && <div className="price-error">{priceError}</div>}
                </FilterSection>

                <FilterSection title="Рейтинг" sectionKey="rating"
                  open={isSectionOpen('rating')} onToggle={toggleSection}>
                  <div className="filter-rating-options">
                    {[5, 4, 3, 2, 1].map(val => (
                      <button
                        key={val}
                        className={`filter-rating-row${localMinRating === val ? ' active' : ''}`}
                        onClick={() => setLocalMinRating(localMinRating === val ? null : val)}
                      >
                        <Rating readonly initialValue={val} size={16} allowFraction={false}
                          SVGstyle={{ display: 'inline', verticalAlign: 'middle' }} />
                        <span className="filter-rating-label">и выше</span>
                      </button>
                    ))}
                  </div>
                </FilterSection>

                <div className="filters__actions">
                  <button className="filters__btn-reset" onClick={resetFilters}>Сбросить</button>
                  <button className="filters__btn-apply" onClick={applyFilters}>Применить</button>
                </div>
              </div>
            </aside>

            <div className="products-page__main">
              {isLoading ? (
                <div className="loading">Поиск...</div>
              ) : products.length > 0 ? (
                <>
                  <div className="products-grid">
                    {products.map(p => (
                      <Link key={p.id} href={`/products/${p.id}`} className="product-card__link">
                        <article className="product-card">
                          <div className="product-card__image-wrapper">
                            <img src={p.image} alt={p.name} className="product-card__image" />
                            {p.available_quantity === 0 && (
                              <div className="product-card__badge">Нет в наличии</div>
                            )}
                            {p.discount_percent > 0 && (
                              <div className="product-card__discount-badge">-{p.discount_percent}%</div>
                            )}
                          </div>
                          <h3 className="product-card__name">{p.name}</h3>
                          <p className="product-card__description">{p.description}</p>
                          {p.reviews_count > 0 && (
                            <div className="product-card__rating">
                              <Rating readonly initialValue={p.avg_rating} size={20} allowFraction
                                SVGstyle={{ display: 'inline' }} />
                              <span className="product-card__rating-count">{p.avg_rating} ({p.reviews_count})</span>
                            </div>
                          )}
                          <div className="product-card__actions">
                            {p.discount_percent > 0 ? (
                              <div className="product-card__price-block">
                                <span className="product-card__price--old">{p.price} ₽</span>
                                <span className="product-card__price--new">{p.discounted_price} ₽</span>
                              </div>
                            ) : (
                              <div className="product-card__price">{p.price} ₽</div>
                            )}
                            {isStaff ? (
                              <span className="product-card__staff-notice">Сотрудник не может заказать</span>
                            ) : (
                              <button
                                className="product-card__button"
                                disabled={p.available_quantity === 0}
                                onClick={e => { e.preventDefault(); e.stopPropagation(); setModalProduct(p); setModalOpen(true) }}
                              >
                                {p.available_quantity > 0 ? 'В корзину' : 'Нет в наличии'}
                              </button>
                            )}
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>
                  <Pagination page={urlPage} totalPages={totalPages} onPageChange={navigateToPage} />
                </>
              ) : (
                <div className="no-results">По запросу «{qParam}» ничего не найдено</div>
              )}
            </div>
          </div>
        </>
      )}

      <OrderModal
        open={modalOpen}
        product={modalProduct}
        initialQty={1}
        maxQty={Math.max(0, (modalProduct?.available_quantity || 0) - (cartItems.find(i => i.productId === modalProduct?.id)?.quantity || 0))}
        onCancel={() => setModalOpen(false)}
        onConfirm={(qty) => {
          if (!modalProduct) return
          if (!auth?.user) { router.visit('/login'); return }
          dispatch(addToCartAsync({ productId: modalProduct.id, quantity: qty }))
          setModalOpen(false)
          notify('Товар добавлен в корзину')
        }}
      />
      <CartToast visible={toastVisible} message={toastMsg} />
    </div>
  )
}

export default Search
