import React, { useState, useEffect, useRef, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './admin.scss'
import { usePage, Link, router } from '@inertiajs/react'
import { useSelector } from 'react-redux'
import { useAppDispatch } from '../store/hooks'
import { setPage, setLimit, setTotal, setSort, setSortExplicit } from '../store/ordersSlice'
import { requestsService } from '../api/api'
import { Rating } from 'react-simple-star-rating'
import { X, Plus, ZoomIn, Eye, EyeOff, Trash2, AlertTriangle } from 'lucide-react'
import { IMaskInput } from 'react-imask'

const formatPhoneInput = (value) => {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length <= 2) return cleaned
  if (cleaned.length <= 5) return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 2)}) ${cleaned.slice(2)}`
  if (cleaned.length <= 8) return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 3)}) ${cleaned.slice(3, 5)}-${cleaned.slice(5)}`
  return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 3)}) ${cleaned.slice(3, 5)}-${cleaned.slice(5, 7)}-${cleaned.slice(7, 11)}`
}

const ImagePreviewLightbox = ({ url, onClose }) => {
  if (!url) return null
  return (
    <div className="image-preview-overlay" onClick={onClose}>
      <button
        type="button"
        className="image-preview-close"
        onClick={onClose}
        aria-label="Закрыть"
      >
        <X size={22} strokeWidth={2.4} />
      </button>
      <img src={url} alt="" className="image-preview-img" onClick={e => e.stopPropagation()} />
    </div>
  )
}

// Multi-image manager component
const ImageManager = ({ images, onChange, maxImages = 10, onError }) => {
  const fileInputRef = useRef(null)
  const dragItem = useRef(null)
  const dragOverItem = useRef(null)
  const [enlargedUrl, setEnlargedUrl] = useState(null)

  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

  const handleAdd = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    const invalid = files.filter(f => !ALLOWED_TYPES.includes(f.type))
    if (invalid.length > 0) {
      onError?.('SVG не поддерживается. Допустимые форматы: JPG, PNG, GIF, WEBP')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    const remaining = maxImages - images.length
    const toAdd = files.slice(0, remaining).map(file => ({
      isNew: true,
      file,
      url: URL.createObjectURL(file),
    }))
    onChange([...images, ...toAdd])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemove = (idx) => {
    onChange(images.filter((_, i) => i !== idx))
  }

  const handleDragStart = (idx) => { dragItem.current = idx }
  const handleDragEnter = (idx) => { dragOverItem.current = idx }
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return
    const newImages = [...images]
    const draggedItem = newImages.splice(dragItem.current, 1)[0]
    newImages.splice(dragOverItem.current, 0, draggedItem)
    dragItem.current = null
    dragOverItem.current = null
    onChange(newImages)
  }

  return (
    <>
      <div className="image-manager">
        <div className="image-manager__list">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="image-manager__item"
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragEnd={handleDragEnd}
              onDragOver={e => e.preventDefault()}
            >
              <img src={img.url} alt="" className="image-manager__thumb" />
              {idx === 0 && <span className="image-manager__main-label">Главное</span>}
              <button
                type="button"
                className="image-manager__zoom"
                onClick={(e) => { e.stopPropagation(); setEnlargedUrl(img.url) }}
                title="Просмотр"
                aria-label="Просмотр"
              >
                <ZoomIn size={14} strokeWidth={2.2} />
              </button>
              <button
                type="button"
                className="image-manager__remove"
                onClick={() => handleRemove(idx)}
                aria-label="Удалить"
              >
                <X size={14} strokeWidth={2.6} />
              </button>
            </div>
          ))}
          {images.length < maxImages && (
            <div
              className="image-manager__add"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
            >
              <Plus size={28} strokeWidth={2} />
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" multiple onChange={handleAdd} style={{ display: 'none' }} />
            </div>
          )}
        </div>
        <div className="image-manager__hint">Перетащите для изменения порядка. Первое фото — главное.</div>
      </div>
      <ImagePreviewLightbox url={enlargedUrl} onClose={() => setEnlargedUrl(null)} />
    </>
  )
}

const SingleImagePicker = ({ image, onChange, onError, width = 220, height = 220 }) => {
  const fileInputRef = useRef(null)
  const [enlarged, setEnlarged] = useState(false)
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

  const handleSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      onError?.('Допустимые форматы: JPG, PNG, GIF, WEBP')
      e.target.value = ''
      return
    }
    onChange({ file, url: URL.createObjectURL(file) })
    e.target.value = ''
  }

  const handleRemove = (e) => {
    e.stopPropagation()
    onChange(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <>
      <div className="image-manager">
        <div className="image-manager__list">
          {image ? (
            <div
              className="image-manager__item image-manager__item--single"
              style={{ width, height, cursor: 'zoom-in' }}
              onClick={() => setEnlarged(true)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setEnlarged(true)}
              title="Нажмите, чтобы увеличить"
            >
              <img src={image.url} alt="" className="image-manager__thumb" />
              <button
                type="button"
                className="image-manager__remove"
                onClick={handleRemove}
                aria-label="Удалить"
              >
                <X size={16} strokeWidth={2.6} />
              </button>
            </div>
          ) : (
            <div
              className="image-manager__add image-manager__add--single"
              style={{ width, height }}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
            >
              <Plus size={36} strokeWidth={1.8} />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleSelect}
                style={{ display: 'none' }}
              />
            </div>
          )}
        </div>
      </div>

      <ImagePreviewLightbox url={enlarged && image ? image.url : null} onClose={() => setEnlarged(false)} />
    </>
  )
}

const CharValueInput = ({ ch, templates, onValueChange, error }) => {
  const tpl = ch._tpl || (templates || []).find(t => t.name === ch.name)
  const cls = `admin-edit-input${error ? ' admin-edit-input--error' : ''}`
  if (!tpl || tpl.type === 'text') {
    return <input className={cls} placeholder="Значение" type="text" value={ch.value} onChange={e => onValueChange(e.target.value)} />
  }
  if (tpl.type === 'select') {
    return (
      <select className={cls} value={ch.value} onChange={e => onValueChange(e.target.value)}>
        <option value="">— выберите —</option>
        {(tpl.options || []).map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }
  if (tpl.type === 'boolean') {
    return (
      <select className={cls} value={ch.value} onChange={e => onValueChange(e.target.value)}>
        <option value="">— выберите —</option>
        <option value="Да">Да</option>
        <option value="Нет">Нет</option>
      </select>
    )
  }
  const rangeMin = tpl.options?.min != null && tpl.options.min !== '' ? Number(tpl.options.min) : null
  const rangeMax = tpl.options?.max != null && tpl.options.max !== '' ? Number(tpl.options.max) : null
  const rangeUnit = tpl.options?.unit ?? ''
  const handleRangeBlur = (e) => {
    const val = parseFloat(e.target.value)
    if (isNaN(val)) return
    if (rangeMin !== null && val < rangeMin) { onValueChange(String(rangeMin)); return }
    if (rangeMax !== null && val > rangeMax) { onValueChange(String(rangeMax)) }
  }
  return (
    <input className={cls} type="number"
      placeholder={`${rangeMin ?? ''}–${rangeMax ?? ''} ${rangeUnit}`}
      min={rangeMin ?? undefined}
      max={rangeMax ?? undefined}
      value={ch.value}
      onChange={e => onValueChange(e.target.value)}
      onBlur={handleRangeBlur}
    />
  )
}

const orderDeliveryLabel = (method, carrier) => {
  if (method === 'pickup') return 'Самовывоз'
  if (method === 'delivery') {
    const c = carrier === 'pochta' ? 'Почта России' : carrier === 'sdek' ? 'СДЭК' : ''
    return c ? `Доставка · ${c}` : 'Доставка'
  }
  return '—'
}

const pendingOrdersPhrase = (n) => {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return `${n} заказ ещё не обработан`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} заказа ещё не обработаны`
  return `${n} заказов ещё не обработано`
}

const ConfirmModal = ({ open, title, message, confirmLabel = 'Удалить', variant = 'danger', onConfirm, onCancel }) => {
  if (!open) return null
  const Icon = variant === 'warning' ? AlertTriangle : Trash2
  return (
    <div className="admin-modal-overlay" onMouseDown={onCancel}>
      <div className="admin-confirm-modal" onMouseDown={e => e.stopPropagation()}>
        <div className={`admin-confirm-modal__header admin-confirm-modal__header--${variant}`}>
          <Icon size={20} className="admin-confirm-modal__icon" />
          <h3 className="admin-confirm-modal__title">{title}</h3>
        </div>
        {message && <div className="admin-confirm-modal__body"><p>{message}</p></div>}
        <div className="admin-confirm-modal__footer">
          <button className="admin-confirm-modal__btn admin-confirm-modal__btn--cancel" onClick={onCancel}>Отмена</button>
          <button className={`admin-confirm-modal__btn admin-confirm-modal__btn--${variant}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

const AdminPanel = () => {
  const { auth } = usePage().props
  const userId = auth?.user?.id
  const userRole = auth?.user?.role
  const isAdmin = userRole === 'Администратор'
  const isManager = userRole === 'Менеджер'
  const hasAccess = isAdmin || isManager

  const ordersState = useSelector(s => s.ordersTable)
  const dispatch = useAppDispatch()
  const [ordersPageData, setOrdersPageData] = useState({ data: [], total: 0 })
  const [ordersPending, setOrdersPending] = useState(0)
  const [activeTab, setActiveTab] = useState(isAdmin ? 'users' : 'products')

  // Admin filter states
  const [categorySearch, setCategorySearch] = useState('')
  const [productsSearchInput, setProductsSearchInput] = useState('')
  const [productsSearch, setProductsSearch] = useState('')
  const [productsFilterDiscount, setProductsFilterDiscount] = useState(false)
  const [productsFilterStock, setProductsFilterStock] = useState('')
  const [productsFilterCategory, setProductsFilterCategory] = useState('')
  const [productsFilterPhoto, setProductsFilterPhoto] = useState(false)
  const [ordersSearchInput, setOrdersSearchInput] = useState('')
  const [ordersSearch, setOrdersSearch] = useState('')
  const [ordersStatus, setOrdersStatus] = useState('')
  const [ordersDelivery, setOrdersDelivery] = useState('')
  const [ordersDateFrom, setOrdersDateFrom] = useState('')
  const [ordersDateTo, setOrdersDateTo] = useState('')
  const [reviewRating, setReviewRating] = useState('')
  const [reviewHasPhoto, setReviewHasPhoto] = useState('')
  const [reviewStatusFilter, setReviewStatusFilter] = useState('')
  const [reviewPendingCount, setReviewPendingCount] = useState(0)
  const [reviewLightboxUrl, setReviewLightboxUrl] = useState(null)
  const [reviewUserDeleteModal, setReviewUserDeleteModal] = useState({ open: false, reviewId: null, userId: null })

  useEffect(() => {
    if (activeTab !== 'orders') return
    let mounted = true
    const fetchOrders = async () => {
      try {
        const params = { page: ordersState.page, limit: ordersState.limit, sortBy: ordersState.sortBy, sortDir: ordersState.sortDir, q: ordersSearch || undefined, status: ordersStatus || undefined, deliveryMethod: ordersDelivery || undefined, dateFrom: ordersDateFrom || undefined, dateTo: ordersDateTo || undefined }
        const resp = await requestsService.getOrders(params)
        if (!mounted) return
        setOrdersPageData({ data: resp.data || [], total: resp.total || 0 })
        setOrdersPending(resp.pendingCount || 0)
        dispatch(setTotal(resp.total || 0))
      } catch {}
    }
    fetchOrders()
    return () => { mounted = false }
  }, [activeTab, ordersState.page, ordersState.limit, ordersState.sortBy, ordersState.sortDir, ordersSearch, ordersStatus, ordersDelivery, ordersDateFrom, ordersDateTo, dispatch])

  const [users, setUsers] = useState([])
  const [usersPage, setUsersPage] = useState(1)
  const [usersLimit, setUsersLimit] = useState(5)
  const [usersRoleFilter, setUsersRoleFilter] = useState('')
  const [addStaffModal, setAddStaffModal] = useState(false)
  const [addStaffForm, setAddStaffForm] = useState({ firstName: '', lastName: '', middleName: '', emailOrLogin: '', phone: '', password: '', confirmPassword: '', role: 'Менеджер' })
  const [addStaffErrors, setAddStaffErrors] = useState({})
  const [addStaffLoading, setAddStaffLoading] = useState(false)
  const [addStaffShowPwd, setAddStaffShowPwd] = useState(false)
  const [addStaffShowConfirm, setAddStaffShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [categoriesPage, setCategoriesPage] = useState(1)
  const [categoriesLimit, setCategoriesLimit] = useState(5)
  const [categoryAddModal, setCategoryAddModal] = useState(false)
  const [categoryAddForm, setCategoryAddForm] = useState({ name: '', description: '', parentId: '', imageFile: null, imagePreview: '' })
  const [categoryAddErrors, setCategoryAddErrors] = useState({})
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null })
  const [categoryDeleteModal, setCategoryDeleteModal] = useState({ open: false, id: null })
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [categoryEditForm, setCategoryEditForm] = useState({})
  const [categoryEditErrors, setCategoryEditErrors] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [editErrors, setEditErrors] = useState({})
  const [toast, setToast] = useState({ show: false, message: '' })
  const [sortBy, setSortBy] = useState('id')
  const [sortDir, setSortDir] = useState('asc')
  const [categoriesSortBy, setCategoriesSortBy] = useState('id')
  const [categoriesSortDir, setCategoriesSortDir] = useState('asc')
  const [productsPageData, setProductsPageData] = useState({ data: [], total: 0 })
  const [productsPage, setProductsPage] = useState(1)
  const [productsLimit, setProductsLimit] = useState(5)
  const [productsSortBy, setProductsSortBy] = useState('id')
  const [productsSortDir, setProductsSortDir] = useState('asc')
  const [editingProductId, setEditingProductId] = useState(null)
  const [productEditModal, setProductEditModal] = useState(false)
  const [productEditForm, setProductEditForm] = useState({})
  const [productEditErrors, setProductEditErrors] = useState({})
  const [productDeleteModal, setProductDeleteModal] = useState({ open: false, id: null })
  const [productAddModal, setProductAddModal] = useState(false)
  const [productAddForm, setProductAddForm] = useState({ name: '', price: 0, available_quantity: 0, discount_percent: 0, description: '', category: '', images: [], characteristics: [] })
  const [productAddErrors, setProductAddErrors] = useState({})
  const [productAddTab, setProductAddTab] = useState('basic')
  const [productEditTab, setProductEditTab] = useState('basic')
  const [productsRefresh, setProductsRefresh] = useState(0)
  const [editingOrderId, setEditingOrderId] = useState(null)
  const [orderEditForm, setOrderEditForm] = useState({ status: '', deliveryMethod: '', deliveryCarrier: '', deliveryAddress: '' })
  const [orderCancelModal, setOrderCancelModal] = useState({ open: false, id: null })

  // Characteristic templates state
  const [charTemplates, setCharTemplates] = useState([])
  const [charTemplatesRefresh, setCharTemplatesRefresh] = useState(0)
  const [charTemplateDeleteModal, setCharTemplateDeleteModal] = useState({ open: false, id: null })
  const [charTemplateModal, setCharTemplateModal] = useState({ open: false, editing: null })
  const [charTemplateForm, setCharTemplateForm] = useState({ categoryId: '', name: '', type: 'text', options: null, isFilterable: false })
  const [charTemplateErrors, setCharTemplateErrors] = useState({})
  const [charTplSearch, setCharTplSearch] = useState('')
  const [charTplCategoryFilter, setCharTplCategoryFilter] = useState('')
  const [charTplSortBy, setCharTplSortBy] = useState('id')
  const [charTplSortDir, setCharTplSortDir] = useState('asc')
  const [charTplPage, setCharTplPage] = useState(1)
  const [charTplLimit, setCharTplLimit] = useState(10)
  // Available templates for datalist suggestions in characteristics
  const [availableAddTemplates, setAvailableAddTemplates] = useState([])
  const [availableEditTemplates, setAvailableEditTemplates] = useState([])

  // Reviews state
  const [reviewsData, setReviewsData] = useState({ data: [], total: 0 })
  const [reviewsPage, setReviewsPage] = useState(1)
  const [reviewsLimit, setReviewsLimit] = useState(10)
  const [reviewsSortBy, setReviewsSortBy] = useState('id')
  const [reviewsSortDir, setReviewsSortDir] = useState('desc')
  const [reviewSearchInput, setReviewSearchInput] = useState('')
  const [reviewSearch, setReviewSearch] = useState('')
  const [reviewProductSearchInput, setReviewProductSearchInput] = useState('')
  const [reviewProductSearch, setReviewProductSearch] = useState('')
  const [reviewDateFrom, setReviewDateFrom] = useState('')
  const [reviewDateTo, setReviewDateTo] = useState('')
  const [reviewViewModal, setReviewViewModal] = useState({ open: false, review: null })
  const [reviewDeleteModal, setReviewDeleteModal] = useState({ open: false, id: null })

  // Slides state
  const [slidesData, setSlidesData] = useState({ data: [], total: 0 })
  const [slidesPage, setSlidesPage] = useState(1)
  const [slidesLimit, setSlidesLimit] = useState(10)
  const [slidesSortBy, setSlidesSortBy] = useState('created_at')
  const [slidesSortDir, setSlidesSortDir] = useState('desc')
  const [slideSearchInput, setSlideSearchInput] = useState('')
  const [slideSearch, setSlideSearch] = useState('')
  const [slideModal, setSlideModal] = useState({ open: false, editing: null })
  const [slideForm, setSlideForm] = useState({ title: '', description: '', link: '', imageFile: null, imagePreview: '' })
  const [slideErrors, setSlideErrors] = useState({})
  const [slideDeleteModal, setSlideDeleteModal] = useState({ open: false, id: null })

  // Statistics tab
  const [statsMode, setStatsMode] = useState('category')
  const [statsCategory, setStatsCategory] = useState('')
  const [statsProductQuery, setStatsProductQuery] = useState('')
  const [statsProductResults, setStatsProductResults] = useState([])
  const [statsProductSearching, setStatsProductSearching] = useState(false)
  const [statsSelectedProduct, setStatsSelectedProduct] = useState(null)
  const [statsGroupBy, setStatsGroupBy] = useState('month')
  const [statsDateFrom, setStatsDateFrom] = useState('')
  const [statsDateTo, setStatsDateTo] = useState('')
  const [statsSource, setStatsSource] = useState('')
  const [statsData, setStatsData] = useState([])
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsTarget, setStatsTarget] = useState(null)

  // Add sale modal
  const [addSaleModal, setAddSaleModal] = useState(false)
  const [addSaleDate, setAddSaleDate] = useState(new Date().toISOString().split('T')[0])
  const [addSaleItems, setAddSaleItems] = useState([])
  const [addSaleProductQuery, setAddSaleProductQuery] = useState('')
  const [addSaleProductResults, setAddSaleProductResults] = useState([])
  const [addSaleSearching, setAddSaleSearching] = useState(false)
  const [addSaleShowSearch, setAddSaleShowSearch] = useState(false)
  const [addSaleLoading, setAddSaleLoading] = useState(false)

  const statsSearchTimeout = useRef(null)
  const saleSearchTimeout = useRef(null)

  useEffect(() => {
    if (!hasAccess) return
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        if (isAdmin) {
          const data = await requestsService.getAllUsers()
          if (mounted) setUsers(data || [])
        }
        const cats = await requestsService.getCategories()
        if (mounted) setCategories(cats || [])
      } catch {} finally { setLoading(false) }
    }
    load()
    return () => { mounted = false }
  }, [isAdmin, hasAccess])

  // Load pending counts for sidebar badges immediately on entering the panel
  useEffect(() => {
    if (!hasAccess) return
    let mounted = true
    const loadBadges = async () => {
      try {
        const [ordersResp, reviewsResp] = await Promise.all([
          requestsService.getOrders({ limit: 1 }),
          requestsService.getAdminReviews({ limit: 1 }),
        ])
        if (!mounted) return
        if (ordersResp?.pendingCount !== undefined) setOrdersPending(ordersResp.pendingCount)
        if (reviewsResp?.pendingCount !== undefined) setReviewPendingCount(reviewsResp.pendingCount)
      } catch {}
    }
    loadBadges()
    return () => { mounted = false }
  }, [hasAccess])

  useEffect(() => {
    if (activeTab !== 'products') return
    let mounted = true
    const load = async () => {
      try {
        const params = {
          page: productsPage, limit: productsLimit, sortBy: productsSortBy, sortDir: productsSortDir,
          q: productsSearch || undefined,
          categoryId: productsFilterCategory || undefined,
          inStockOnly: productsFilterStock === 'inStock' ? true : undefined,
          outOfStockOnly: productsFilterStock === 'outOfStock' ? true : undefined,
          hasDiscount: productsFilterDiscount || undefined,
          noPhoto: productsFilterPhoto || undefined,
        }
        const resp = await requestsService.getProducts(params)
        if (!mounted) return
        setProductsPageData({ data: resp.data || [], total: resp.total || 0 })
      } catch {}
    }
    load()
    return () => { mounted = false }
  }, [activeTab, productsPage, productsLimit, productsSortBy, productsSortDir, productsRefresh, productsSearch, productsFilterCategory, productsFilterStock, productsFilterDiscount, productsFilterPhoto])

  useEffect(() => {
    if (activeTab !== 'chars') return
    requestsService.getCharTemplates().then(data => setCharTemplates(data || []))
  }, [activeTab, charTemplatesRefresh])

  // Load templates when category changes in add form
  useEffect(() => {
    const catId = productAddForm.category ? Number(productAddForm.category) : null
    if (catId) {
      requestsService.getCharTemplates(catId).then(data => {
        const templates = data || []
        setAvailableAddTemplates(templates)
        setProductAddForm(prev => {
          const existing = prev.characteristics || []
          const templateChars = templates.map(tpl => {
            const match = existing.find(ch => ch.name === tpl.name)
            return { name: tpl.name, value: match?.value ?? '', _tpl: { id: tpl.id, type: tpl.type, options: tpl.options } }
          })
          const templateNames = new Set(templates.map(t => t.name))
          const customChars = existing.filter(ch => !ch._tpl && !templateNames.has(ch.name))
          return { ...prev, characteristics: [...templateChars, ...customChars] }
        })
      })
    } else {
      setAvailableAddTemplates([])
      setProductAddForm(prev => ({
        ...prev,
        characteristics: (prev.characteristics || []).filter(ch => !ch._tpl),
      }))
      setProductAddTab(t => t === 'chars' ? 'basic' : t)
    }
  }, [productAddForm.category])

  // Load templates when category changes in edit form
  useEffect(() => {
    const catId = productEditForm.category?.[0]
    if (catId) {
      requestsService.getCharTemplates(catId).then(data => {
        const templates = data || []
        setAvailableEditTemplates(templates)
        setProductEditForm(prev => {
          const existing = prev.characteristics || []
          const templateChars = templates.map(tpl => {
            const match = existing.find(ch => ch.name === tpl.name)
            return { name: tpl.name, value: match?.value ?? '', _tpl: { id: tpl.id, type: tpl.type, options: tpl.options } }
          })
          const templateNames = new Set(templates.map(t => t.name))
          const customChars = existing.filter(ch => !ch._tpl && !templateNames.has(ch.name))
          return { ...prev, characteristics: [...templateChars, ...customChars] }
        })
      })
    } else {
      setAvailableEditTemplates([])
      setProductEditForm(prev => ({
        ...prev,
        characteristics: (prev.characteristics || []).filter(ch => !ch._tpl),
      }))
      setProductEditTab(t => t === 'chars' ? 'basic' : t)
    }
  }, [productEditForm.category])

  useEffect(() => {
    if (activeTab !== 'reviews') return
    let mounted = true
    const load = async () => {
      try {
        const params = { page: reviewsPage, limit: reviewsLimit, sortBy: reviewsSortBy, sortDir: reviewsSortDir, q: reviewSearch || undefined, product: reviewProductSearch || undefined, from: reviewDateFrom || undefined, to: reviewDateTo || undefined, rating: reviewRating || undefined, hasPhoto: reviewHasPhoto || undefined, status: reviewStatusFilter || undefined }
        const resp = await requestsService.getAdminReviews(params)
        if (resp.pendingCount !== undefined) setReviewPendingCount(resp.pendingCount)
        if (!mounted) return
        setReviewsData({ data: resp.data || [], total: resp.total || 0 })
      } catch {}
    }
    load()
    return () => { mounted = false }
  }, [activeTab, reviewsPage, reviewsLimit, reviewsSortBy, reviewsSortDir, reviewSearch, reviewProductSearch, reviewDateFrom, reviewDateTo, reviewRating, reviewHasPhoto, reviewStatusFilter])

  useEffect(() => {
    if (activeTab !== 'slides') return
    let mounted = true
    const load = async () => {
      try {
        const params = { page: slidesPage, limit: slidesLimit, sortBy: slidesSortBy, sortDir: slidesSortDir, q: slideSearch || undefined }
        const resp = await requestsService.getAdminSlides(params)
        if (!mounted) return
        setSlidesData({ data: resp.data || [], total: resp.total || 0 })
      } catch {}
    }
    load()
    return () => { mounted = false }
  }, [activeTab, slidesPage, slidesLimit, slidesSortBy, slidesSortDir, slideSearch])

  useEffect(() => {
    if (activeTab !== 'stats' || !statsTarget) return
    let mounted = true
    const load = async () => {
      setStatsLoading(true)
      try {
        const data = await requestsService.getStatistics({
          type: statsTarget.type, id: statsTarget.id,
          groupBy: statsGroupBy,
          from: statsDateFrom || undefined, to: statsDateTo || undefined,
          source: statsSource || undefined,
        })
        if (mounted) setStatsData(Array.isArray(data) ? data : [])
      } catch {} finally { if (mounted) setStatsLoading(false) }
    }
    load()
    return () => { mounted = false }
  }, [activeTab, statsTarget, statsGroupBy, statsDateFrom, statsDateTo, statsSource])

  if (!userId) return <div className="admin-panel">Пожалуйста, войдите в аккаунт</div>
  if (!hasAccess) return (
    <div className="admin-panel">
      <div className="admin-error">
        <h2>Доступ запрещён</h2>
        <p>У вас нет прав для доступа к админ-панели</p>
        <button onClick={() => router.visit('/')}>Вернуться на главную</button>
      </div>
    </div>
  )

  // Sorting helpers
  const handleSort = (field) => { if (sortBy === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); else { setSortBy(field); setSortDir('asc') } }
  const handleCategorySort = (field) => { if (categoriesSortBy === field) setCategoriesSortDir(categoriesSortDir === 'asc' ? 'desc' : 'asc'); else { setCategoriesSortBy(field); setCategoriesSortDir('asc') } }
  const handleCharTplSort = (field) => {
    if (charTplSortBy === field) setCharTplSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setCharTplSortBy(field); setCharTplSortDir('asc') }
    setCharTplPage(1)
  }

  const filteredCharTemplates = useMemo(() => {
    let list = charTemplates
    const q = charTplSearch.trim().toLowerCase()
    if (q) list = list.filter(t => t.name.toLowerCase().includes(q) || (t.categoryName || '').toLowerCase().includes(q))
    if (charTplCategoryFilter) list = list.filter(t => String(t.categoryId) === String(charTplCategoryFilter))
    list = [...list].sort((a, b) => {
      let av = a[charTplSortBy] ?? '', bv = b[charTplSortBy] ?? ''
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av < bv) return charTplSortDir === 'asc' ? -1 : 1
      if (av > bv) return charTplSortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [charTemplates, charTplSearch, charTplCategoryFilter, charTplSortBy, charTplSortDir])

  const charTplTotalPages = Math.max(1, Math.ceil(filteredCharTemplates.length / charTplLimit))
  const charTplPageSafe = Math.min(charTplPage, charTplTotalPages)
  const pagedCharTemplates = filteredCharTemplates.slice((charTplPageSafe - 1) * charTplLimit, charTplPageSafe * charTplLimit)
  const getSortedUsers = () => {
    let list = usersRoleFilter ? users.filter(u => u.role === usersRoleFilter) : [...users]
    return list.sort((a, b) => {
      let aVal = a[sortBy], bVal = b[sortBy]
      if (sortBy === 'createdAt') { aVal = new Date(aVal); bVal = new Date(bVal) }
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }

  const validateStaffForm = () => {
    const e = {}
    if (!addStaffForm.firstName.trim()) e.firstName = 'Введите имя'
    else if (addStaffForm.firstName.trim().length < 2) e.firstName = 'Минимум 2 символа'
    if (!addStaffForm.lastName.trim()) e.lastName = 'Введите фамилию'
    else if (addStaffForm.lastName.trim().length < 2) e.lastName = 'Минимум 2 символа'
    if (!addStaffForm.emailOrLogin.trim()) e.emailOrLogin = 'Введите почту/логин'
    if (!addStaffForm.phone.trim() || addStaffForm.phone.replace(/\D/g, '').length < 11) e.phone = 'Введите корректный номер'
    if (!addStaffForm.password) e.password = 'Придумайте пароль'
    else if (addStaffForm.password.length < 8) e.password = 'Минимум 8 символов'
    else if (!/[A-Z]/.test(addStaffForm.password)) e.password = 'Нужна хотя бы 1 заглавная буква'
    else if (!/\d/.test(addStaffForm.password)) e.password = 'Нужна хотя бы 1 цифра'
    if (!addStaffForm.confirmPassword) e.confirmPassword = 'Подтвердите пароль'
    else if (addStaffForm.password !== addStaffForm.confirmPassword) e.confirmPassword = 'Пароли не совпадают'
    return e
  }

  const submitAddStaff = async () => {
    const errors = validateStaffForm()
    if (Object.keys(errors).length > 0) { setAddStaffErrors(errors); return }
    setAddStaffLoading(true)
    const res = await requestsService.createStaff({
      firstName: addStaffForm.firstName.trim(),
      lastName: addStaffForm.lastName.trim(),
      middleName: addStaffForm.middleName.trim() || null,
      emailOrLogin: addStaffForm.emailOrLogin.trim(),
      phone: addStaffForm.phone,
      password: addStaffForm.password,
      role: addStaffForm.role,
    })
    setAddStaffLoading(false)
    if (res?.success) {
      setUsers(prev => [...prev, res.user])
      setAddStaffModal(false)
      setAddStaffForm({ firstName: '', lastName: '', middleName: '', emailOrLogin: '', phone: '', password: '', confirmPassword: '', role: 'Менеджер' })
      setAddStaffErrors({})
      setToast({ show: true, message: `Сотрудник ${res.user.firstName} добавлен` })
      setTimeout(() => setToast({ show: false, message: '' }), 3000)
    } else {
      setAddStaffErrors(res?.errors || { form: 'Ошибка при создании' })
    }
  }
  const openDelete = (id) => setDeleteModal({ open: true, id })
  const closeDelete = () => setDeleteModal({ open: false, id: null })
  const confirmDelete = async () => {
    const id = deleteModal.id; if (!id) return
    const res = await requestsService.deleteUser(id)
    if (res?.success) { setUsers(prev => prev.filter(u => u.id !== id)); setToast({ show: true, message: `Пользователь ${id} удалён` }); setTimeout(() => setToast({ show: false, message: '' }), 3000) }
    closeDelete()
  }
  const startEdit = (user) => {
    setEditingId(user.id)
    setEditForm({ firstName: user.first_name || user.firstName || '', lastName: user.last_name || user.lastName || '', middleName: user.middle_name || user.middleName || '', email: user.email || '', phone: user.phone || '', role: user.role || 'Пользователь' })
    setEditErrors({})
  }
  const cancelEdit = () => { setEditingId(null); setEditForm({}); setEditErrors({}) }
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const validatePhone = (phone) => phone.replace(/\D/g, '').length >= 11
  const saveEdit = async (id) => {
    const errors = {}
    if (!validateEmail(editForm.email)) errors.email = 'Некорректный email'
    if (!validatePhone(editForm.phone)) errors.phone = 'Телефон должен содержать минимум 11 цифр'
    if (Object.keys(errors).length > 0) { setEditErrors(errors); return }
    const res = await requestsService.updateUser(id, editForm)
    if (res?.success) { setUsers(prev => prev.map(u => u.id === id ? (res.user || { ...u, ...editForm }) : u)); cancelEdit(); setToast({ show: true, message: `Данные пользователя ${id} изменены` }); setTimeout(() => setToast({ show: false, message: '' }), 3000) }
    else setEditErrors({ form: 'Ошибка при сохранении' })
  }
  const handleOrdersSortClick = (col) => { dispatch(setSort(col)); dispatch(setPage(1)) }
  const handleProductSort = (field) => { if (productsSortBy === field) setProductsSortDir(productsSortDir === 'asc' ? 'desc' : 'asc'); else { setProductsSortBy(field); setProductsSortDir('asc') }; setProductsPage(1) }
  const startProductEdit = (p) => {
    setEditingProductId(p.id)
    setProductEditForm({
      name: p.name || '',
      price: p.price || 0,
      available_quantity: p.available_quantity || 0,
      discount_percent: p.discount_percent ?? 0,
      description: p.description || '',
      category: p.category || [],
      images: (p.images && p.images.length > 0)
        ? p.images.map(url => ({ url, isNew: false }))
        : (p.image && p.image !== '/dataImg/noimagebig.png' ? [{ url: p.image, isNew: false }] : []),
      characteristics: Array.isArray(p.characteristics) ? p.characteristics.map(ch => ({ name: ch.name || '', value: ch.value || '' })) : [],
    })
    setProductEditErrors({})
    setProductEditTab('basic')
    setProductEditModal(true)
  }
  const cancelProductEdit = () => {
    setEditingProductId(null)
    setProductEditModal(false)
    setProductEditForm({})
    setProductEditErrors({})
    setAvailableEditTemplates([])
  }
  const addProductAddCharacteristic = () => setProductAddForm(prev => ({ ...prev, characteristics: [...(prev.characteristics || []), { name: '', value: '', _tpl: null }] }))
  const updateProductAddCharacteristic = (index, key, value) => setProductAddForm(prev => ({
    ...prev,
    characteristics: (prev.characteristics || []).map((ch, i) => i === index ? { ...ch, [key]: value } : ch),
  }))
  const removeProductAddCharacteristic = (index) => setProductAddForm(prev => ({
    ...prev,
    characteristics: (prev.characteristics || []).filter((_, i) => i !== index),
  }))
  const addProductEditCharacteristic = () => setProductEditForm(prev => ({ ...prev, characteristics: [...(prev.characteristics || []), { name: '', value: '', _tpl: null }] }))
  const updateProductEditCharacteristic = (index, key, value) => setProductEditForm(prev => ({
    ...prev,
    characteristics: (prev.characteristics || []).map((ch, i) => i === index ? { ...ch, [key]: value } : ch),
  }))
  const removeProductEditCharacteristic = (index) => setProductEditForm(prev => ({
    ...prev,
    characteristics: (prev.characteristics || []).filter((_, i) => i !== index),
  }))
  const validateProductForm = (form, setErrorsState) => {
    const errors = {}
    if (!form.name?.trim()) errors.name = 'Введите название товара'
    if (form.price === '' || Number.isNaN(Number(form.price)) || Number(form.price) < 0) {
      errors.price = 'Цена должна быть числом >= 0'
    }
    if (form.available_quantity === '' || Number.isNaN(Number(form.available_quantity)) || Number(form.available_quantity) < 0) {
      errors.available_quantity = 'Количество должно быть целым >= 0'
    }

    const charErrors = []
    ;(form.characteristics || []).forEach((ch, idx) => {
      const name = (ch?.name || '').trim()
      const value = (ch?.value || '').trim()
      if (ch?._tpl && value === '') return  // template rows are optional
      if (name === '' && value === '') return
      const rowError = {}
      if (name === '') rowError.name = 'Введите тип'
      if (value === '') rowError.value = 'Введите значение'
      if (Object.keys(rowError).length > 0) charErrors[idx] = rowError
    })

    if (charErrors.length > 0) {
      errors.characteristics = charErrors
    }

    setErrorsState(errors)
    return Object.keys(errors).length === 0
  }
  const collectChars = (characteristics) =>
    (characteristics || [])
      .filter(ch => ch.name?.trim() && ch.value?.trim())
      .map(ch => ({ name: ch.name.trim(), value: ch.value.trim() }))

  const openCharTemplateModal = (editing = null) => {
    if (editing) {
      setCharTemplateForm({
        categoryId: String(editing.categoryId),
        name: editing.name,
        type: editing.type,
        options: editing.options,
        isFilterable: editing.isFilterable,
      })
    } else {
      setCharTemplateForm({ categoryId: '', name: '', type: 'text', options: null, isFilterable: false })
    }
    setCharTemplateErrors({})
    setCharTemplateModal({ open: true, editing })
  }

  const saveCharTemplate = async () => {
    const errors = {}
    if (!charTemplateForm.categoryId) errors.categoryId = 'Выберите категорию'
    if (!charTemplateForm.name?.trim()) errors.name = 'Введите название'
    if (Object.keys(errors).length > 0) { setCharTemplateErrors(errors); return }

    const payload = {
      categoryId: Number(charTemplateForm.categoryId),
      name: charTemplateForm.name.trim(),
      type: charTemplateForm.type,
      options: charTemplateForm.options,
      isFilterable: charTemplateForm.isFilterable,
    }

    let res
    if (charTemplateModal.editing) {
      res = await requestsService.updateCharTemplate(charTemplateModal.editing.id, payload)
    } else {
      res = await requestsService.createCharTemplate(payload)
    }

    if (res?.success) {
      setCharTemplatesRefresh(r => r + 1)
      setCharTemplateModal({ open: false, editing: null })
      setToast({ show: true, message: charTemplateModal.editing ? 'Характеристика обновлена' : 'Характеристика добавлена' })
      setTimeout(() => setToast({ show: false, message: '' }), 3000)
    } else {
      setCharTemplateErrors({ form: 'Ошибка при сохранении' })
    }
  }

  const confirmDeleteCharTemplate = async () => {
    const id = charTemplateDeleteModal.id; if (!id) return
    await requestsService.deleteCharTemplate(id)
    setCharTemplates(prev => prev.filter(t => t.id !== id))
    setCharTemplateDeleteModal({ open: false, id: null })
    setToast({ show: true, message: 'Характеристика удалена' })
    setTimeout(() => setToast({ show: false, message: '' }), 3000)
  }

  const saveProductEdit = async (id) => {
    if (!validateProductForm(productEditForm, setProductEditErrors)) return
    const payload = {
      name: productEditForm.name,
      description: productEditForm.description || '',
      price: Number(productEditForm.price),
      available_quantity: Number(productEditForm.available_quantity),
      discount_percent: Number(productEditForm.discount_percent ?? 0),
      category: productEditForm.category,
      characteristics: collectChars(productEditForm.characteristics),
      images: productEditForm.images || [],
    }
    try {
      const res = await requestsService.updateProduct(id, payload)
      if (res?.success && res.product) { setProductsPageData(prev => ({ ...prev, data: prev.data.map(it => it.id === id ? res.product : it) })); setToast({ show: true, message: `Товар ${id} обновлён` }) }
      else { setToast({ show: true, message: res?.error?.message || `Ошибка при обновлении товара ${id}` }) }
    } catch { setToast({ show: true, message: `Ошибка при обновлении товара ${id}` }) }
    cancelProductEdit(); setTimeout(() => setToast({ show: false, message: '' }), 3000)
  }
  const openProductDelete = (id) => setProductDeleteModal({ open: true, id })
  const closeProductDelete = () => setProductDeleteModal({ open: false, id: null })
  const confirmProductDelete = async () => {
    const id = productDeleteModal.id; if (!id) return
    try { const res = await requestsService.deleteProduct(id); setProductsPageData(prev => ({ ...prev, data: prev.data.filter(p => p.id !== id), total: Math.max(0, (prev.total || 1) - 1) })); setToast({ show: true, message: `Товар ${id} удалён` }) }
    catch { setProductsPageData(prev => ({ ...prev, data: prev.data.filter(p => p.id !== id) })); setToast({ show: true, message: `Товар ${id} удалён` }) }
    closeProductDelete(); setTimeout(() => setToast({ show: false, message: '' }), 3000)
  }
  const startCategoryEdit = (cat) => { setEditingCategoryId(cat.id); setCategoryEditForm({ name: cat.name || '', description: cat.description || '', parentId: cat.parent_id ?? cat.parentId ?? '', imageFile: null, imagePreview: cat.icon || '' }); setCategoryEditErrors({}) }
  const cancelCategoryEdit = () => { setEditingCategoryId(null); setCategoryEditForm({}); setCategoryEditErrors({}) }
  const saveCategoryEdit = async (id) => {
    const errors = {}; if (!categoryEditForm.name?.trim()) { errors.name = 'Введите название'; setCategoryEditErrors(errors); return }
    const payload = { name: categoryEditForm.name, description: categoryEditForm.description, parentId: categoryEditForm.parentId === '' ? null : Number(categoryEditForm.parentId), imageFile: categoryEditForm.imageFile || undefined }
    try { const res = await requestsService.updateCategory(id, payload); if (res?.success && res.category) setCategories(prev => prev.map(c => c.id === id ? res.category : c)); else setCategories(prev => prev.map(c => c.id === id ? { ...c, ...payload } : c)) }
    catch { setCategories(prev => prev.map(c => c.id === id ? { ...c, ...payload } : c)) }
    cancelCategoryEdit(); setToast({ show: true, message: `Категория ${id} обновлена` }); setTimeout(() => setToast({ show: false, message: '' }), 3000)
  }
  const openCategoryDelete = (id) => setCategoryDeleteModal({ open: true, id })
  const closeCategoryDelete = () => setCategoryDeleteModal({ open: false, id: null })
  const confirmCategoryDelete = async () => {
    const id = categoryDeleteModal.id; if (!id) return
    try { await requestsService.deleteCategory(id) } catch {}
    setCategories(prev => prev.filter(c => c.id !== id)); closeCategoryDelete()
    setToast({ show: true, message: `Категория ${id} удалена` }); setTimeout(() => setToast({ show: false, message: '' }), 3000)
  }

  // Review helpers
  const handleReviewSort = (field) => {
    if (reviewsSortBy === field) setReviewsSortDir(reviewsSortDir === 'asc' ? 'desc' : 'asc')
    else { setReviewsSortBy(field); setReviewsSortDir('desc') }
    setReviewsPage(1)
  }
  const getReviewSortIndicator = (field) => reviewsSortBy !== field ? '' : (reviewsSortDir === 'asc' ? ' ↑' : ' ↓')
  const applyReviewFilters = () => { setReviewSearch(reviewSearchInput); setReviewProductSearch(reviewProductSearchInput); setReviewsPage(1) }
  const resetReviewFilters = () => { setReviewSearchInput(''); setReviewSearch(''); setReviewProductSearchInput(''); setReviewProductSearch(''); setReviewDateFrom(''); setReviewDateTo(''); setReviewRating(''); setReviewHasPhoto(''); setReviewStatusFilter(''); setReviewsPage(1) }
  const applyProductFilters = () => { setProductsSearch(productsSearchInput); setProductsPage(1) }
  const resetProductFilters = () => { setProductsSearchInput(''); setProductsSearch(''); setProductsFilterDiscount(false); setProductsFilterStock(''); setProductsFilterCategory(''); setProductsFilterPhoto(false); setProductsPage(1) }
  const applyOrderFilters = () => { setOrdersSearch(ordersSearchInput); dispatch(setPage(1)) }
  const resetOrderFilters = () => { setOrdersSearchInput(''); setOrdersSearch(''); setOrdersStatus(''); setOrdersDelivery(''); setOrdersDateFrom(''); setOrdersDateTo(''); dispatch(setPage(1)) }
  const confirmDeleteReview = async () => {
    const id = reviewDeleteModal.id; if (!id) return
    const res = await requestsService.deleteReview(id)
    if (res?.success) {
      setReviewsData(prev => ({ ...prev, data: prev.data.filter(r => r.id !== id), total: Math.max(0, prev.total - 1) }))
      setReviewViewModal({ open: false, review: null })
      setToast({ show: true, message: `Отзыв ${id} удалён` }); setTimeout(() => setToast({ show: false, message: '' }), 3000)
    }
    setReviewDeleteModal({ open: false, id: null })
  }

  const handleApproveReview = async (id) => {
    const res = await requestsService.approveReview(id)
    if (res?.success) {
      setReviewsData(prev => ({ ...prev, data: prev.data.map(r => r.id === id ? { ...r, status: 'approved' } : r) }))
      setReviewViewModal(prev => prev.review?.id === id ? { ...prev, review: { ...prev.review, status: 'approved' } } : prev)
      setReviewPendingCount(c => Math.max(0, c - 1))
      setToast({ show: true, message: `Отзыв ${id} одобрен` }); setTimeout(() => setToast({ show: false, message: '' }), 3000)
    }
  }

  const confirmDeleteReviewUser = async () => {
    const { reviewId, userId } = reviewUserDeleteModal; if (!reviewId) return
    const res = await requestsService.deleteReviewUser(reviewId)
    if (res?.success) {
      setReviewsData(prev => ({ ...prev, data: prev.data.filter(r => r.userId !== userId), total: Math.max(0, prev.total - 1) }))
      setReviewViewModal({ open: false, review: null })
      setUsers(prev => prev.filter(u => u.id !== userId))
      setToast({ show: true, message: `Пользователь и его отзывы удалены` }); setTimeout(() => setToast({ show: false, message: '' }), 3000)
    }
    setReviewUserDeleteModal({ open: false, reviewId: null, userId: null })
  }

  // Slide helpers
  const handleSlideSort = (field) => {
    if (slidesSortBy === field) setSlidesSortDir(slidesSortDir === 'asc' ? 'desc' : 'asc')
    else { setSlidesSortBy(field); setSlidesSortDir('desc') }
    setSlidesPage(1)
  }
  const getSlideSortIndicator = (field) => slidesSortBy !== field ? '' : (slidesSortDir === 'asc' ? ' ↑' : ' ↓')
  const applySlideFilters = () => { setSlideSearch(slideSearchInput); setSlidesPage(1) }
  const resetSlideFilters = () => { setSlideSearchInput(''); setSlideSearch(''); setSlidesPage(1) }

  const openSlideAddModal = () => {
    setSlideForm({ title: '', description: '', link: '', imageFile: null, imagePreview: '' })
    setSlideErrors({})
    setSlideModal({ open: true, editing: null })
  }
  const openSlideEditModal = (s) => {
    setSlideForm({ title: s.title || '', description: s.description || '', link: s.link || '', imageFile: null, imagePreview: s.image || '' })
    setSlideErrors({})
    setSlideModal({ open: true, editing: s })
  }
  const closeSlideModal = () => {
    setSlideModal({ open: false, editing: null })
    setSlideForm({ title: '', description: '', link: '', imageFile: null, imagePreview: '' })
    setSlideErrors({})
  }
  const saveSlide = async () => {
    const errors = {}
    if (!slideForm.title?.trim()) errors.title = 'Введите заголовок'
    if (!slideModal.editing && !slideForm.imageFile) errors.image = 'Загрузите изображение'
    if (Object.keys(errors).length) { setSlideErrors(errors); return }

    const payload = {
      title: slideForm.title.trim(),
      description: slideForm.description ?? '',
      link: slideForm.link ?? '',
      imageFile: slideForm.imageFile || undefined,
    }
    const res = slideModal.editing
      ? await requestsService.updateSlide(slideModal.editing.id, payload)
      : await requestsService.createSlide(payload)

    if (res?.success && res.slide) {
      if (slideModal.editing) {
        setSlidesData(prev => ({ ...prev, data: prev.data.map(s => s.id === res.slide.id ? res.slide : s) }))
        setToast({ show: true, message: `Слайд ${res.slide.id} обновлён` })
      } else {
        setSlidesData(prev => ({ data: [res.slide, ...prev.data], total: prev.total + 1 }))
        setToast({ show: true, message: 'Слайд добавлен' })
      }
      setTimeout(() => setToast({ show: false, message: '' }), 3000)
      closeSlideModal()
    } else {
      setSlideErrors({ form: 'Не удалось сохранить слайд' })
    }
  }
  const confirmDeleteSlide = async () => {
    const id = slideDeleteModal.id
    if (!id) return
    const res = await requestsService.deleteSlide(id)
    if (res?.success) {
      setSlidesData(prev => ({ ...prev, data: prev.data.filter(s => s.id !== id), total: Math.max(0, prev.total - 1) }))
      setToast({ show: true, message: `Слайд ${id} удалён` })
      setTimeout(() => setToast({ show: false, message: '' }), 3000)
    }
    setSlideDeleteModal({ open: false, id: null })
  }

  // Statistics helpers
  const searchStatsProducts = (q) => {
    if (statsSearchTimeout.current) clearTimeout(statsSearchTimeout.current)
    if (!q.trim()) { setStatsProductResults([]); return }
    statsSearchTimeout.current = setTimeout(async () => {
      setStatsProductSearching(true)
      try {
        const resp = await requestsService.getProducts({ q, limit: 10 })
        setStatsProductResults(resp.data || [])
      } catch {} finally { setStatsProductSearching(false) }
    }, 300)
  }

  const searchSaleProducts = (q) => {
    if (saleSearchTimeout.current) clearTimeout(saleSearchTimeout.current)
    if (!q.trim()) { setAddSaleProductResults([]); return }
    saleSearchTimeout.current = setTimeout(async () => {
      setAddSaleSearching(true)
      try {
        const resp = await requestsService.getProducts({ q, limit: 12 })
        setAddSaleProductResults(resp.data || [])
      } catch {} finally { setAddSaleSearching(false) }
    }, 300)
  }

  const addSaleItem = (product) => {
    setAddSaleItems(prev => prev.find(i => i.product.id === product.id) ? prev : [...prev, { product, quantity: 1 }])
    setAddSaleShowSearch(false)
    setAddSaleProductQuery('')
    setAddSaleProductResults([])
  }

  const submitAddSale = async () => {
    if (!addSaleItems.length) return
    setAddSaleLoading(true)
    const res = await requestsService.createManualSale({
      saleDate: addSaleDate,
      items: addSaleItems.map(i => ({ productId: i.product.id, quantity: i.quantity, price: i.product.price || 0 })),
    })
    setAddSaleLoading(false)
    if (res?.success) {
      setAddSaleModal(false); setAddSaleItems([]); setAddSaleShowSearch(false)
      setAddSaleDate(new Date().toISOString().split('T')[0])
      setToast({ show: true, message: 'Продажа добавлена' }); setTimeout(() => setToast({ show: false, message: '' }), 3000)
      if (statsTarget) setStatsTarget({ ...statsTarget })
    }
  }

  const sortedUsers = getSortedUsers()
  const usersTotal = sortedUsers.length
  const pagedUsers = sortedUsers.slice((usersPage - 1) * usersLimit, (usersPage - 1) * usersLimit + usersLimit)
  const getSortIndicator = (field) => sortBy !== field ? '' : (sortDir === 'asc' ? ' ↑' : ' ↓')
  const getCatSortIndicator = (field) => categoriesSortBy !== field ? '' : (categoriesSortDir === 'asc' ? ' ↑' : ' ↓')
  const getSortedCategories = () => {
    return [...(categories || [])].sort((a, b) => {
      if (categoriesSortBy === 'icon') {
        const aHas = (a.icon && a.icon !== '/dataImg/noimagebig.png') ? 1 : 0
        const bHas = (b.icon && b.icon !== '/dataImg/noimagebig.png') ? 1 : 0
        return categoriesSortDir === 'asc' ? aHas - bHas : bHas - aHas
      }
      let aVal = a[categoriesSortBy], bVal = b[categoriesSortBy]
      if (categoriesSortBy === 'id' || categoriesSortBy === 'parentId') { aVal = aVal ?? 0; bVal = bVal ?? 0 }
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      if (aVal < bVal) return categoriesSortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return categoriesSortDir === 'asc' ? 1 : -1
      return 0
    })
  }
  const sortedCategories = getSortedCategories()
  const filteredCategories = categorySearch.trim()
    ? sortedCategories.filter(c => c.name.toLowerCase().includes(categorySearch.trim().toLowerCase()))
    : sortedCategories

  return (
    <div className="admin-panel">
      <div className="admin-container">
        <aside className="admin-sidebar">
          <h2 className="admin-title">Админ-панель</h2>
          {isAdmin && <button className={`admin-tab ${activeTab === 'users' ? 'admin-tab--active' : ''}`} onClick={() => setActiveTab('users')}>Пользователи</button>}
          {hasAccess && <button className={`admin-tab ${activeTab === 'categories' ? 'admin-tab--active' : ''}`} onClick={() => setActiveTab('categories')}>Категории</button>}
          <button className={`admin-tab ${activeTab === 'products' ? 'admin-tab--active' : ''}`} onClick={() => setActiveTab('products')}>Товары</button>
          <button className={`admin-tab ${activeTab === 'orders' ? 'admin-tab--active' : ''}`} onClick={() => setActiveTab('orders')}>
            Заказы
            {ordersPending > 0 && <span className="admin-tab__badge">{ordersPending}</span>}
          </button>
          {isAdmin && <button className={`admin-tab ${activeTab === 'chars' ? 'admin-tab--active' : ''}`} onClick={() => setActiveTab('chars')}>Характеристики</button>}
          {hasAccess && (
            <button className={`admin-tab ${activeTab === 'reviews' ? 'admin-tab--active' : ''}`} onClick={() => setActiveTab('reviews')}>
              Отзывы
              {reviewPendingCount > 0 && <span className="admin-tab__badge">{reviewPendingCount}</span>}
            </button>
          )}
          {hasAccess && <button className={`admin-tab ${activeTab === 'slides' ? 'admin-tab--active' : ''}`} onClick={() => setActiveTab('slides')}>Слайдер</button>}
          {hasAccess && <button className={`admin-tab ${activeTab === 'stats' ? 'admin-tab--active' : ''}`} onClick={() => setActiveTab('stats')}>Статистика</button>}
        </aside>

        <section className="admin-content">
          {/* Users Tab */}
          {activeTab === 'users' && isAdmin && (
            <div className="admin-users">
              <h2>Управление пользователями</h2>
              {loading ? <div>Загрузка...</div> : (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <button className="btn btn--confirm" onClick={() => { setAddStaffModal(true); setAddStaffErrors({}) }}>+ Добавить сотрудника</button>
                  </div>
                  <div className="admin-users-table">
                    <table>
                      <thead><tr>
                        <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>id{getSortIndicator('id')}</th>
                        <th onClick={() => handleSort('firstName')} style={{ cursor: 'pointer' }}>ФИО{getSortIndicator('firstName')}</th>
                        <th onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>Email{getSortIndicator('email')}</th>
                        <th onClick={() => handleSort('phone')} style={{ cursor: 'pointer' }}>Телефон{getSortIndicator('phone')}</th>
                        <th style={{ cursor: 'default' }}>
                          <select
                            className="profile__status-filter"
                            value={usersRoleFilter}
                            onChange={e => { setUsersRoleFilter(e.target.value); setUsersPage(1) }}
                          >
                            <option value="">Все роли</option>
                            <option value="Пользователь">Пользователь</option>
                            <option value="Менеджер">Менеджер</option>
                            <option value="Администратор">Администратор</option>
                          </select>
                        </th>
                        <th onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer' }}>Создан{getSortIndicator('createdAt')}</th>
                        <th>Действия</th>
                      </tr></thead>
                      <tbody>
                        {pagedUsers.map(u => (
                          <tr key={u.id}>
                            <td>{u.id}</td>
                            <td>{editingId === u.id ? (<><input value={editForm.lastName} onChange={e => setEditForm(prev=>({...prev, lastName: e.target.value}))} placeholder="Фамилия" className="admin-edit-input" /><input value={editForm.firstName} onChange={e => setEditForm(prev=>({...prev, firstName: e.target.value}))} placeholder="Имя" className="admin-edit-input" /><input value={editForm.middleName || ''} onChange={e => setEditForm(prev=>({...prev, middleName: e.target.value}))} placeholder="Отчество (необязательно)" className="admin-edit-input" /></>) : (<>{[u.last_name || u.lastName, u.first_name || u.firstName, u.middle_name || u.middleName].filter(Boolean).join(' ')}</>)}</td>
                            <td>{editingId === u.id ? (<><input value={editForm.email} onChange={e => setEditForm(prev=>({...prev, email: e.target.value}))} className={`admin-edit-input ${editErrors.email ? 'admin-edit-input--error' : ''}`} />{editErrors.email && <div className="admin-field-error">{editErrors.email}</div>}</>) : u.email}</td>
                            <td>{editingId === u.id ? (<><input value={editForm.phone} onChange={e => setEditForm(prev=>({...prev, phone: formatPhoneInput(e.target.value)}))} className={`admin-edit-input ${editErrors.phone ? 'admin-edit-input--error' : ''}`} />{editErrors.phone && <div className="admin-field-error">{editErrors.phone}</div>}</>) : u.phone}</td>
                            <td>{editingId === u.id ? (<select value={editForm.role} onChange={e => setEditForm(prev=>({...prev, role: e.target.value}))} className="admin-edit-input" disabled={u.id === userId} title={u.id === userId ? 'Нельзя изменить роль своего аккаунта' : undefined}><option>Пользователь</option><option>Менеджер</option><option>Администратор</option></select>) : u.role}</td>
                            <td>{u.created_at || u.createdAt ? new Date(u.created_at || u.createdAt).toLocaleDateString('ru-RU') : '-'}</td>
                            <td className='admin__btns'>{editingId === u.id ? (<><button className="btn btn--confirm" onClick={() => saveEdit(u.id)}>Сохранить</button><button className="btn btn--cancel" onClick={cancelEdit}>Отмена</button></>) : (<><button className="btn btn--confirm" onClick={() => startEdit(u)}>Изменить</button><button className="btn btn--danger" onClick={() => openDelete(u.id)} disabled={u.id === userId} title={u.id === userId ? 'Нельзя удалить свой аккаунт' : undefined}>Удалить</button></>)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="profile__pagination">
                    <label htmlFor="users-limit">Показывать по:</label>
                    <select className="profile__pagination-limit" id="users-limit" value={usersLimit} onChange={e => { setUsersPage(1); setUsersLimit(Number(e.target.value)) }}><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select>
                    <button className="profile__pagination-btn" onClick={() => setUsersPage(Math.max(1, usersPage - 1))} disabled={usersPage <= 1}>Назад</button>
                    <span>Страница <input className="profile__pagination-input" type="number" min={1} max={Math.max(1, Math.ceil(usersTotal / usersLimit))} value={usersPage} onChange={e => { let val = Number(e.target.value); if (!val || val < 1) val = 1; const mp = Math.max(1, Math.ceil(usersTotal / usersLimit)); if (val > mp) val = mp; setUsersPage(val) }} /> из {Math.max(1, Math.ceil(usersTotal / usersLimit))}</span>
                    <button className="profile__pagination-btn" onClick={() => setUsersPage(Math.min(Math.ceil(usersTotal / usersLimit) || 1, usersPage + 1))} disabled={usersPage >= Math.ceil(usersTotal / usersLimit)}>Вперёд</button>
                  </div>
                </>
              )}
              <ConfirmModal open={deleteModal.open} title={`Удалить пользователя #${deleteModal.id}?`} message="Это действие нельзя отменить. Все данные пользователя будут удалены." confirmLabel="Удалить" onConfirm={confirmDelete} onCancel={closeDelete} />

              {addStaffModal && (
                <div className="admin-modal-overlay" onMouseDown={() => { setAddStaffModal(false); setAddStaffErrors({}) }}>
                  <div className="admin-modal admin-staff-modal" onMouseDown={e => e.stopPropagation()}>
                    <div className="admin-staff-modal__header">
                      <h3 className="admin-staff-modal__title">Добавить сотрудника</h3>
                      <button className="admin-staff-modal__close" onClick={() => { setAddStaffModal(false); setAddStaffErrors({}) }}><X size={20} /></button>
                    </div>

                    <div className="admin-staff-modal__body">
                      <div className="admin-staff-modal__row">
                        <div className="admin-staff-modal__field">
                          <label>Фамилия</label>
                          <input className={addStaffErrors.lastName ? 'is-error' : ''} placeholder="Введите фамилию" value={addStaffForm.lastName} onChange={e => setAddStaffForm(p => ({ ...p, lastName: e.target.value }))} />
                          {addStaffErrors.lastName && <span className="admin-staff-modal__err">{addStaffErrors.lastName}</span>}
                        </div>
                        <div className="admin-staff-modal__field">
                          <label>Имя</label>
                          <input className={addStaffErrors.firstName ? 'is-error' : ''} placeholder="Введите имя" value={addStaffForm.firstName} onChange={e => setAddStaffForm(p => ({ ...p, firstName: e.target.value }))} />
                          {addStaffErrors.firstName && <span className="admin-staff-modal__err">{addStaffErrors.firstName}</span>}
                        </div>
                      </div>

                      <div className="admin-staff-modal__field">
                        <label>Отчество <span style={{ fontWeight: 400, color: '#aaa', fontSize: 12 }}>(необязательно)</span></label>
                        <input placeholder="Введите отчество" value={addStaffForm.middleName} onChange={e => setAddStaffForm(p => ({ ...p, middleName: e.target.value }))} />
                      </div>

                      <div className="admin-staff-modal__field">
                        <label>Почта / Логин</label>
                        <input className={addStaffErrors.emailOrLogin ? 'is-error' : ''} placeholder="example@mail.ru или логин" value={addStaffForm.emailOrLogin} onChange={e => setAddStaffForm(p => ({ ...p, emailOrLogin: e.target.value }))} />
                        {addStaffErrors.emailOrLogin && <span className="admin-staff-modal__err">{addStaffErrors.emailOrLogin}</span>}
                      </div>

                      <div className="admin-staff-modal__field">
                        <label>Телефон</label>
                        <IMaskInput mask="+{7} (000) 000 00 00" className={addStaffErrors.phone ? 'is-error' : ''} placeholder="+7 (___) ___ __ __" value={addStaffForm.phone} onAccept={v => setAddStaffForm(p => ({ ...p, phone: v }))} />
                        {addStaffErrors.phone && <span className="admin-staff-modal__err">{addStaffErrors.phone}</span>}
                      </div>

                      <div className="admin-staff-modal__row">
                        <div className="admin-staff-modal__field">
                          <label>Пароль</label>
                          <div className="admin-staff-modal__pwd">
                            <input type={addStaffShowPwd ? 'text' : 'password'} className={addStaffErrors.password ? 'is-error' : ''} placeholder="Минимум 8 символов" value={addStaffForm.password} onChange={e => setAddStaffForm(p => ({ ...p, password: e.target.value }))} />
                            <button type="button" onClick={() => setAddStaffShowPwd(v => !v)}>{addStaffShowPwd ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                          </div>
                          {addStaffErrors.password && <span className="admin-staff-modal__err">{addStaffErrors.password}</span>}
                        </div>
                        <div className="admin-staff-modal__field">
                          <label>Подтвердите пароль</label>
                          <div className="admin-staff-modal__pwd">
                            <input type={addStaffShowConfirm ? 'text' : 'password'} className={addStaffErrors.confirmPassword ? 'is-error' : ''} placeholder="Повторите пароль" value={addStaffForm.confirmPassword} onChange={e => setAddStaffForm(p => ({ ...p, confirmPassword: e.target.value }))} />
                            <button type="button" onClick={() => setAddStaffShowConfirm(v => !v)}>{addStaffShowConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                          </div>
                          {addStaffErrors.confirmPassword && <span className="admin-staff-modal__err">{addStaffErrors.confirmPassword}</span>}
                        </div>
                      </div>

                      <div className="admin-staff-modal__field admin-staff-modal__field--role">
                        <label>Роль сотрудника</label>
                        <div className="admin-staff-modal__roles">
                          {['Менеджер', 'Администратор'].map(r => (
                            <button
                              key={r}
                              type="button"
                              className={`admin-staff-modal__role-btn ${addStaffForm.role === r ? 'admin-staff-modal__role-btn--active' : ''}`}
                              onClick={() => setAddStaffForm(p => ({ ...p, role: r }))}
                            >{r}</button>
                          ))}
                        </div>
                      </div>

                      {addStaffErrors.form && <div className="admin-staff-modal__err admin-staff-modal__err--form">{addStaffErrors.form}</div>}
                    </div>

                    <div className="admin-staff-modal__footer">
                      <button className="admin-staff-modal__btn admin-staff-modal__btn--cancel" onClick={() => { setAddStaffModal(false); setAddStaffErrors({}) }}>Отмена</button>
                      <button className="admin-staff-modal__btn admin-staff-modal__btn--submit" onClick={submitAddStaff} disabled={addStaffLoading}>{addStaffLoading ? 'Сохранение...' : 'Добавить сотрудника'}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="admin-products">
              <h2>Управление товарами</h2>
              <div style={{ marginBottom: 12 }}><button className="btn btn--confirm" onClick={() => setProductAddModal(true)}>Добавить товар</button></div>
              <div className="admin-chars-tab__toolbar" style={{ marginBottom: 12 }}>
                <input className="admin-edit-input" placeholder="Поиск по названию..." value={productsSearchInput} onChange={e => setProductsSearchInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyProductFilters()} style={{ flex: 1, minWidth: 150 }} />
                <select className="admin-edit-input" value={productsFilterCategory} onChange={e => { setProductsFilterCategory(e.target.value); setProductsPage(1) }} style={{ minWidth: 150 }}>
                  <option value="">— Все категории —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className="admin-edit-input" value={productsFilterStock} onChange={e => { setProductsFilterStock(e.target.value); setProductsPage(1) }} style={{ minWidth: 130 }}>
                  <option value="">— Все —</option>
                  <option value="inStock">В наличии</option>
                  <option value="outOfStock">Нет в наличии</option>
                </select>
                <label className="admin-filter-check">
                  <input type="checkbox" className="filter-check-input" checked={productsFilterDiscount} onChange={e => { setProductsFilterDiscount(e.target.checked); setProductsPage(1) }} />
                  <span className="filter-check-box" />
                  Со скидкой
                </label>
                <label className="admin-filter-check">
                  <input type="checkbox" className="filter-check-input" checked={productsFilterPhoto} onChange={e => { setProductsFilterPhoto(e.target.checked); setProductsPage(1) }} />
                  <span className="filter-check-box" />
                  Без фото
                </label>
                <button className="btn btn--confirm" onClick={applyProductFilters}>Применить</button>
                <button className="btn btn--cancel" onClick={resetProductFilters}>Сбросить</button>
              </div>
              <div className="admin-users-table admin-products-table">
                <table>
                  <thead><tr>
                    <th onClick={() => handleProductSort('id')} style={{ cursor: 'pointer' }}>id{productsSortBy === 'id' ? (productsSortDir === 'asc' ? ' ↑' : ' ↓') : ''}</th>
                    <th onClick={() => handleProductSort('image')} style={{ cursor: 'pointer' }}>Изображение{productsSortBy === 'image' ? (productsSortDir === 'asc' ? ' ↑' : ' ↓') : ''}</th>
                    <th onClick={() => handleProductSort('name')} style={{ cursor: 'pointer' }}>Название{productsSortBy === 'name' ? (productsSortDir === 'asc' ? ' ↑' : ' ↓') : ''}</th>
                    <th onClick={() => handleProductSort('price')} style={{ cursor: 'pointer' }}>Цена{productsSortBy === 'price' ? (productsSortDir === 'asc' ? ' ↑' : ' ↓') : ''}</th>
                    <th onClick={() => handleProductSort('available_quantity')} style={{ cursor: 'pointer' }}>В наличии{productsSortBy === 'available_quantity' ? (productsSortDir === 'asc' ? ' ↑' : ' ↓') : ''}</th>
                    <th onClick={() => handleProductSort('category')} style={{ cursor: 'pointer' }}>Категория{productsSortBy === 'category' ? (productsSortDir === 'asc' ? ' ↑' : ' ↓') : ''}</th>
                    <th onClick={() => handleProductSort('discount_percent')} style={{ cursor: 'pointer' }}>Скидка{productsSortBy === 'discount_percent' ? (productsSortDir === 'asc' ? ' ↑' : ' ↓') : ''}</th>
                    <th>Действия</th>
                  </tr></thead>
                  <tbody>
                    {productsPageData.data.map(p => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td><img src={p.image || '/dataImg/noimagebig.png'} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} /></td>
                        <td>{p.name}</td>
                        <td>{p.price ? `${p.price} ₽` : '-'}</td>
                        <td>{p.available_quantity != null ? p.available_quantity : '-'}</td>
                        <td>{Array.isArray(p.categories) && p.categories.length ? p.categories[p.categories.length - 1].name : (Array.isArray(p.category) && p.category.length ? (categories.find(c => c.id === p.category[0])?.name || '-') : '-')}</td>
                        <td>{(p.discount_percent ?? 0) > 0 ? `${p.discount_percent}%` : '—'}</td>
                        <td className='admin__btns'>
                          <button className="btn btn--two" onClick={() => router.visit(`/products/${p.id}`)}>Подробнее</button>
                          <button className="btn btn--confirm" onClick={() => startProductEdit(p)}>Изменить</button>
                          <button className="btn btn--danger" onClick={() => openProductDelete(p.id)}>Удалить</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="profile__pagination" style={{ marginTop: 12 }}>
                <label htmlFor="products-limit">Показывать по:</label>
                <select className="profile__pagination-limit" id="products-limit" value={productsLimit} onChange={e => { setProductsPage(1); setProductsLimit(Number(e.target.value)) }}><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select>
                <button className="profile__pagination-btn" onClick={() => setProductsPage(Math.max(1, productsPage - 1))} disabled={productsPage <= 1}>Назад</button>
                <span>Страница <input className="profile__pagination-input" type="number" min={1} max={Math.max(1, Math.ceil((productsPageData.total || 0) / productsLimit))} value={productsPage} onChange={e => { let val = Number(e.target.value); if (!val || val < 1) val = 1; const mp = Math.max(1, Math.ceil((productsPageData.total || 0) / productsLimit)); if (val > mp) val = mp; setProductsPage(val) }} /> из {Math.max(1, Math.ceil((productsPageData.total || 0) / productsLimit))}</span>
                <button className="profile__pagination-btn" onClick={() => setProductsPage(Math.min(Math.ceil((productsPageData.total || 0) / productsLimit) || 1, productsPage + 1))} disabled={productsPage >= Math.ceil((productsPageData.total || 0) / productsLimit)}>Вперёд</button>
              </div>
              <ConfirmModal open={productDeleteModal.open} title={`Удалить товар #${productDeleteModal.id}?`} message="Товар будет удалён из каталога. Это действие нельзя отменить." confirmLabel="Удалить" onConfirm={confirmProductDelete} onCancel={closeProductDelete} />
              {productAddModal && (
                <div className="admin-modal-overlay" onMouseDown={() => { setProductAddModal(false); setProductAddForm({ name: '', price: 0, available_quantity: 0, discount_percent: 0, description: '', category: '', images: [], characteristics: [] }); setProductAddErrors({}); setProductAddTab('basic'); setAvailableAddTemplates([]) }}>
                  <div className="admin-modal admin-modal--wide admin-modal--product" onMouseDown={e => e.stopPropagation()}>
                    <div className="product-modal__header">
                      <h3 className="product-modal__title">Добавить товар</h3>
                      <div className="product-modal__tabs">
                        <button type="button" className={`product-modal__tab${productAddTab === 'basic' ? ' active' : ''}`} onClick={() => setProductAddTab('basic')}>Основное</button>
                        <button type="button" className={`product-modal__tab${productAddTab === 'images' ? ' active' : ''}`} onClick={() => setProductAddTab('images')}>Фото{productAddForm.images.length > 0 ? ` (${productAddForm.images.length})` : ''}</button>
                        <button type="button" disabled={!productAddForm.category} title={!productAddForm.category ? 'Сначала выберите категорию' : undefined} className={`product-modal__tab${productAddTab === 'chars' ? ' active' : ''}`} onClick={() => setProductAddTab('chars')}>Характеристики{(() => { const t = (productAddForm.characteristics || []).filter(ch => ch.name?.trim() && ch.value?.trim()).length; return t > 0 ? ` (${t})` : '' })()}</button>
                      </div>
                    </div>

                    {productAddTab === 'basic' && (
                      <div className="product-modal__section">
                        <div className="product-modal__field product-modal__field--full">
                          <label className="product-modal__label">Название *</label>
                          <input placeholder="Название товара" value={productAddForm.name} onChange={e => setProductAddForm(prev => ({ ...prev, name: e.target.value }))} className={`admin-edit-input ${productAddErrors.name ? 'admin-edit-input--error' : ''}`} />
                          {productAddErrors.name && <div className="admin-field-error">{productAddErrors.name}</div>}
                        </div>
                        <div className="product-modal__field product-modal__field--full">
                          <label className="product-modal__label">Описание</label>
                          <textarea placeholder="Описание товара" value={productAddForm.description} onChange={e => setProductAddForm(prev => ({ ...prev, description: e.target.value }))} className="admin-edit-input product-modal__textarea" rows={4} />
                        </div>
                        <div className="product-modal__grid">
                          <div className="product-modal__field">
                            <label className="product-modal__label">Цена (₽) *</label>
                            <input type="number" min="0" value={productAddForm.price} onChange={e => setProductAddForm(prev => ({ ...prev, price: e.target.value }))} className={`admin-edit-input ${productAddErrors.price ? 'admin-edit-input--error' : ''}`} />
                            {productAddErrors.price && <div className="admin-field-error">{productAddErrors.price}</div>}
                          </div>
                          <div className="product-modal__field">
                            <label className="product-modal__label">В наличии *</label>
                            <input type="number" min="0" value={productAddForm.available_quantity} onChange={e => setProductAddForm(prev => ({ ...prev, available_quantity: e.target.value }))} className={`admin-edit-input ${productAddErrors.available_quantity ? 'admin-edit-input--error' : ''}`} />
                            {productAddErrors.available_quantity && <div className="admin-field-error">{productAddErrors.available_quantity}</div>}
                          </div>
                          <div className="product-modal__field">
                            <label className="product-modal__label">Скидка (%)</label>
                            <input type="number" min="0" max="100" value={productAddForm.discount_percent ?? 0} onChange={e => setProductAddForm(prev => ({ ...prev, discount_percent: e.target.value }))} className="admin-edit-input" />
                          </div>
                          <div className="product-modal__field">
                            <label className="product-modal__label">Категория</label>
                            <select value={productAddForm.category} onChange={e => setProductAddForm(prev => ({ ...prev, category: e.target.value }))} className="admin-edit-input">
                              <option value="">-- нет категории --</option>
                              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {productAddTab === 'images' && (
                      <div className="product-modal__section">
                        <p className="product-modal__hint">Добавьте до 10 изображений. Перетащите миниатюры для изменения порядка. Первое фото — главное на карточке.</p>
                        <ImageManager images={productAddForm.images || []} onChange={imgs => setProductAddForm(prev => ({ ...prev, images: imgs }))} maxImages={10} onError={msg => { setToast({ show: true, message: msg }); setTimeout(() => setToast({ show: false, message: '' }), 3000) }} />
                      </div>
                    )}

                    {productAddTab === 'chars' && (
                      <div className="product-modal__section">
                        <div className="admin-chars">
                          <div className="admin-chars__head">
                            <span className="product-modal__label">Характеристики товара</span>
                            <button type="button" className="btn btn--confirm" onClick={addProductAddCharacteristic}>+ Добавить</button>
                          </div>
                          {(productAddForm.characteristics || []).length === 0 && (
                            <p className="product-modal__hint">Нет характеристик. Выберите категорию или нажмите «+ Добавить».</p>
                          )}
                          <datalist id="add-char-names">
                            {availableAddTemplates.map(t => <option key={t.id} value={t.name} />)}
                          </datalist>
                          {(productAddForm.characteristics || []).map((ch, idx) => (
                            <div className="admin-chars__row" key={`add-char-${idx}`}>
                              <div className="admin-chars__field">
                                {ch._tpl ? (
                                  <span className="admin-edit-input" style={{ background: '#f8f9fa', display: 'flex', alignItems: 'center' }}>{ch.name}</span>
                                ) : (
                                  <input placeholder="Название" value={ch.name} list="add-char-names"
                                    onChange={e => updateProductAddCharacteristic(idx, 'name', e.target.value)}
                                    className={`admin-edit-input${productAddErrors.characteristics?.[idx]?.name ? ' admin-edit-input--error' : ''}`} />
                                )}
                                {productAddErrors.characteristics?.[idx]?.name && <div className="admin-field-error">{productAddErrors.characteristics[idx].name}</div>}
                              </div>
                              <div className="admin-chars__field">
                                <CharValueInput
                                  ch={ch}
                                  templates={availableAddTemplates}
                                  onValueChange={v => updateProductAddCharacteristic(idx, 'value', v)}
                                  error={productAddErrors.characteristics?.[idx]?.value}
                                />
                                {productAddErrors.characteristics?.[idx]?.value && <div className="admin-field-error">{productAddErrors.characteristics[idx].value}</div>}
                              </div>
                              {!ch._tpl && (
                                <button type="button" className="btn btn--danger" onClick={() => removeProductAddCharacteristic(idx)}>✕</button>
                              )}
                              {ch._tpl && <div style={{ width: 28 }} />}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="admin-modal__actions product-modal__footer">
                      <button className="btn btn--cancel" onClick={() => { setProductAddModal(false); setProductAddForm({ name: '', price: 0, available_quantity: 0, discount_percent: 0, description: '', category: '', images: [], characteristics: [] }); setProductAddErrors({}); setProductAddTab('basic'); setAvailableAddTemplates([]) }}>Отмена</button>
                      <button className="btn btn--confirm" onClick={async () => {
                        if (!validateProductForm(productAddForm, setProductAddErrors)) return
                        const payload = { name: productAddForm.name, description: productAddForm.description || '', price: Number(productAddForm.price), available_quantity: Number(productAddForm.available_quantity), discount_percent: Number(productAddForm.discount_percent ?? 0), category: productAddForm.category ? [Number(productAddForm.category)] : [], characteristics: collectChars(productAddForm.characteristics), images: productAddForm.images || [] }
                        try { const res = await requestsService.createProduct(payload); if (res?.success && res.product) { setProductsRefresh(r => r + 1); setToast({ show: true, message: 'Товар создан' }) } else { const errMsg = typeof res?.error === 'string' ? res.error : (res?.error?.message || res?.message || JSON.stringify(res?.error?.errors || res?.error) || 'Ошибка при создании товара'); setToast({ show: true, message: errMsg }); setTimeout(() => setToast({ show: false, message: '' }), 3000); return } }
                        catch { setToast({ show: true, message: 'Ошибка при создании товара' }) }
                        setProductAddForm({ name: '', price: 0, available_quantity: 0, discount_percent: 0, description: '', category: '', images: [], characteristics: [] }); setProductAddModal(false); setProductAddTab('basic'); setAvailableAddTemplates([]); setTimeout(() => setToast({ show: false, message: '' }), 3000)
                      }}>Сохранить</button>
                    </div>
                  </div>
                </div>
              )}
              {productEditModal && editingProductId && (
                <div className="admin-modal-overlay" onMouseDown={cancelProductEdit}>
                  <div className="admin-modal admin-modal--wide admin-modal--product" onMouseDown={e => e.stopPropagation()}>
                    <div className="product-modal__header">
                      <h3 className="product-modal__title">Изменить товар #{editingProductId}</h3>
                      <div className="product-modal__tabs">
                        <button type="button" className={`product-modal__tab${productEditTab === 'basic' ? ' active' : ''}`} onClick={() => setProductEditTab('basic')}>Основное</button>
                        <button type="button" className={`product-modal__tab${productEditTab === 'images' ? ' active' : ''}`} onClick={() => setProductEditTab('images')}>Фото{(productEditForm.images || []).length > 0 ? ` (${productEditForm.images.length})` : ''}</button>
                        <button type="button" disabled={!productEditForm.category?.[0]} title={!productEditForm.category?.[0] ? 'Сначала выберите категорию' : undefined} className={`product-modal__tab${productEditTab === 'chars' ? ' active' : ''}`} onClick={() => setProductEditTab('chars')}>Характеристики{(() => { const t = (productEditForm.characteristics || []).filter(ch => ch.name?.trim() && ch.value?.trim()).length; return t > 0 ? ` (${t})` : '' })()}</button>
                      </div>
                    </div>

                    {productEditTab === 'basic' && (
                      <div className="product-modal__section">
                        <div className="product-modal__field product-modal__field--full">
                          <label className="product-modal__label">Название *</label>
                          <input placeholder="Название товара" value={productEditForm.name ?? ''} onChange={e => setProductEditForm(prev => ({ ...prev, name: e.target.value }))} className={`admin-edit-input ${productEditErrors.name ? 'admin-edit-input--error' : ''}`} />
                          {productEditErrors.name && <div className="admin-field-error">{productEditErrors.name}</div>}
                        </div>
                        <div className="product-modal__field product-modal__field--full">
                          <label className="product-modal__label">Описание</label>
                          <textarea placeholder="Описание товара" value={productEditForm.description ?? ''} onChange={e => setProductEditForm(prev => ({ ...prev, description: e.target.value }))} className="admin-edit-input product-modal__textarea" rows={4} />
                        </div>
                        <div className="product-modal__grid">
                          <div className="product-modal__field">
                            <label className="product-modal__label">Цена (₽) *</label>
                            <input type="number" min="0" value={productEditForm.price ?? 0} onChange={e => setProductEditForm(prev => ({ ...prev, price: e.target.value }))} className={`admin-edit-input ${productEditErrors.price ? 'admin-edit-input--error' : ''}`} />
                            {productEditErrors.price && <div className="admin-field-error">{productEditErrors.price}</div>}
                          </div>
                          <div className="product-modal__field">
                            <label className="product-modal__label">В наличии *</label>
                            <input type="number" min="0" value={productEditForm.available_quantity ?? 0} onChange={e => setProductEditForm(prev => ({ ...prev, available_quantity: e.target.value }))} className={`admin-edit-input ${productEditErrors.available_quantity ? 'admin-edit-input--error' : ''}`} />
                            {productEditErrors.available_quantity && <div className="admin-field-error">{productEditErrors.available_quantity}</div>}
                          </div>
                          <div className="product-modal__field">
                            <label className="product-modal__label">Скидка (%)</label>
                            <input type="number" min="0" max="100" value={productEditForm.discount_percent ?? 0} onChange={e => setProductEditForm(prev => ({ ...prev, discount_percent: e.target.value }))} className="admin-edit-input" />
                          </div>
                          <div className="product-modal__field">
                            <label className="product-modal__label">Категория</label>
                            <select value={(productEditForm.category && productEditForm.category[0]) ?? ''} onChange={e => setProductEditForm(prev => ({ ...prev, category: e.target.value ? [Number(e.target.value)] : [] }))} className="admin-edit-input">
                              <option value="">-- нет категории --</option>
                              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {productEditTab === 'images' && (
                      <div className="product-modal__section">
                        <p className="product-modal__hint">Добавьте до 10 изображений. Перетащите миниатюры для изменения порядка. Первое фото — главное на карточке.</p>
                        <ImageManager images={productEditForm.images || []} onChange={imgs => setProductEditForm(prev => ({ ...prev, images: imgs }))} maxImages={10} onError={msg => { setToast({ show: true, message: msg }); setTimeout(() => setToast({ show: false, message: '' }), 3000) }} />
                      </div>
                    )}

                    {productEditTab === 'chars' && (
                      <div className="product-modal__section">
                        <div className="admin-chars">
                          <div className="admin-chars__head">
                            <span className="product-modal__label">Характеристики товара</span>
                            <button type="button" className="btn btn--confirm" onClick={addProductEditCharacteristic}>+ Добавить</button>
                          </div>
                          {(productEditForm.characteristics || []).length === 0 && (
                            <p className="product-modal__hint">Нет характеристик. Выберите категорию или нажмите «+ Добавить».</p>
                          )}
                          <datalist id="edit-char-names">
                            {availableEditTemplates.map(t => <option key={t.id} value={t.name} />)}
                          </datalist>
                          {(productEditForm.characteristics || []).map((ch, idx) => (
                            <div className="admin-chars__row" key={`edit-char-${idx}`}>
                              <div className="admin-chars__field">
                                {ch._tpl ? (
                                  <span className="admin-edit-input" style={{ background: '#f8f9fa', display: 'flex', alignItems: 'center' }}>{ch.name}</span>
                                ) : (
                                  <input placeholder="Название" value={ch.name} list="edit-char-names"
                                    onChange={e => updateProductEditCharacteristic(idx, 'name', e.target.value)}
                                    className={`admin-edit-input${productEditErrors.characteristics?.[idx]?.name ? ' admin-edit-input--error' : ''}`} />
                                )}
                                {productEditErrors.characteristics?.[idx]?.name && <div className="admin-field-error">{productEditErrors.characteristics[idx].name}</div>}
                              </div>
                              <div className="admin-chars__field">
                                <CharValueInput
                                  ch={ch}
                                  templates={availableEditTemplates}
                                  onValueChange={v => updateProductEditCharacteristic(idx, 'value', v)}
                                  error={productEditErrors.characteristics?.[idx]?.value}
                                />
                                {productEditErrors.characteristics?.[idx]?.value && <div className="admin-field-error">{productEditErrors.characteristics[idx].value}</div>}
                              </div>
                              {!ch._tpl && (
                                <button type="button" className="btn btn--danger" onClick={() => removeProductEditCharacteristic(idx)}>✕</button>
                              )}
                              {ch._tpl && <div style={{ width: 28 }} />}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="admin-modal__actions product-modal__footer">
                      <button className="btn btn--cancel" onClick={cancelProductEdit}>Отмена</button>
                      <button className="btn btn--confirm" onClick={() => saveProductEdit(editingProductId)}>Сохранить</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && hasAccess && (
            <div className="admin-categories">
              <h2>Управление категориями</h2>
              <div style={{ marginBottom: 12 }}><button className="btn btn--confirm" onClick={() => setCategoryAddModal(true)}>Добавить категорию</button></div>
              <div style={{ marginBottom: 12 }}>
                <input className="admin-edit-input" placeholder="Поиск по названию..." value={categorySearch} onChange={e => { setCategorySearch(e.target.value); setCategoriesPage(1) }} style={{ maxWidth: 320 }} />
              </div>
              <div className="admin-users-table admin-categories-table">
                <table>
                  <thead><tr>
                    <th onClick={() => handleCategorySort('id')} style={{ cursor: 'pointer' }}>id{getCatSortIndicator('id')}</th>
                    <th onClick={() => handleCategorySort('icon')} style={{ cursor: 'pointer' }}>Изображение{getCatSortIndicator('icon')}</th>
                    <th onClick={() => handleCategorySort('name')} style={{ cursor: 'pointer' }}>Название{getCatSortIndicator('name')}</th>
                    <th onClick={() => handleCategorySort('description')} style={{ cursor: 'pointer' }}>Описание{getCatSortIndicator('description')}</th>
                    <th onClick={() => handleCategorySort('parentId')} style={{ cursor: 'pointer' }}>Родитель{getCatSortIndicator('parentId')}</th>
                    <th>Действия</th>
                  </tr></thead>
                  <tbody>
                    {filteredCategories.slice((categoriesPage - 1) * categoriesLimit, (categoriesPage - 1) * categoriesLimit + categoriesLimit).map(c => (
                      <tr key={c.id}>
                        <td>{c.id}</td>
                        <td>{editingCategoryId === c.id ? (
                          <SingleImagePicker
                            image={categoryEditForm.imagePreview ? { url: categoryEditForm.imagePreview } : null}
                            width={120}
                            height={120}
                            onChange={(img) => {
                              if (img) setCategoryEditForm(prev => ({ ...prev, imageFile: img.file, imagePreview: img.url }))
                              else setCategoryEditForm(prev => ({ ...prev, imageFile: null, imagePreview: '' }))
                            }}
                          />
                        ) : (<img src={c.icon || '/dataImg/noimagebig.png'} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />)}</td>
                        <td>{editingCategoryId === c.id ? <input value={categoryEditForm.name || ''} onChange={e => setCategoryEditForm(prev => ({ ...prev, name: e.target.value }))} className="admin-edit-input" /> : c.name}</td>
                        <td>{editingCategoryId === c.id ? <input value={categoryEditForm.description || ''} onChange={e => setCategoryEditForm(prev => ({ ...prev, description: e.target.value }))} className="admin-edit-input" /> : (c.description || '-')}</td>
                        <td>{editingCategoryId === c.id ? (<select value={categoryEditForm.parentId ?? ''} onChange={e => setCategoryEditForm(prev => ({ ...prev, parentId: e.target.value }))} className="admin-edit-input"><option key="__none" value="">-- нет --</option>{categories.filter(x => x.id !== c.id).map(x => (<option key={x.id} value={x.id}>{x.name}</option>))}</select>) : ((c.parent_id || c.parentId) ? (categories.find(x => x.id === (c.parent_id || c.parentId))?.name || '-') : '-')}</td>
                        <td className='admin__btns'>{editingCategoryId === c.id ? (<><button className="btn btn--confirm" onClick={() => saveCategoryEdit(c.id)}>Сохранить</button><button className="btn btn--cancel" onClick={cancelCategoryEdit}>Отмена</button></>) : (<><button className="btn btn--confirm" onClick={() => startCategoryEdit(c)}>Изменить</button><button className="btn btn--danger" onClick={() => openCategoryDelete(c.id)}>Удалить</button></>)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {categoryAddModal && (
                <div className="admin-modal-overlay" onMouseDown={() => { setCategoryAddModal(false); setCategoryAddForm({ name: '', description: '', parentId: '', imageFile: null, imagePreview: '' }); setCategoryAddErrors({}) }}>
                  <div className="admin-form-modal" onMouseDown={e => e.stopPropagation()}>
                    <div className="admin-form-modal__header">
                      <h3 className="admin-form-modal__title">Добавить категорию</h3>
                      <button className="admin-form-modal__close" onClick={() => { setCategoryAddModal(false); setCategoryAddForm({ name: '', description: '', parentId: '', imageFile: null, imagePreview: '' }); setCategoryAddErrors({}) }}><X size={20} /></button>
                    </div>
                    <div className="admin-form-modal__body">
                      <div className="admin-form-modal__field">
                        <label className="admin-form-modal__label">Название *</label>
                        <input placeholder="Название категории" value={categoryAddForm.name} onChange={e => setCategoryAddForm(prev => ({ ...prev, name: e.target.value }))} className={categoryAddErrors.name ? 'is-error' : ''} />
                        {categoryAddErrors.name && <span className="admin-form-modal__err">{categoryAddErrors.name}</span>}
                      </div>
                      <div className="admin-form-modal__field">
                        <label className="admin-form-modal__label">Описание</label>
                        <input placeholder="Краткое описание" value={categoryAddForm.description} onChange={e => setCategoryAddForm(prev => ({ ...prev, description: e.target.value }))} />
                      </div>
                      <div className="admin-form-modal__field">
                        <label className="admin-form-modal__label">Родительская категория</label>
                        <select value={categoryAddForm.parentId} onChange={e => setCategoryAddForm(prev => ({ ...prev, parentId: e.target.value }))}>
                          <option value="">— нет родителя —</option>
                          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                      </div>
                      <div className="admin-form-modal__field">
                        <label className="admin-form-modal__label">Изображение</label>
                        <SingleImagePicker
                          image={categoryAddForm.imagePreview ? { url: categoryAddForm.imagePreview } : null}
                          width={180} height={180}
                          onChange={img => { if (img) setCategoryAddForm(prev => ({ ...prev, imageFile: img.file, imagePreview: img.url })); else setCategoryAddForm(prev => ({ ...prev, imageFile: null, imagePreview: '' })) }}
                        />
                      </div>
                    </div>
                    <div className="admin-form-modal__footer">
                      <button className="admin-form-modal__btn admin-form-modal__btn--cancel" onClick={() => { setCategoryAddModal(false); setCategoryAddForm({ name: '', description: '', parentId: '', imageFile: null, imagePreview: '' }); setCategoryAddErrors({}) }}>Отмена</button>
                      <button className="admin-form-modal__btn admin-form-modal__btn--submit" onClick={async () => {
                        if (!categoryAddForm.name?.trim()) { setCategoryAddErrors({ name: 'Введите название категории' }); return }
                        const payload = { name: categoryAddForm.name, description: categoryAddForm.description || '', parentId: categoryAddForm.parentId === '' ? null : Number(categoryAddForm.parentId), imageFile: categoryAddForm.imageFile || undefined }
                        try { const res = await requestsService.createCategory(payload); if (res?.success && res.category) setCategories(prev => [...prev, res.category]); else { setToast({ show: true, message: res?.error?.message || 'Ошибка при создании категории' }); setTimeout(() => setToast({ show: false, message: '' }), 3000); return } }
                        catch {}
                        setCategoryAddForm({ name: '', description: '', parentId: '', imageFile: null, imagePreview: '' }); setCategoryAddModal(false)
                        setToast({ show: true, message: 'Категория создана' }); setTimeout(() => setToast({ show: false, message: '' }), 3000)
                      }}>Сохранить</button>
                    </div>
                  </div>
                </div>
              )}
              <div className="profile__pagination" style={{ marginTop: 12 }}>
                <label htmlFor="categories-limit">Показывать по:</label>
                <select className="profile__pagination-limit" id="categories-limit" value={categoriesLimit} onChange={e => { setCategoriesPage(1); setCategoriesLimit(Number(e.target.value)) }}><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select>
                <button className="profile__pagination-btn" onClick={() => setCategoriesPage(Math.max(1, categoriesPage - 1))} disabled={categoriesPage <= 1}>Назад</button>
                <span>Страница <input className="profile__pagination-input" type="number" min={1} max={Math.max(1, Math.ceil(filteredCategories.length / categoriesLimit))} value={categoriesPage} onChange={e => { let val = Number(e.target.value); if (!val || val < 1) val = 1; const mp = Math.max(1, Math.ceil(filteredCategories.length / categoriesLimit)); if (val > mp) val = mp; setCategoriesPage(val) }} /> из {Math.max(1, Math.ceil(filteredCategories.length / categoriesLimit))}</span>
                <button className="profile__pagination-btn" onClick={() => setCategoriesPage(Math.min(Math.ceil(filteredCategories.length / categoriesLimit) || 1, categoriesPage + 1))} disabled={categoriesPage >= Math.ceil(filteredCategories.length / categoriesLimit)}>Вперёд</button>
              </div>
              <ConfirmModal open={categoryDeleteModal.open} title={`Удалить категорию #${categoryDeleteModal.id}?`} message="Категория удалится вместе со всеми подкатегориями и их шаблонами характеристик. Товары, которые останутся без категории, будут удалены вместе с их отзывами и характеристиками. Товары, привязанные ещё и к другим категориям, сохранятся (отвяжутся только от удаляемых)." confirmLabel="Удалить" variant="danger" onConfirm={confirmCategoryDelete} onCancel={closeCategoryDelete} />
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="admin-bookings">
              <h2>Управление заказами</h2>
              {ordersPending > 0 && (
                <button
                  type="button"
                  className="admin-orders-pending"
                  onClick={() => {
                    setOrdersSearch(''); setOrdersSearchInput('')
                    setOrdersDelivery(''); setOrdersDateFrom(''); setOrdersDateTo('')
                    setOrdersStatus('в ожидании')
                    dispatch(setSortExplicit({ sortBy: 'createdAt', sortDir: 'asc' }))
                    dispatch(setPage(1))
                  }}
                  title="Показать необработанные заказы (от старых к новым)"
                >
                  <span className="admin-orders-pending__dot" />
                  {pendingOrdersPhrase(ordersPending)} — нажмите, чтобы обработать
                </button>
              )}
              <div className="admin-reviews-filters">
                <input className="admin-edit-input" placeholder="Поиск по ID или имени..." value={ordersSearchInput} onChange={e => setOrdersSearchInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyOrderFilters()} style={{ minWidth: 200 }} />
                <select className="admin-edit-input" value={ordersStatus} onChange={e => { setOrdersStatus(e.target.value); dispatch(setPage(1)) }}>
                  <option value="">— Все статусы —</option>
                  <option value="в ожидании">В ожидании</option>
                  <option value="подтверждено">Подтверждено</option>
                  <option value="отменено">Отменено</option>
                  <option value="выдано">Выдано</option>
                </select>
                <select className="admin-edit-input" value={ordersDelivery} onChange={e => { setOrdersDelivery(e.target.value); dispatch(setPage(1)) }}>
                  <option value="">— Все способы —</option>
                  <option value="pickup">Самовывоз</option>
                  <option value="delivery">Доставка</option>
                </select>
                <input type="date" className="admin-edit-input" value={ordersDateFrom} onChange={e => setOrdersDateFrom(e.target.value)} title="С даты" />
                <input type="date" className="admin-edit-input" value={ordersDateTo} onChange={e => setOrdersDateTo(e.target.value)} title="По дату" />
                <button className="btn btn--confirm" onClick={applyOrderFilters}>Применить</button>
                <button className="btn btn--cancel" onClick={resetOrderFilters}>Сбросить</button>
              </div>
              <div className="admin-users-table admin-bookings-table">
                <table>
                  <thead><tr>
                    <th onClick={() => handleOrdersSortClick('id')} style={{ cursor: 'pointer' }}>id{ordersState.sortBy === 'id' ? (ordersState.sortDir === 'asc' ? ' ↑' : ' ↓') : ''}</th>
                    <th onClick={() => handleOrdersSortClick('userId')} style={{ cursor: 'pointer' }}>Пользователь{ordersState.sortBy === 'userId' ? (ordersState.sortDir === 'asc' ? ' ↑' : ' ↓') : ''}</th>
                    <th onClick={() => handleOrdersSortClick('total')} style={{ cursor: 'pointer' }}>Сумма{ordersState.sortBy === 'total' ? (ordersState.sortDir === 'asc' ? ' ↑' : ' ↓') : ''}</th>
                    <th onClick={() => handleOrdersSortClick('status')} style={{ cursor: 'pointer' }}>Статус{ordersState.sortBy === 'status' ? (ordersState.sortDir === 'asc' ? ' ↑' : ' ↓') : ''}</th>
                    <th>Получение</th>
                    <th onClick={() => handleOrdersSortClick('createdAt')} style={{ cursor: 'pointer' }}>Создан{ordersState.sortBy === 'createdAt' ? (ordersState.sortDir === 'asc' ? ' ↑' : ' ↓') : ''}</th>
                    <th>Действия</th>
                  </tr></thead>
                  <tbody>
                    {ordersPageData.data.map(b => (
                      <tr key={b.id}>
                        <td>{b.id}</td>
                        <td>#{b.userId} — {b.userName || '?'}</td>
                        <td>{b.total ? `${b.total} ₽` : '-'}</td>
                        <td>{editingOrderId === b.id ? (<select value={orderEditForm.status} onChange={e => setOrderEditForm(prev => ({ ...prev, status: e.target.value }))} className="admin-edit-input"><option value="в ожидании">в ожидании</option><option value="подтверждено">подтверждено</option><option value="отменено">отменено</option><option value="выдано">выдано</option></select>) : b.status}</td>
                        <td title={b.deliveryAddress || undefined}>{editingOrderId === b.id ? (
                          <div className="admin-order-delivery-edit">
                            <select className="admin-edit-input" value={orderEditForm.deliveryMethod} onChange={e => setOrderEditForm(prev => ({ ...prev, deliveryMethod: e.target.value, ...(e.target.value !== 'delivery' ? { deliveryCarrier: '', deliveryAddress: '' } : {}) }))}>
                              <option value="">— не указано —</option>
                              <option value="pickup">Самовывоз</option>
                              <option value="delivery">Доставка</option>
                            </select>
                            {orderEditForm.deliveryMethod === 'delivery' && (
                              <>
                                <select className="admin-edit-input" value={orderEditForm.deliveryCarrier} onChange={e => setOrderEditForm(prev => ({ ...prev, deliveryCarrier: e.target.value }))}>
                                  <option value="">— служба —</option>
                                  <option value="pochta">Почта России</option>
                                  <option value="sdek">СДЭК</option>
                                </select>
                                <input className="admin-edit-input" type="text" placeholder="Адрес доставки" value={orderEditForm.deliveryAddress} onChange={e => setOrderEditForm(prev => ({ ...prev, deliveryAddress: e.target.value }))} />
                              </>
                            )}
                          </div>
                        ) : (<>{orderDeliveryLabel(b.deliveryMethod, b.deliveryCarrier)}{b.deliveryAddress ? <span className="admin-booking__addr"> · {b.deliveryAddress}</span> : ''}</>)}</td>
                        <td>{(b.created_at || b.createdAt) ? new Date(b.created_at || b.createdAt).toLocaleDateString('ru-RU') : '-'}</td>
                        <td className='admin__btns'>{editingOrderId === b.id ? (<><button className="btn btn--confirm" onClick={async () => {
                          const payload = {
                            status: orderEditForm.status,
                            deliveryMethod: orderEditForm.deliveryMethod || null,
                            deliveryCarrier: orderEditForm.deliveryMethod === 'delivery' ? (orderEditForm.deliveryCarrier || null) : null,
                            deliveryAddress: orderEditForm.deliveryMethod === 'delivery' ? (orderEditForm.deliveryAddress || null) : null,
                          }
                          try { const res = await requestsService.updateOrder(b.id, payload); if (res?.success && res.order) setOrdersPageData(prev => ({ ...prev, data: prev.data.map(it => it.id === b.id ? res.order : it) })); else setOrdersPageData(prev => ({ ...prev, data: prev.data.map(it => it.id === b.id ? ({ ...it, ...payload }) : it) })) }
                          catch { setOrdersPageData(prev => ({ ...prev, data: prev.data.map(it => it.id === b.id ? ({ ...it, ...payload }) : it) })) }
                          setEditingOrderId(null); setToast({ show: true, message: `Заказ ${b.id} обновлён` }); setTimeout(() => setToast({ show: false, message: '' }), 3000)
                        }}>Сохранить</button><button className="btn btn--cancel" onClick={() => { setEditingOrderId(null); setOrderEditForm({ status: '', deliveryMethod: '', deliveryCarrier: '', deliveryAddress: '' }) }}>Отмена</button></>) : (<><button className="btn btn--confirm" onClick={() => { setEditingOrderId(b.id); setOrderEditForm({ status: b.status || 'в ожидании', deliveryMethod: b.deliveryMethod || '', deliveryCarrier: b.deliveryCarrier || '', deliveryAddress: b.deliveryAddress || '' }) }}>Изменить</button><button className="btn btn--danger" onClick={() => setOrderCancelModal({ open: true, id: b.id })}>Отменить</button></>)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="profile__pagination" style={{ marginTop: 12 }}>
                <label htmlFor="orders-limit">Показывать по:</label>
                <select className="profile__pagination-limit" id="orders-limit" value={ordersState.limit} onChange={e => { dispatch(setPage(1)); dispatch(setLimit(Number(e.target.value))) }}><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select>
                <button className="profile__pagination-btn" onClick={() => dispatch(setPage(Math.max(1, ordersState.page - 1)))} disabled={ordersState.page <= 1}>Назад</button>
                <span>Страница <input className="profile__pagination-input" type="number" min={1} max={Math.max(1, Math.ceil((ordersPageData.total || 0) / ordersState.limit))} value={ordersState.page} onChange={e => { let val = Number(e.target.value); if (!val || val < 1) val = 1; const mp = Math.max(1, Math.ceil((ordersPageData.total || 0) / ordersState.limit)); if (val > mp) val = mp; dispatch(setPage(val)) }} /> из {Math.max(1, Math.ceil((ordersPageData.total || 0) / ordersState.limit))}</span>
                <button className="profile__pagination-btn" onClick={() => dispatch(setPage(Math.min(Math.ceil((ordersPageData.total || 0) / ordersState.limit) || 1, ordersState.page + 1)))} disabled={ordersState.page >= Math.ceil((ordersPageData.total || 0) / ordersState.limit)}>Вперёд</button>
              </div>
            </div>
          )}

          {/* Characteristic Templates Tab */}
          {activeTab === 'chars' && isAdmin && (
            <div className="admin-chars-tab">
              <h2>Шаблоны характеристик</h2>
              <div className="admin-chars-tab__toolbar">
                <input
                  className="admin-edit-input"
                  style={{ flex: 1, minWidth: 150 }}
                  placeholder="Поиск по названию..."
                  value={charTplSearch}
                  onChange={e => { setCharTplSearch(e.target.value); setCharTplPage(1) }}
                />
                <select
                  className="admin-edit-input"
                  style={{ flex: 1, minWidth: 150 }}
                  value={charTplCategoryFilter}
                  onChange={e => { setCharTplCategoryFilter(e.target.value); setCharTplPage(1) }}
                >
                  <option value="">— Все категории —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button className="btn btn--confirm" onClick={() => openCharTemplateModal()}>+ Добавить шаблон</button>
              </div>
              <div className="admin-users-table">
                <table>
                  <thead><tr>
                    {[
                      { key: 'id', label: 'ID' },
                      { key: 'categoryName', label: 'Категория' },
                      { key: 'name', label: 'Название' },
                      { key: 'type', label: 'Тип' },
                    ].map(col => (
                      <th key={col.key} onClick={() => handleCharTplSort(col.key)} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        {col.label} {charTplSortBy === col.key ? (charTplSortDir === 'asc' ? '↑' : '↓') : ''}
                      </th>
                    ))}
                    <th>Варианты / диапазон</th>
                    <th onClick={() => handleCharTplSort('isFilterable')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Фильтр {charTplSortBy === 'isFilterable' ? (charTplSortDir === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th>Действия</th>
                  </tr></thead>
                  <tbody>
                    {pagedCharTemplates.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', color: '#aaa', padding: 24 }}>
                        {charTplSearch ? 'Ничего не найдено' : 'Нет шаблонов. Добавьте первый.'}
                      </td></tr>
                    )}
                    {pagedCharTemplates.map(t => (
                      <tr key={t.id}>
                        <td>{t.id}</td>
                        <td>{t.categoryName}</td>
                        <td>{t.name}</td>
                        <td>{{ text: 'Текст', select: 'Выбор', range: 'Диапазон', boolean: 'Да/Нет' }[t.type]}</td>
                        <td style={{ fontSize: '0.85rem', color: '#636e72', maxWidth: 200 }}>
                          {t.type === 'select' && Array.isArray(t.options) && t.options.join(', ')}
                          {t.type === 'range' && t.options && `${t.options.min ?? '?'} – ${t.options.max ?? '?'} ${t.options.unit ?? ''}`}
                          {t.type === 'boolean' && 'Да / Нет'}
                          {t.type === 'text' && '—'}
                        </td>
                        <td>{t.isFilterable ? '✓' : '—'}</td>
                        <td className="admin__btns">
                          <button className="btn btn--confirm" onClick={() => openCharTemplateModal(t)}>Изменить</button>
                          <button className="btn btn--danger" onClick={() => setCharTemplateDeleteModal({ open: true, id: t.id })}>Удалить</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="profile__pagination" style={{ marginTop: 12 }}>
                <label htmlFor="char-tpl-limit">Показывать по:</label>
                <select className="profile__pagination-limit" id="char-tpl-limit" value={charTplLimit}
                  onChange={e => { setCharTplPage(1); setCharTplLimit(Number(e.target.value)) }}>
                  <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                </select>
                <button className="profile__pagination-btn" disabled={charTplPageSafe <= 1}
                  onClick={() => setCharTplPage(p => p - 1)}>Назад</button>
                <span>Страница{' '}
                  <input className="profile__pagination-input" type="number" min={1} max={charTplTotalPages}
                    value={charTplPageSafe}
                    onChange={e => { let v = Number(e.target.value); if (!v || v < 1) v = 1; if (v > charTplTotalPages) v = charTplTotalPages; setCharTplPage(v) }}
                  />{' '}из {charTplTotalPages}
                  <span style={{ color: '#aaa', fontSize: '0.83rem', marginLeft: 8 }}>({filteredCharTemplates.length} записей)</span>
                </span>
                <button className="profile__pagination-btn" disabled={charTplPageSafe >= charTplTotalPages}
                  onClick={() => setCharTplPage(p => p + 1)}>Вперёд</button>
              </div>

              {/* Add/Edit modal */}
              {charTemplateModal.open && (
                <div className="admin-modal-overlay" onMouseDown={() => setCharTemplateModal({ open: false, editing: null })}>
                  <div className="admin-form-modal admin-form-modal--wide" onMouseDown={e => e.stopPropagation()}>
                    <div className="admin-form-modal__header">
                      <h3 className="admin-form-modal__title">{charTemplateModal.editing ? 'Изменить шаблон' : 'Добавить шаблон'}</h3>
                      <button className="admin-form-modal__close" onClick={() => setCharTemplateModal({ open: false, editing: null })}><X size={20} /></button>
                    </div>
                    <div className="admin-form-modal__body">
                      <div className="admin-form-modal__field">
                        <label className="admin-form-modal__label">Категория *</label>
                        <select className={charTemplateErrors.categoryId ? 'is-error' : ''} value={charTemplateForm.categoryId} onChange={e => setCharTemplateForm(p => ({ ...p, categoryId: e.target.value }))}>
                          <option value="">— выберите —</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        {charTemplateErrors.categoryId && <span className="admin-form-modal__err">{charTemplateErrors.categoryId}</span>}
                      </div>
                      <div className="admin-form-modal__field">
                        <label className="admin-form-modal__label">Название характеристики *</label>
                        <input className={charTemplateErrors.name ? 'is-error' : ''} placeholder="напр. Цвет, Объём, Водонепроницаемость" value={charTemplateForm.name} onChange={e => setCharTemplateForm(p => ({ ...p, name: e.target.value }))} />
                        {charTemplateErrors.name && <span className="admin-form-modal__err">{charTemplateErrors.name}</span>}
                      </div>
                      <div className="admin-form-modal__field">
                        <label className="admin-form-modal__label">Тип значения</label>
                        <select value={charTemplateForm.type} onChange={e => setCharTemplateForm(p => ({ ...p, type: e.target.value, options: null }))}>
                          <option value="text">Текст (свободный ввод)</option>
                          <option value="select">Выбор из списка</option>
                          <option value="range">Числовой диапазон</option>
                          <option value="boolean">Да / Нет</option>
                        </select>
                      </div>
                      {charTemplateForm.type === 'select' && (
                        <div className="admin-form-modal__field">
                          <label className="admin-form-modal__label">Варианты (через запятую)</label>
                          <input placeholder="напр. Красный, Синий, Зелёный" value={Array.isArray(charTemplateForm.options) ? charTemplateForm.options.join(', ') : ''} onChange={e => setCharTemplateForm(p => ({ ...p, options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} />
                        </div>
                      )}
                      {charTemplateForm.type === 'range' && (
                        <div className="admin-form-modal__row">
                          <div className="admin-form-modal__field">
                            <label className="admin-form-modal__label">Минимум</label>
                            <input type="number" value={charTemplateForm.options?.min ?? ''} onChange={e => setCharTemplateForm(p => ({ ...p, options: { ...(p.options || {}), min: e.target.value } }))} />
                          </div>
                          <div className="admin-form-modal__field">
                            <label className="admin-form-modal__label">Максимум</label>
                            <input type="number" value={charTemplateForm.options?.max ?? ''} onChange={e => setCharTemplateForm(p => ({ ...p, options: { ...(p.options || {}), max: e.target.value } }))} />
                          </div>
                          <div className="admin-form-modal__field">
                            <label className="admin-form-modal__label">Единица (л, кг, м…)</label>
                            <input value={charTemplateForm.options?.unit ?? ''} onChange={e => setCharTemplateForm(p => ({ ...p, options: { ...(p.options || {}), unit: e.target.value } }))} />
                          </div>
                        </div>
                      )}
                      <label className="admin-filter-check">
                        <input type="checkbox" className="filter-check-input" checked={charTemplateForm.isFilterable} onChange={e => setCharTemplateForm(p => ({ ...p, isFilterable: e.target.checked }))} />
                        <span className="filter-check-box" />
                        Показывать как фильтр в каталоге
                      </label>
                      {charTemplateErrors.form && <span className="admin-form-modal__err">{charTemplateErrors.form}</span>}
                    </div>
                    <div className="admin-form-modal__footer">
                      <button className="admin-form-modal__btn admin-form-modal__btn--cancel" onClick={() => setCharTemplateModal({ open: false, editing: null })}>Отмена</button>
                      <button className="admin-form-modal__btn admin-form-modal__btn--submit" onClick={saveCharTemplate}>Сохранить</button>
                    </div>
                  </div>
                </div>
              )}

              <ConfirmModal open={charTemplateDeleteModal.open} title="Удалить шаблон характеристики?" message="Шаблон будет удалён. Уже сохранённые значения у товаров останутся." confirmLabel="Удалить" onConfirm={confirmDeleteCharTemplate} onCancel={() => setCharTemplateDeleteModal({ open: false, id: null })} />
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && hasAccess && (
            <div className="admin-reviews">
              <h2>Управление отзывами</h2>
              {reviewPendingCount > 0 && (
                <button
                  className={`admin-reviews__pending-btn ${reviewStatusFilter === 'pending' ? 'admin-reviews__pending-btn--active' : ''}`}
                  onClick={() => { setReviewStatusFilter(reviewStatusFilter === 'pending' ? '' : 'pending'); setReviewsPage(1) }}
                >
                  {reviewPendingCount} {reviewPendingCount === 1 ? 'новый отзыв' : reviewPendingCount < 5 ? 'новых отзыва' : 'новых отзывов'} ожидают модерации
                </button>
              )}
              {/* Filters */}
              <div className="admin-reviews-filters">
                <input
                  className="admin-edit-input"
                  placeholder="Автор (ID или имя)..."
                  value={reviewSearchInput}
                  onChange={e => setReviewSearchInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyReviewFilters()}
                  style={{ minWidth: 160 }}
                />
                <input
                  className="admin-edit-input"
                  placeholder="Название товара..."
                  value={reviewProductSearchInput}
                  onChange={e => setReviewProductSearchInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyReviewFilters()}
                  style={{ minWidth: 160 }}
                />
                <label className="admin-reviews-filters__date-group">
                  <span className="admin-reviews-filters__date-label">С</span>
                  <input
                    type="date"
                    className="admin-edit-input"
                    value={reviewDateFrom}
                    onChange={e => setReviewDateFrom(e.target.value)}
                  />
                </label>
                <label className="admin-reviews-filters__date-group">
                  <span className="admin-reviews-filters__date-label">По</span>
                  <input
                    type="date"
                    className="admin-edit-input"
                    value={reviewDateTo}
                    onChange={e => setReviewDateTo(e.target.value)}
                  />
                </label>
                <select className="admin-edit-input" value={reviewRating} onChange={e => { setReviewRating(e.target.value); setReviewsPage(1) }}>
                  <option value="">— Все оценки —</option>
                  <option value="5">5 ★</option>
                  <option value="4">4 ★</option>
                  <option value="3">3 ★</option>
                  <option value="2">2 ★</option>
                  <option value="1">1 ★</option>
                </select>
                <select className="admin-edit-input" value={reviewHasPhoto} onChange={e => { setReviewHasPhoto(e.target.value); setReviewsPage(1) }}>
                  <option value="">— Все —</option>
                  <option value="yes">С фото</option>
                  <option value="no">Без фото</option>
                </select>
                <select className="admin-edit-input" value={reviewStatusFilter} onChange={e => { setReviewStatusFilter(e.target.value); setReviewsPage(1) }}>
                  <option value="">— Все статусы —</option>
                  <option value="pending">Новые</option>
                  <option value="approved">Одобренные</option>
                </select>
                <button className="btn btn--confirm" onClick={applyReviewFilters}>Применить</button>
                <button className="btn btn--cancel" onClick={resetReviewFilters}>Сбросить</button>
              </div>
              <div className="admin-users-table">
                <table>
                  <thead><tr>
                    <th onClick={() => handleReviewSort('id')} style={{ cursor: 'pointer' }}>ID{getReviewSortIndicator('id')}</th>
                    <th>Товар</th>
                    <th>Автор</th>
                    <th onClick={() => handleReviewSort('rating')} style={{ cursor: 'pointer' }}>Оценка{getReviewSortIndicator('rating')}</th>
                    <th>Текст</th>
                    <th>Фото</th>
                    <th onClick={() => handleReviewSort('created_at')} style={{ cursor: 'pointer' }}>Дата{getReviewSortIndicator('created_at')}</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr></thead>
                  <tbody>
                    {reviewsData.data.map(r => (
                      <tr key={r.id}>
                        <td>{r.id}</td>
                        <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.productName}</td>
                        <td>#{r.userId} — {r.userName}</td>
                        <td>
                          <Rating readonly initialValue={r.rating} size={14} SVGstyle={{ display: 'inline' }} />
                          <span style={{ marginLeft: 4, fontSize: '0.82rem', color: '#f39c12', fontWeight: 600 }}>{r.rating}</span>
                        </td>
                        <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.body ? (r.body.length > 60 ? r.body.slice(0, 60) + '...' : r.body) : '—'}
                        </td>
                        <td>
                          {r.images && r.images.length > 0
                            ? <span style={{ color: '#27ae60', fontWeight: 600 }}>{r.images.length} фото</span>
                            : <span style={{ color: '#b2bec3' }}>—</span>}
                        </td>
                        <td>{r.createdAt}</td>
                        <td>
                          <span className={`admin-review-status admin-review-status--${r.status}`}>
                            {r.status === 'pending' ? 'Новый' : 'Одобрен'}
                          </span>
                        </td>
                        <td className="admin__btns">
                          <button className="btn btn--two" onClick={() => setReviewViewModal({ open: true, review: r })}>Просмотр</button>
                          {isAdmin && <button className="btn btn--danger" onClick={() => setReviewDeleteModal({ open: true, id: r.id })}>Удалить</button>}
                        </td>
                      </tr>
                    ))}
                    {reviewsData.data.length === 0 && (
                      <tr><td colSpan={8} style={{ textAlign: 'center', color: '#aaa', padding: 24 }}>Отзывы не найдены</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="profile__pagination" style={{ marginTop: 12 }}>
                <label htmlFor="reviews-limit">Показывать по:</label>
                <select className="profile__pagination-limit" id="reviews-limit" value={reviewsLimit} onChange={e => { setReviewsPage(1); setReviewsLimit(Number(e.target.value)) }}><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select>
                <button className="profile__pagination-btn" onClick={() => setReviewsPage(Math.max(1, reviewsPage - 1))} disabled={reviewsPage <= 1}>Назад</button>
                <span>Страница <input className="profile__pagination-input" type="number" min={1} max={Math.max(1, Math.ceil((reviewsData.total || 0) / reviewsLimit))} value={reviewsPage} onChange={e => { let val = Number(e.target.value); if (!val || val < 1) val = 1; const mp = Math.max(1, Math.ceil((reviewsData.total || 0) / reviewsLimit)); if (val > mp) val = mp; setReviewsPage(val) }} /> из {Math.max(1, Math.ceil((reviewsData.total || 0) / reviewsLimit))}</span>
                <button className="profile__pagination-btn" onClick={() => setReviewsPage(Math.min(Math.ceil((reviewsData.total || 0) / reviewsLimit) || 1, reviewsPage + 1))} disabled={reviewsPage >= Math.ceil((reviewsData.total || 0) / reviewsLimit)}>Вперёд</button>
              </div>

              {/* View modal */}
              {reviewViewModal.open && reviewViewModal.review && (() => {
                const r = reviewViewModal.review
                return (
                  <div className="admin-modal-overlay" onMouseDown={() => setReviewViewModal({ open: false, review: null })}>
                    <div className="admin-review-modal" onMouseDown={e => e.stopPropagation()}>
                      <div className="admin-review-modal__header">
                        <div className="admin-review-modal__header-left">
                          <span className="admin-review-modal__id">Отзыв #{r.id}</span>
                          <span className={`admin-review-status admin-review-status--${r.status}`}>
                            {r.status === 'pending' ? 'Ожидает модерации' : 'Одобрен'}
                          </span>
                        </div>
                        <button className="admin-staff-modal__close" onClick={() => setReviewViewModal({ open: false, review: null })}><X size={20} /></button>
                      </div>

                      <div className="admin-review-modal__body">
                        <div className="admin-review-modal__meta">
                          <div className="admin-review-modal__meta-row">
                            <span className="admin-review-modal__meta-label">Товар</span>
                            <span className="admin-review-modal__meta-value">{r.productName}</span>
                          </div>
                          <div className="admin-review-modal__meta-row">
                            <span className="admin-review-modal__meta-label">Автор</span>
                            <span className="admin-review-modal__meta-value">#{r.userId} — {r.userName}</span>
                          </div>
                          <div className="admin-review-modal__meta-row">
                            <span className="admin-review-modal__meta-label">Оценка</span>
                            <span className="admin-review-modal__meta-value admin-review-modal__rating">
                              <Rating readonly initialValue={r.rating} size={18} SVGstyle={{ display: 'inline' }} />
                              <strong style={{ color: '#f39c12' }}>{r.rating}/5</strong>
                            </span>
                          </div>
                          <div className="admin-review-modal__meta-row">
                            <span className="admin-review-modal__meta-label">Дата</span>
                            <span className="admin-review-modal__meta-value">{r.createdAt}</span>
                          </div>
                        </div>

                        {r.body && (
                          <div className="admin-review-modal__section">
                            <div className="admin-review-modal__section-title">Текст отзыва</div>
                            <p className="admin-review-modal__text">{r.body}</p>
                          </div>
                        )}

                        {r.images && r.images.length > 0 && (
                          <div className="admin-review-modal__section">
                            <div className="admin-review-modal__section-title">Фотографии ({r.images.length})</div>
                            <div className="admin-review-modal__photos">
                              {r.images.map((url, idx) => (
                                <button key={idx} className="admin-review-modal__photo-btn" onClick={() => setReviewLightboxUrl(url)}>
                                  <img src={url} alt="" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="admin-review-modal__footer">
                        <div className="admin-review-modal__footer-left">
                          {isAdmin && (
                            <>
                              <button className="admin-review-modal__btn admin-review-modal__btn--danger" onClick={() => setReviewDeleteModal({ open: true, id: r.id })}>Удалить отзыв</button>
                              <button className="admin-review-modal__btn admin-review-modal__btn--danger-outline" onClick={() => setReviewUserDeleteModal({ open: true, reviewId: r.id, userId: r.userId })}>Удалить пользователя</button>
                            </>
                          )}
                        </div>
                        <div className="admin-review-modal__footer-right">
                          <button className="admin-review-modal__btn admin-review-modal__btn--ghost" onClick={() => setReviewViewModal({ open: false, review: null })}>Закрыть</button>
                          {r.status === 'pending' && isAdmin && (
                            <button className="admin-review-modal__btn admin-review-modal__btn--approve" onClick={() => handleApproveReview(r.id)}>✓ Одобрить</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {reviewLightboxUrl && <ImagePreviewLightbox url={reviewLightboxUrl} onClose={() => setReviewLightboxUrl(null)} />}

              {isAdmin && <ConfirmModal open={reviewDeleteModal.open} title={`Удалить отзыв #${reviewDeleteModal.id}?`} message="Отзыв будет удалён без возможности восстановления." confirmLabel="Удалить отзыв" onConfirm={confirmDeleteReview} onCancel={() => setReviewDeleteModal({ open: false, id: null })} />}
              {isAdmin && <ConfirmModal open={reviewUserDeleteModal.open} title={`Удалить пользователя #${reviewUserDeleteModal.userId}?`} message="Пользователь и все его отзывы будут удалены навсегда. Это действие нельзя отменить." confirmLabel="Удалить пользователя" onConfirm={confirmDeleteReviewUser} onCancel={() => setReviewUserDeleteModal({ open: false, reviewId: null, userId: null })} />}
            </div>
          )}

          {/* Slides Tab */}
          {activeTab === 'slides' && hasAccess && (
            <div className="admin-slides">
              <h2>Управление слайдером</h2>
              <div style={{ marginBottom: 12 }}>
                <button className="btn btn--confirm" onClick={openSlideAddModal}>Добавить слайд</button>
              </div>
              <div className="admin-reviews-filters">
                <input
                  className="admin-edit-input"
                  placeholder="Поиск по ссылке..."
                  value={slideSearchInput}
                  onChange={e => setSlideSearchInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applySlideFilters()}
                  style={{ minWidth: 220 }}
                />
                <button className="btn btn--confirm" onClick={applySlideFilters}>Применить</button>
                <button className="btn btn--cancel" onClick={resetSlideFilters}>Сбросить</button>
              </div>
              <div className="admin-users-table">
                <table>
                  <thead><tr>
                    <th onClick={() => handleSlideSort('id')} style={{ cursor: 'pointer' }}>ID{getSlideSortIndicator('id')}</th>
                    <th>Изображение</th>
                    <th onClick={() => handleSlideSort('title')} style={{ cursor: 'pointer' }}>Заголовок{getSlideSortIndicator('title')}</th>
                    <th>Описание</th>
                    <th>Ссылка</th>
                    <th onClick={() => handleSlideSort('created_at')} style={{ cursor: 'pointer' }}>Дата создания{getSlideSortIndicator('created_at')}</th>
                    <th>Действия</th>
                  </tr></thead>
                  <tbody>
                    {slidesData.data.map(s => (
                      <tr key={s.id}>
                        <td>{s.id}</td>
                        <td><img src={s.image || '/dataImg/noimagebig.png'} alt="" style={{ width: 96, height: 54, objectFit: 'cover', borderRadius: 4 }} /></td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</td>
                        <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.description ? (s.description.length > 60 ? s.description.slice(0, 60) + '...' : s.description) : '—'}
                        </td>
                        <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.link || '—'}</td>
                        <td>{s.createdAt ? new Date(s.createdAt).toLocaleDateString('ru-RU') : '—'}</td>
                        <td className="admin__btns">
                          <button className="btn btn--confirm" onClick={() => openSlideEditModal(s)}>Изменить</button>
                          <button className="btn btn--danger" onClick={() => setSlideDeleteModal({ open: true, id: s.id })}>Удалить</button>
                        </td>
                      </tr>
                    ))}
                    {slidesData.data.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', color: '#aaa', padding: 24 }}>Слайды не найдены</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="profile__pagination" style={{ marginTop: 12 }}>
                <label htmlFor="slides-limit">Показывать по:</label>
                <select className="profile__pagination-limit" id="slides-limit" value={slidesLimit} onChange={e => { setSlidesPage(1); setSlidesLimit(Number(e.target.value)) }}><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select>
                <button className="profile__pagination-btn" onClick={() => setSlidesPage(Math.max(1, slidesPage - 1))} disabled={slidesPage <= 1}>Назад</button>
                <span>Страница <input className="profile__pagination-input" type="number" min={1} max={Math.max(1, Math.ceil((slidesData.total || 0) / slidesLimit))} value={slidesPage} onChange={e => { let val = Number(e.target.value); if (!val || val < 1) val = 1; const mp = Math.max(1, Math.ceil((slidesData.total || 0) / slidesLimit)); if (val > mp) val = mp; setSlidesPage(val) }} /> из {Math.max(1, Math.ceil((slidesData.total || 0) / slidesLimit))}</span>
                <button className="profile__pagination-btn" onClick={() => setSlidesPage(Math.min(Math.ceil((slidesData.total || 0) / slidesLimit) || 1, slidesPage + 1))} disabled={slidesPage >= Math.ceil((slidesData.total || 0) / slidesLimit)}>Вперёд</button>
              </div>

              {/* Add/Edit slide modal */}
              {slideModal.open && (
                <div className="admin-modal-overlay" onMouseDown={closeSlideModal}>
                  <div className="admin-form-modal admin-form-modal--wide" onMouseDown={e => e.stopPropagation()}>
                    <div className="admin-form-modal__header">
                      <h3 className="admin-form-modal__title">{slideModal.editing ? `Изменить слайд #${slideModal.editing.id}` : 'Добавить слайд'}</h3>
                      <button className="admin-form-modal__close" onClick={closeSlideModal}><X size={20} /></button>
                    </div>
                    <div className="admin-form-modal__body">
                      <div className="admin-form-modal__field">
                        <label className="admin-form-modal__label">Заголовок *</label>
                        <input className={slideErrors.title ? 'is-error' : ''} value={slideForm.title} onChange={e => { setSlideForm(p => ({ ...p, title: e.target.value })); setSlideErrors(p => ({ ...p, title: undefined })) }} placeholder="Например: Всё лучшее для вашего сада" />
                        {slideErrors.title && <span className="admin-form-modal__err">{slideErrors.title}</span>}
                      </div>
                      <div className="admin-form-modal__field">
                        <label className="admin-form-modal__label">Описание</label>
                        <textarea value={slideForm.description} onChange={e => setSlideForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Короткое описание слайда" />
                      </div>
                      <div className="admin-form-modal__field">
                        <label className="admin-form-modal__label">Ссылка</label>
                        <input value={slideForm.link} onChange={e => setSlideForm(p => ({ ...p, link: e.target.value }))} placeholder="/catalog или https://..." />
                      </div>
                      <div className="admin-form-modal__field">
                        <label className="admin-form-modal__label">Изображение {!slideModal.editing && '*'}</label>
                        <SingleImagePicker
                          image={slideForm.imagePreview ? { url: slideForm.imagePreview } : null}
                          width={340} height={190}
                          onChange={img => { if (img) { setSlideForm(p => ({ ...p, imageFile: img.file, imagePreview: img.url })); setSlideErrors(p => ({ ...p, image: undefined })) } else setSlideForm(p => ({ ...p, imageFile: null, imagePreview: '' })) }}
                          onError={msg => setSlideErrors(p => ({ ...p, image: msg }))}
                        />
                        {slideErrors.image && <span className="admin-form-modal__err">{slideErrors.image}</span>}
                      </div>
                      {slideErrors.form && <span className="admin-form-modal__err">{slideErrors.form}</span>}
                    </div>
                    <div className="admin-form-modal__footer">
                      <button className="admin-form-modal__btn admin-form-modal__btn--cancel" onClick={closeSlideModal}>Отмена</button>
                      <button className="admin-form-modal__btn admin-form-modal__btn--submit" onClick={saveSlide}>Сохранить</button>
                    </div>
                  </div>
                </div>
              )}

              <ConfirmModal open={slideDeleteModal.open} title={`Удалить слайд #${slideDeleteModal.id}?`} message="Слайд будет удалён с главной страницы." confirmLabel="Удалить" onConfirm={confirmDeleteSlide} onCancel={() => setSlideDeleteModal({ open: false, id: null })} />
            </div>
          )}
          {/* Statistics Tab */}
          {activeTab === 'stats' && hasAccess && (
            <div className="admin-stats">
              <div className="admin-stats__header">
                <h2>Статистика продаж</h2>
                <button className="btn btn--confirm" onClick={() => { setAddSaleModal(true); setAddSaleItems([]); setAddSaleShowSearch(false) }}>
                  + Добавить продажу
                </button>
              </div>

              {/* Selection section */}
              <div className="admin-stats__select-section">
                <div className="admin-stats__mode-toggle">
                  {['category', 'product'].map((m) => (
                    <button
                      key={m}
                      className={`admin-stats__mode-btn ${statsMode === m ? 'admin-stats__mode-btn--active' : ''}`}
                      onClick={() => { setStatsMode(m); setStatsTarget(null); setStatsSelectedProduct(null); setStatsProductQuery(''); setStatsProductResults([]) }}
                    >
                      {m === 'category' ? 'По категории' : 'По товару'}
                    </button>
                  ))}
                </div>

                {statsMode === 'category' && (
                  <div className="admin-stats__row">
                    <select className="admin-edit-input" value={statsCategory} onChange={e => setStatsCategory(e.target.value)} style={{ minWidth: 240 }}>
                      <option value="">— Выберите категорию —</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {statsCategory && (
                      <button className="btn btn--confirm" onClick={() => setStatsTarget({ type: 'category', id: Number(statsCategory), name: categories.find(c => String(c.id) === statsCategory)?.name || '' })}>
                        Посмотреть статистику
                      </button>
                    )}
                  </div>
                )}

                {statsMode === 'product' && (
                  <div className="admin-stats__prod-search">
                    {!statsSelectedProduct && (
                      <>
                        <input
                          className="admin-edit-input"
                          placeholder="Поиск товара по ID или названию..."
                          value={statsProductQuery}
                          onChange={e => { setStatsProductQuery(e.target.value); searchStatsProducts(e.target.value) }}
                          style={{ minWidth: 280 }}
                        />
                        {statsProductSearching && <div className="admin-stats__hint">Поиск...</div>}
                        {statsProductResults.length > 0 && (
                          <div className="admin-stats__search-results">
                            {statsProductResults.map(p => (
                              <div key={p.id} className="admin-stats__search-item" onClick={() => { setStatsSelectedProduct(p); setStatsProductResults([]) }}>
                                <img src={p.image || '/dataImg/noimagebig.png'} alt="" className="admin-stats__search-img" />
                                <span>#{p.id} — {p.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    {statsSelectedProduct && (
                      <div className="admin-stats__product-card">
                        <img src={statsSelectedProduct.image || '/dataImg/noimagebig.png'} alt="" className="admin-stats__product-card-img" />
                        <div className="admin-stats__product-card-info">
                          <div className="admin-stats__product-card-id">#{statsSelectedProduct.id}</div>
                          <div className="admin-stats__product-card-name">{statsSelectedProduct.name}</div>
                          <div className="admin-stats__product-card-price">{statsSelectedProduct.price} ₽</div>
                        </div>
                        <div className="admin-stats__product-card-actions">
                          <button className="btn btn--confirm" onClick={() => setStatsTarget({ type: 'product', id: statsSelectedProduct.id, name: statsSelectedProduct.name })}>
                            Посмотреть статистику
                          </button>
                          <button className="btn btn--cancel" onClick={() => { setStatsSelectedProduct(null); setStatsProductQuery(''); setStatsTarget(null) }}>
                            Сменить товар
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Chart section */}
              {statsTarget && (
                <div className="admin-stats__chart-section">
                  <div className="admin-stats__chart-heading">
                    {statsTarget.type === 'category' ? 'Категория' : 'Товар'}: <strong>{statsTarget.name}</strong>
                  </div>

                  <div className="admin-stats__controls">
                    <div className="admin-stats__btn-group">
                      {[{ k: 'day', l: 'День' }, { k: 'week', l: 'Неделя' }, { k: 'month', l: 'Месяц' }, { k: 'quarter', l: 'Квартал' }, { k: 'year', l: 'Год' }].map(({ k, l }) => (
                        <button key={k} className={`admin-stats__period-btn ${statsGroupBy === k ? 'admin-stats__period-btn--active' : ''}`} onClick={() => setStatsGroupBy(k)}>{l}</button>
                      ))}
                    </div>

                    <div className="admin-stats__date-row">
                      <label className="admin-reviews-filters__date-group">
                        <span className="admin-reviews-filters__date-label">С</span>
                        <input type="date" className="admin-edit-input" value={statsDateFrom} onChange={e => setStatsDateFrom(e.target.value)} />
                      </label>
                      <label className="admin-reviews-filters__date-group">
                        <span className="admin-reviews-filters__date-label">По</span>
                        <input type="date" className="admin-edit-input" value={statsDateTo} onChange={e => setStatsDateTo(e.target.value)} />
                      </label>
                      {(statsDateFrom || statsDateTo) && (
                        <button className="btn btn--cancel" onClick={() => { setStatsDateFrom(''); setStatsDateTo('') }}>Сбросить даты</button>
                      )}
                    </div>

                    <div className="admin-stats__btn-group">
                      {[{ k: '', l: 'Все продажи' }, { k: 'online', l: 'Только интернет' }, { k: 'offline', l: 'Только физ. точка' }].map(({ k, l }) => (
                        <button key={k} className={`admin-stats__period-btn ${statsSource === k ? 'admin-stats__period-btn--active' : ''}`} onClick={() => setStatsSource(k)}>{l}</button>
                      ))}
                    </div>
                  </div>

                  {statsLoading ? (
                    <div className="admin-stats__state">Загрузка данных...</div>
                  ) : statsData.length === 0 ? (
                    <div className="admin-stats__state">Нет данных за выбранный период</div>
                  ) : (
                    <>
                      <div className="admin-stats__chart-wrap">
                        <ResponsiveContainer width="100%" height={440}>
                          <BarChart data={statsData} margin={{ top: 8, right: 20, left: 0, bottom: 32 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                            <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#636e72' }} angle={-30} textAnchor="end" interval={0} />
                            <YAxis tick={{ fontSize: 11, fill: '#636e72' }} allowDecimals={false} />
                            <Tooltip
                              contentStyle={{ borderRadius: 8, border: '1px solid #dee2e6', fontSize: '0.85rem' }}
                              formatter={(value, name) => [value + ' шт.', name]}
                            />
                            <Legend wrapperStyle={{ paddingTop: 12, fontSize: '0.85rem' }} />
                            {statsSource !== 'offline' && <Bar dataKey="online" name="Интернет" fill="#2e7d32" radius={[4, 4, 0, 0]} />}
                            {statsSource !== 'online' && <Bar dataKey="offline" name="Физ. точка" fill="#1565c0" radius={[4, 4, 0, 0]} />}
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="admin-stats__summary">
                        {statsSource !== 'offline' && (
                          <div className="admin-stats__summary-item admin-stats__summary-item--online">
                            Интернет: <strong>{statsData.reduce((s, d) => s + (d.online || 0), 0)}</strong> шт.
                          </div>
                        )}
                        {statsSource !== 'online' && (
                          <div className="admin-stats__summary-item admin-stats__summary-item--offline">
                            Физ. точка: <strong>{statsData.reduce((s, d) => s + (d.offline || 0), 0)}</strong> шт.
                          </div>
                        )}
                        <div className="admin-stats__summary-item">
                          Итого: <strong>{statsData.reduce((s, d) => s + (d.online || 0) + (d.offline || 0), 0)}</strong> шт.
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Add Sale Modal */}
              {addSaleModal && (
                <div className="admin-modal-overlay" onMouseDown={() => { setAddSaleModal(false); setAddSaleItems([]); setAddSaleShowSearch(false); setAddSaleProductQuery(''); setAddSaleProductResults([]) }}>
                  <div className="admin-sale-modal" onMouseDown={e => e.stopPropagation()}>
                    <div className="admin-sale-modal__header">
                      <div>
                        <h3 className="admin-sale-modal__title">Добавить продажу</h3>
                        <div className="admin-sale-modal__subtitle">Физическая точка продаж</div>
                      </div>
                      <button className="admin-staff-modal__close" onClick={() => { setAddSaleModal(false); setAddSaleItems([]); setAddSaleShowSearch(false); setAddSaleProductQuery(''); setAddSaleProductResults([]) }}><X size={20} /></button>
                    </div>

                    <div className="admin-sale-modal__body">
                      <div className="admin-sale-modal__field">
                        <label className="admin-sale-modal__label">Дата продажи</label>
                        <input type="date" value={addSaleDate} max={new Date().toISOString().split('T')[0]} onChange={e => setAddSaleDate(e.target.value)} className="admin-sale-modal__input" />
                      </div>

                      <div className="admin-sale-modal__items-section">
                        <div className="admin-sale-modal__items-head">
                          <span className="admin-sale-modal__items-title">Товары {addSaleItems.length > 0 && `(${addSaleItems.length})`}</span>
                          <button type="button" className="admin-sale-modal__add-btn" onClick={() => { setAddSaleShowSearch(s => !s); setAddSaleProductQuery(''); setAddSaleProductResults([]) }}>
                            <Plus size={14} /> Добавить товар
                          </button>
                        </div>

                        {addSaleShowSearch && (
                          <div className="admin-sale-modal__search-box">
                            <input
                              className="admin-edit-input"
                              placeholder="Поиск по ID или названию..."
                              value={addSaleProductQuery}
                              onChange={e => { setAddSaleProductQuery(e.target.value); searchSaleProducts(e.target.value) }}
                              autoFocus
                            />
                            {addSaleSearching && <div className="admin-stats__hint">Поиск...</div>}
                            {(addSaleProductResults.length > 0 || (addSaleProductQuery && !addSaleSearching)) && (
                              <div className="admin-sale-modal__search-results">
                                {addSaleProductResults.map(p => (
                                  <div key={p.id} className="admin-sale-modal__search-item" onClick={() => addSaleItem(p)}>
                                    <img src={p.image || '/dataImg/noimagebig.png'} alt="" />
                                    <div className="admin-sale-modal__search-info">
                                      <span className="admin-sale-modal__search-id">#{p.id}</span>
                                      <span className="admin-sale-modal__search-name">{p.name}</span>
                                    </div>
                                  </div>
                                ))}
                                {addSaleProductResults.length === 0 && <div className="admin-stats__hint">Ничего не найдено</div>}
                              </div>
                            )}
                          </div>
                        )}

                        {addSaleItems.length > 0 && (
                          <div className="admin-sale-modal__items-list">
                            {addSaleItems.map((item, idx) => (
                              <div key={item.product.id} className="admin-sale-modal__item">
                                <img src={item.product.image || '/dataImg/noimagebig.png'} alt="" className="admin-sale-modal__item-img" />
                                <div className="admin-sale-modal__item-info">
                                  <span className="admin-sale-modal__item-id">#{item.product.id}</span>
                                  <span className="admin-sale-modal__item-name">{item.product.name}</span>
                                </div>
                                <div className="admin-sale-modal__item-qty">
                                  <button type="button" onClick={() => setAddSaleItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it))}>−</button>
                                  <input
                                    type="number"
                                    min="1"
                                    className="admin-sale-modal__item-qty-input"
                                    value={item.quantity}
                                    onChange={e => {
                                      const v = parseInt(e.target.value, 10)
                                      setAddSaleItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: isNaN(v) || v < 1 ? 1 : v } : it))
                                    }}
                                  />
                                  <button type="button" onClick={() => setAddSaleItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: it.quantity + 1 } : it))}>+</button>
                                </div>
                                <button type="button" className="admin-sale-modal__item-remove" onClick={() => setAddSaleItems(prev => prev.filter((_, i) => i !== idx))}>
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {addSaleItems.length === 0 && !addSaleShowSearch && (
                          <div className="admin-sale-modal__empty">Добавьте хотя бы один товар</div>
                        )}
                      </div>
                    </div>

                    <div className="admin-sale-modal__footer">
                      <button className="admin-staff-modal__btn admin-staff-modal__btn--cancel" onClick={() => { setAddSaleModal(false); setAddSaleItems([]); setAddSaleShowSearch(false) }}>Отмена</button>
                      <button
                        className="admin-staff-modal__btn admin-staff-modal__btn--submit"
                        disabled={!addSaleItems.length || addSaleLoading}
                        onClick={submitAddSale}
                      >
                        {addSaleLoading ? 'Сохранение...' : 'Сохранить продажу'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </section>
      </div>
      <ConfirmModal
        open={orderCancelModal.open}
        title={`Отменить заказ #${orderCancelModal.id}?`}
        message="Статус заказа изменится на «Отменено». Покупатель получит уведомление при следующем входе."
        variant="warning"
        confirmLabel="Отменить заказ"
        onCancel={() => setOrderCancelModal({ open: false, id: null })}
        onConfirm={async () => {
          const id = orderCancelModal.id; if (!id) return
          try { const res = await requestsService.updateOrder(id, { status: 'отменено' }); if (res?.success && res.order) setOrdersPageData(prev => ({ ...prev, data: prev.data.map(b => b.id === id ? res.order : b) })); else setOrdersPageData(prev => ({ ...prev, data: prev.data.map(b => b.id === id ? ({ ...b, status: 'отменено' }) : b) })) }
          catch { setOrdersPageData(prev => ({ ...prev, data: prev.data.map(b => b.id === id ? ({ ...b, status: 'отменено' }) : b) })) }
          setOrderCancelModal({ open: false, id: null }); setToast({ show: true, message: `Заказ ${id} отменён` }); setTimeout(() => setToast({ show: false, message: '' }), 3000)
        }}
      />
      {toast.show && <div className="admin-toast">{toast.message}</div>}
    </div>
  )
}

export default AdminPanel
