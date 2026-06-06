import React, { useEffect, useState } from 'react'
import { Link, router, usePage } from '@inertiajs/react'
import './products.scss'
import { requestsService } from '../api/api'
import OrderModal from '../Components/OrderModal'
import CartToast, { useCartToast } from '../Components/CartToast'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { addToCartAsync } from '../store/cartSlice'
import { Rating } from 'react-simple-star-rating'

const PAGE_SIZE = 15

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

const parseCharFilters = (search) => {
  try {
    const p = new URLSearchParams(search)
    const raw = p.get('charFilters')
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
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

const Products = () => {
  const dispatch = useAppDispatch()
  const { auth } = usePage().props
  const isStaff = auth?.user?.role === 'Администратор' || auth?.user?.role === 'Менеджер'
  const cartItems = useAppSelector(state => state.cart.items)

  const [parentCategory, setParentCategory] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalProduct, setModalProduct] = useState(null)
  const { message: toastMsg, visible: toastVisible, notify } = useCartToast()
  const [categories, setCategories] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [charTemplates, setCharTemplates] = useState([])

  const [sectionsOpen, setSectionsOpen] = useState({
    availability: true,
    price: true,
    rating: true,
    sort: true,
  })
  const toggleSection = (key) =>
    setSectionsOpen(prev => ({ ...prev, [key]: !prev[key] }))
  const isSectionOpen = (key) => sectionsOpen[key] !== false

  // --- URL state (applied / committed) ---
  const params = new URLSearchParams(window.location.search)
  const categoryId   = params.get('categoryId') ? parseInt(params.get('categoryId')) : null
  const urlPage      = params.get('page') ? parseInt(params.get('page')) : 1
  const urlSortBy    = params.get('sortBy') || 'id'
  const urlSortDir   = params.get('sortDir') || 'asc'
  const urlMinPrice  = params.get('minPrice') !== null && params.get('minPrice') !== '' ? params.get('minPrice') : ''
  const urlMaxPrice  = params.get('maxPrice') !== null && params.get('maxPrice') !== '' ? params.get('maxPrice') : ''
  const urlInStock   = params.get('inStockOnly') === 'true'
  const urlOutStock  = params.get('outOfStockOnly') === 'true'
  const urlDiscount  = params.get('hasDiscount') === 'true'
  const urlMinRating = params.get('minRating') ? Number(params.get('minRating')) : null
  const urlCharFilters = parseCharFilters(window.location.search)

  // --- Local (staged) state ---
  const [localSortBy,   setLocalSortBy]   = useState(urlSortBy)
  const [localSortDir,  setLocalSortDir]  = useState(urlSortDir)
  const [localMinPrice, setLocalMinPrice] = useState(urlMinPrice)
  const [localMaxPrice, setLocalMaxPrice] = useState(urlMaxPrice)
  const [localInStock,  setLocalInStock]  = useState(urlInStock)
  const [localOutStock, setLocalOutStock] = useState(urlOutStock)
  const [localDiscount, setLocalDiscount] = useState(urlDiscount)
  const [localMinRating, setLocalMinRating] = useState(urlMinRating)
  const [localCharFilters, setLocalCharFilters] = useState(urlCharFilters)
  const [priceError, setPriceError] = useState('')

  // Sync local state when URL changes (after navigation)
  useEffect(() => {
    setLocalSortBy(urlSortBy)
    setLocalSortDir(urlSortDir)
    setLocalMinPrice(urlMinPrice)
    setLocalMaxPrice(urlMaxPrice)
    setLocalInStock(urlInStock)
    setLocalOutStock(urlOutStock)
    setLocalDiscount(urlDiscount)
    setLocalMinRating(urlMinRating)
    setLocalCharFilters(parseCharFilters(window.location.search))
    setPriceError('')
  }, [window.location.search])

  useEffect(() => {
    requestsService.getCategories().then(data => setCategories(data || []))
  }, [])

  useEffect(() => {
    if (categoryId) {
      requestsService.getCharTemplates(categoryId).then(data => {
        const filterable = (data || []).filter(t => t.isFilterable)
        setCharTemplates(filterable)
        setSectionsOpen(prev => {
          const next = { ...prev }
          filterable.forEach(t => { if (next[`char_${t.id}`] === undefined) next[`char_${t.id}`] = true })
          return next
        })
      })
    } else {
      setCharTemplates([])
    }
  }, [categoryId])

  useEffect(() => {
    setIsLoading(true)
    const minPrice = urlMinPrice !== '' ? Number(urlMinPrice) : null
    const maxPrice = urlMaxPrice !== '' ? Number(urlMaxPrice) : null
    requestsService.getProducts({
      categoryId, sortBy: urlSortBy, sortDir: urlSortDir,
      minPrice, maxPrice,
      inStockOnly: urlInStock, outOfStockOnly: urlOutStock, hasDiscount: urlDiscount,
      minRating: urlMinRating,
      charFilters: urlCharFilters,
      page: urlPage, limit: PAGE_SIZE,
    }).then(data => {
      setAllProducts(data?.data || [])
      setTotal(data?.total || 0)
    }).finally(() => setIsLoading(false))
  }, [window.location.search])

  useEffect(() => {
    if (categoryId && categories.length > 0)
      setParentCategory(categories.find(c => c.id === categoryId) || null)
  }, [categoryId, categories])

  const navigateWithParams = (newParams) => {
    const p = new URLSearchParams(window.location.search)
    p.delete('page')
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === undefined || val === '' ||
          (typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length === 0)) {
        p.delete(key)
      } else {
        p.set(key, typeof val === 'object' ? JSON.stringify(val) : String(val))
      }
    })
    router.visit(`/products?${p.toString()}`, { preserveState: false })
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

    // Зажимаем range-фильтры по характеристикам до границ шаблона
    const clampedCharFilters = { ...localCharFilters }
    charTemplates.forEach(tpl => {
      if (tpl.type !== 'range') return
      const id  = String(tpl.id)
      const entry = clampedCharFilters[id]
      if (!entry) return
      const lo = tpl.options?.min != null ? Number(tpl.options.min) : null
      const hi = tpl.options?.max != null ? Number(tpl.options.max) : null
      const clampVal = v => {
        if (v === '' || v == null) return v
        const n = Number(v)
        if (lo != null && n < lo) return String(lo)
        if (hi != null && n > hi) return String(hi)
        return v
      }
      clampedCharFilters[id] = {
        ...entry,
        ...(entry.min != null ? { min: clampVal(entry.min) } : {}),
        ...(entry.max != null ? { max: clampVal(entry.max) } : {}),
      }
    })

    navigateWithParams({
      sortBy:         localSortBy !== 'id'  ? localSortBy  : null,
      sortDir:        localSortDir !== 'asc' ? localSortDir : null,
      minPrice:       min,
      maxPrice:       max,
      inStockOnly:    localInStock   ? 'true' : null,
      outOfStockOnly: localOutStock  ? 'true' : null,
      hasDiscount:    localDiscount  ? 'true' : null,
      minRating:      localMinRating ?? null,
      charFilters:    clampedCharFilters,
    })
  }

  const resetFilters = () => {
    setLocalSortBy('id');   setLocalSortDir('asc')
    setLocalMinPrice('');   setLocalMaxPrice('')
    setLocalInStock(false); setLocalOutStock(false); setLocalDiscount(false)
    setLocalMinRating(null)
    setLocalCharFilters({})
    setPriceError('')
    const p = new URLSearchParams(window.location.search)
    ;['sortBy','sortDir','minPrice','maxPrice','inStockOnly','outOfStockOnly',
      'hasDiscount','minRating','charFilters','page'].forEach(k => p.delete(k))
    router.visit(`/products?${p.toString()}`, { preserveState: false })
  }

  const navigateToPage = (n) => {
    const p = new URLSearchParams(window.location.search)
    p.set('page', String(n))
    router.visit(`/products?${p.toString()}`, { preserveState: false })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLocalSort = (field) => {
    if (localSortBy === field) setLocalSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setLocalSortBy(field); setLocalSortDir('asc') }
  }

  const setCharSelectValue = (name, value, checked) => {
    setLocalCharFilters(prev => {
      const existing = prev[name]?.values || []
      const next = checked ? [...existing, value] : existing.filter(v => v !== value)
      if (next.length === 0) { const { [name]: _, ...rest } = prev; return rest }
      return { ...prev, [name]: { values: next } }
    })
  }

  const setCharRangeValue = (name, key, value) => {
    setLocalCharFilters(prev => {
      const existing = prev[name] || {}
      const next = { ...existing, [key]: value }
      if (next.min === '' && next.max === '') { const { [name]: _, ...rest } = prev; return rest }
      return { ...prev, [name]: next }
    })
  }

  const setCharBoolValue = (name, checked) => {
    setLocalCharFilters(prev => {
      if (!checked) { const { [name]: _, ...rest } = prev; return rest }
      return { ...prev, [name]: { bool: true } }
    })
  }

  const hasActiveFilters = urlMinPrice || urlMaxPrice || urlInStock || urlOutStock ||
    urlDiscount || urlMinRating || Object.keys(urlCharFilters).length > 0 || urlSortBy !== 'id'

  const [filtersOpen, setFiltersOpen] = useState(false)

  const totalPages = Math.ceil(total / PAGE_SIZE)

  if (isLoading) return <div className="loading">Загрузка товаров...</div>

  const pageTitle = parentCategory ? parentCategory.name : 'Все товары'

  return (
    <div className="products-page">
      <div className="products-page__header">
        <h1 className="products-page__title">{pageTitle}</h1>
        <button className="products-page__back-button" onClick={() => router.visit('/catalog')}>
          ← К каталогу
        </button>
      </div>

      <button
        className={`products-page__filter-toggle${filtersOpen ? ' products-page__filter-toggle--open' : ''}`}
        onClick={() => setFiltersOpen(o => !o)}
      >
        Фильтры {filtersOpen ? '▴' : '▾'}
        {hasActiveFilters && <span className="products-page__filter-badge" />}
      </button>

      <div className="products-page__container">
        <aside className={`products-page__sidebar${filtersOpen ? ' products-page__sidebar--open' : ''}`}>
          <div className="filters">
            <div className="filters__title-row">
              <h3 className="filters__title">Фильтры</h3>
              {hasActiveFilters && (
                <button className="filters__active-badge" onClick={resetFilters}>
                  Сброс
                </button>
              )}
            </div>

            {/* Сортировка */}
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

            {/* Наличие */}
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

            {/* Цена */}
            <FilterSection title="Цена (₽)" sectionKey="price"
              open={isSectionOpen('price')} onToggle={toggleSection}>
              <div className={`price-inputs ${priceError ? 'has-error' : ''}`}>
                <input type="number" placeholder="Мин" value={localMinPrice}
                  onChange={e => { setLocalMinPrice(e.target.value); if (priceError) setPriceError('') }}
                  onKeyDown={handleFilterEnter} />
                <input type="number" placeholder="Макс" value={localMaxPrice}
                  onChange={e => { setLocalMaxPrice(e.target.value); if (priceError) setPriceError('') }}
                  onKeyDown={handleFilterEnter} />
              </div>
              {priceError && <div className="price-error">{priceError}</div>}
            </FilterSection>

            {/* Рейтинг */}
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

            {/* Dynamic characteristic filters */}
            {charTemplates.map(tpl => (
              <FilterSection key={tpl.id} title={tpl.name}
                sectionKey={`char_${tpl.id}`}
                open={isSectionOpen(`char_${tpl.id}`)} onToggle={toggleSection}>

                {tpl.type === 'select' && Array.isArray(tpl.options) && (
                  <div className="filter-char-options">
                    {tpl.options.map(opt => (
                      <label key={opt} className="filter-check-label">
                        <input type="checkbox" className="filter-check-input"
                          checked={(localCharFilters[String(tpl.id)]?.values || []).includes(opt)}
                          onChange={e => setCharSelectValue(String(tpl.id), opt, e.target.checked)} />
                        <span className="filter-check-box" />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {tpl.type === 'range' && (() => {
                  const absMin = tpl.options?.min != null ? Number(tpl.options.min) : null
                  const absMax = tpl.options?.max != null ? Number(tpl.options.max) : null
                  const clamp  = (v, lo, hi) => {
                    if (v === '' || v == null) return v
                    const n = Number(v)
                    if (lo != null && n < lo) return String(lo)
                    if (hi != null && n > hi) return String(hi)
                    return String(v)
                  }
                  const id = String(tpl.id)
                  const curMin = localCharFilters[id]?.min ?? ''
                  const curMax = localCharFilters[id]?.max ?? ''
                  return (
                    <div className="filter-char-range">
                      <input
                        type="number"
                        placeholder={absMin != null ? `От ${absMin}` : 'От'}
                        value={curMin}
                        min={absMin ?? undefined}
                        max={absMax ?? undefined}
                        onChange={e => setCharRangeValue(id, 'min', e.target.value)}
                        onBlur={e => {
                          const clamped = clamp(e.target.value, absMin, absMax)
                          if (clamped !== e.target.value) setCharRangeValue(id, 'min', clamped)
                        }}
                        onKeyDown={handleFilterEnter}
                      />
                      <input
                        type="number"
                        placeholder={absMax != null ? `До ${absMax}` : 'До'}
                        value={curMax}
                        min={absMin ?? undefined}
                        max={absMax ?? undefined}
                        onChange={e => setCharRangeValue(id, 'max', e.target.value)}
                        onBlur={e => {
                          const clamped = clamp(e.target.value, absMin, absMax)
                          if (clamped !== e.target.value) setCharRangeValue(id, 'max', clamped)
                        }}
                        onKeyDown={handleFilterEnter}
                      />
                      {tpl.options?.unit && <span className="filter-char-unit">{tpl.options.unit}</span>}
                    </div>
                  )
                })()}

                {tpl.type === 'boolean' && (
                  <label className="filter-check-label">
                    <input type="checkbox" className="filter-check-input"
                      checked={!!localCharFilters[String(tpl.id)]?.bool}
                      onChange={e => setCharBoolValue(String(tpl.id), e.target.checked)} />
                    <span className="filter-check-box" />
                    <span>Да</span>
                  </label>
                )}
              </FilterSection>
            ))}

            {/* Single Apply / Reset row */}
            <div className="filters__actions">
              <button className="filters__btn-reset" onClick={resetFilters}>Сбросить</button>
              <button className="filters__btn-apply" onClick={applyFilters}>Применить</button>
            </div>
          </div>
        </aside>

        <div className="products-page__main">
          {allProducts.length > 0 ? (
            <>
              <div className="products-grid">
                {allProducts.map(product => (
                  <Link key={product.id} href={`/products/${product.id}`} className="product-card__link">
                    <article className="product-card">
                      <div className="product-card__image-wrapper">
                        <img src={product.image} alt={product.name} className="product-card__image" />
                        {product.available_quantity === 0 && (
                          <div className="product-card__badge">Нет в наличии</div>
                        )}
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
                            onClick={e => { e.preventDefault(); e.stopPropagation(); setModalProduct(product); setModalOpen(true) }}
                          >
                            {product.available_quantity > 0 ? 'В корзину' : 'Нет в наличии'}
                          </button>
                        )}
                      </div>
                    </article>
                  </Link>
                ))}
              </div>

              <Pagination page={urlPage} totalPages={totalPages} onPageChange={navigateToPage} />

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
            </>
          ) : (
            <div className="products-page__empty">
              <p>Товары не найдены</p>
              <button className="btn-primary" onClick={() => router.visit('/catalog')}>Вернуться в каталог</button>
            </div>
          )}
        </div>
      </div>
      <CartToast visible={toastVisible} message={toastMsg} />
    </div>
  )
}

export default Products
