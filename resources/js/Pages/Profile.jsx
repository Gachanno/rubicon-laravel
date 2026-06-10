import React, { useEffect, useState, useMemo } from 'react'
import './profile.scss'
import { usePage, Link, router } from '@inertiajs/react'
import { requestsService } from '../api/api'
import { useSelector } from 'react-redux'
import { useAppDispatch } from '../store/hooks'
import { setPage, setSort, setTotal, setSortExplicit, setLimit } from '../store/ordersSlice'
import { EyeOpenIcon, EyeClosedIcon } from '../Components/auth/PasswordToggleIcon'
import { IMaskInput } from 'react-imask'
import { AlertTriangle } from 'lucide-react'
import ModalConfirm from '../Components/ModalConfirm'
import axios from 'axios'

const carrierLabel = (carrier) =>
  carrier === 'pochta' ? 'Почта России' : carrier === 'sdek' ? 'СДЭК' : ''

const deliveryLabel = (method, carrier) => {
  if (method === 'pickup') return 'Самовывоз'
  if (method === 'delivery') {
    const c = carrierLabel(carrier)
    return c ? `Доставка · ${c}` : 'Доставка'
  }
  return '—'
}

const Profile = () => {
  const { auth } = usePage().props
  const userId = auth?.user?.id
  const userRole = auth?.user?.role
  const dispatch = useAppDispatch()

  const [logoutModalOpen, setLogoutModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(userRole === 'Администратор' || userRole === 'Менеджер' ? 'info' : 'orders')

  const handleLogout = async () => {
    try {
      await axios.post('/logout')
      window.location.href = '/'
    } catch {
      window.location.href = '/'
    }
  }

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [user, setUserData] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [editing, setEditing] = useState(false)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const ordersState = useSelector(s => s.ordersTable)
  const [ordersPageData, setOrdersPageData] = useState({ data: [], total: 0 })
  const [statusFilter, setStatusFilter] = useState('')
  const [deliveryFilter, setDeliveryFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    let mounted = true
    const fetchOrders = async () => {
      if (activeTab !== 'orders') return
      try {
        const params = {
          page: ordersState.page,
          limit: ordersState.limit,
          sortBy: ordersState.sortBy,
          sortDir: ordersState.sortDir,
          userId: userId,
          status: statusFilter,
          deliveryMethod: deliveryFilter,
          dateFrom: dateFrom,
          dateTo: dateTo,
        }
        const resp = await requestsService.getOrders(params)
        if (!mounted) return
        setOrdersPageData({ data: resp.data || [], total: resp.total || 0 })
        dispatch(setTotal(resp.total || 0))
      } catch {}
    }
    fetchOrders()
    return () => { mounted = false }
  }, [activeTab, ordersState.page, ordersState.limit, ordersState.sortBy, ordersState.sortDir, userId, statusFilter, deliveryFilter, dateFrom, dateTo, dispatch])

  const handleSortClick = (col) => {
    dispatch(setSort(col))
    dispatch(setPage(1))
  }

  const handleSortDoubleClick = () => {
    dispatch(setSortExplicit({ col: 'id', dir: 'asc' }))
    dispatch(setPage(1))
  }

  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [modalOrderId, setModalOrderId] = useState(null)
  const [modalOrderIndex, setModalOrderIndex] = useState(null)

  const openCancelModal = (orderId, orderIndex) => {
    setModalOrderId(orderId)
    setModalOrderIndex(orderIndex)
    setCancelModalOpen(true)
  }

  const closeCancelModal = () => {
    setCancelModalOpen(false)
    setModalOrderId(null)
  }

  const confirmCancel = async () => {
    if (!modalOrderId) return
    const res = await requestsService.updateOrder(modalOrderId, { status: 'отменено' })
    if (res.success) {
      const params = {
        page: ordersState.page,
        limit: ordersState.limit,
        sortBy: ordersState.sortBy,
        sortDir: ordersState.sortDir,
        userId: userId,
        status: statusFilter,
        deliveryMethod: deliveryFilter,
        dateFrom: dateFrom,
        dateTo: dateTo,
      }
      const resp = await requestsService.getOrders(params)
      setOrdersPageData({ data: resp.data || [], total: resp.total || 0 })
      dispatch(setTotal(resp.total || 0))
    }
    closeCancelModal()
  }

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    requestsService.getUserById(userId)
      .then(data => {
        setUserData(data)
        setForm({
          firstName: data.first_name || data.firstName || '',
          lastName: data.last_name || data.lastName || '',
          middleName: data.middle_name || data.middleName || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          password: ''
        })
      })
      .catch(() => setError('Ошибка при загрузке данных'))
      .finally(() => setLoading(false))
  }, [userId])

  const original = useMemo(() => ({
    firstName: user?.first_name || user?.firstName || '',
    lastName: user?.last_name || user?.lastName || '',
    middleName: user?.middle_name || user?.middleName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  }), [user])

  const isDirty = useMemo(() => {
    const baseChanged = JSON.stringify(original) !== JSON.stringify({
      firstName: form.firstName || '',
      lastName: form.lastName || '',
      middleName: form.middleName || '',
      email: form.email || '',
      phone: form.phone || '',
      address: form.address || ''
    })
    const passwordProvided = !!(form.password && form.password.length > 0)
    return baseChanged || passwordProvided
  }, [original, form])

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const validatePhone = (phone) => /^[\d\s()+-]+$/.test(phone) && phone.replace(/\D/g, '').length >= 10

  const getPasswordError = (password) => {
    if (!password) return ''
    if (password.length < 8) return 'Пароль должен быть минимум 8 символов'
    if (!/[A-Z]/.test(password)) return 'Пароль должен содержать хотя бы 1 заглавную букву'
    if (!/\d/.test(password)) return 'Пароль должен содержать хотя бы 1 цифру'
    return ''
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setSuccess('')
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSave = async () => {
    const newErrors = {}
    if (!form.firstName.trim()) newErrors.firstName = 'Введите имя'
    else if (form.firstName.trim().length < 2) newErrors.firstName = 'Имя должно быть минимум 2 символа'
    if (!form.lastName.trim()) newErrors.lastName = 'Введите фамилию'
    else if (form.lastName.trim().length < 2) newErrors.lastName = 'Фамилия должна быть минимум 2 символа'
    // Сотрудники (Менеджер/Администратор) входят по логину — формат email не проверяем.
    // У обычных покупателей проверка формата почты остаётся.
    const isStaff = userRole === 'Менеджер' || userRole === 'Администратор'
    if (!form.email.trim()) newErrors.email = isStaff ? 'Введите почту или логин' : 'Введите email'
    else if (!isStaff && !validateEmail(form.email)) newErrors.email = 'Некорректный формат email'
    if (!form.phone.trim()) newErrors.phone = 'Введите телефон'
    else if (!validatePhone(form.phone)) newErrors.phone = 'Некорректный номер телефона'
    const passwordError = getPasswordError(form.password)
    if (passwordError) newErrors.password = passwordError
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    if (!isDirty) { setEditing(false); return }

    setSaving(true)
    setError(null)
    try {
      const updates = {}
      if (form.firstName !== original.firstName) updates.firstName = form.firstName
      if (form.lastName !== original.lastName) updates.lastName = form.lastName
      if ((form.middleName || '') !== original.middleName) updates.middleName = form.middleName || null
      if (form.email !== original.email) updates.email = form.email
      if (form.phone !== original.phone) updates.phone = form.phone
      if ((form.address || '') !== original.address) updates.address = form.address || null
      if (form.password && form.password.length > 0) updates.password = form.password

      const result = await requestsService.updateUser(userId, updates)
      if (result.success) {
        const u = result.user
        setUserData(u)
        setSuccess('Изменения сохранены')
        setEditing(false)
        setForm({
          firstName: u.first_name || u.firstName || '',
          lastName: u.last_name || u.lastName || '',
          middleName: u.middle_name || u.middleName || '',
          email: u.email || '',
          phone: u.phone || '',
          address: u.address || '',
          password: ''
        })
        setErrors({})
      } else {
        setError('Ошибка при сохранении')
      }
    } catch {
      setError('Ошибка при сохранении')
    } finally {
      setSaving(false)
    }
  }

  if (!userId) {
    return <div className="profile">Пожалуйста, войдите в аккаунт</div>
  }

  const displayFirstName = user?.first_name || user?.firstName || ''
  const displayLastName = user?.last_name || user?.lastName || ''
  const displayMiddleName = user?.middle_name || user?.middleName || ''
  const displayAddress = user?.address || ''

  return (
    <div className="profile">
      <div className="profile__container">
        <aside className="profile__aside">
          <button className={`profile__tab ${activeTab === 'info' ? 'profile__tab--active' : ''}`} onClick={() => setActiveTab('info')}>Информация</button>
          {userRole !== 'Администратор' && userRole !== 'Менеджер' && (
            <button className={`profile__tab ${activeTab === 'orders' ? 'profile__tab--active' : ''}`} onClick={() => setActiveTab('orders')}>Заказы</button>
          )}
          <button className={`profile__tab ${activeTab === 'logout' ? 'profile__tab--active' : ''}`} onClick={() => setLogoutModalOpen(true)}>Выйти</button>
        </aside>

        <section className="profile__content">
          {loading && <div>Загрузка...</div>}
          {error && <div className="profile__error">{error}</div>}

          {!loading && user && activeTab === 'info' && (
            <div className="profile__info">
              <h2>Личная информация</h2>
              {user.role !== 'Пользователь' && (
                <div className="profile__row">
                  <label>Роль:</label>
                  <div className="profile__value">{user.role}</div>
                </div>
              )}

              {!editing ? (
                <div className="profile__view">
                  <div className="profile__row"><label>Фамилия:</label><div className="profile__value">{displayLastName}</div></div>
                  <div className="profile__row"><label>Имя:</label><div className="profile__value">{displayFirstName}</div></div>
                  <div className="profile__row"><label>Отчество:</label><div className="profile__value">{displayMiddleName || '—'}</div></div>
                  <div className="profile__row"><label>{(userRole === 'Менеджер' || userRole === 'Администратор') ? 'Почта/Логин:' : 'Почта:'}</label><div className="profile__value">{user.email}</div></div>
                  <div className="profile__row"><label>Пароль:</label><div className="profile__value">*******</div></div>
                  <div className="profile__row"><label>Телефон:</label><div className="profile__value">{user.phone}</div></div>
                  <div className="profile__row"><label>Адрес доставки:</label><div className="profile__value">{displayAddress || '—'}</div></div>
                  <div className="profile__actions">
                    <button className="profile__save" onClick={() => { setEditing(true); setForm({ firstName: displayFirstName, lastName: displayLastName, middleName: displayMiddleName, email: user.email || '', phone: user.phone || '', address: displayAddress, password: '' }); setErrors({}); }}>Изменить данные</button>
                  </div>
                </div>
              ) : (
                <div className="profile__form">
                  <div className="profile__form-group">
                    <label htmlFor="profile-lastName">Фамилия</label>
                    <input id="profile-lastName" name="lastName" autoComplete="off" value={form.lastName} onChange={handleChange} className={errors.lastName ? 'profile__input--error' : ''} />
                    {errors.lastName && <span className="profile__error-text">{errors.lastName}</span>}
                  </div>
                  <div className="profile__form-group">
                    <label htmlFor="profile-firstName">Имя</label>
                    <input id="profile-firstName" name="firstName" autoComplete="off" value={form.firstName} onChange={handleChange} className={errors.firstName ? 'profile__input--error' : ''} />
                    {errors.firstName && <span className="profile__error-text">{errors.firstName}</span>}
                  </div>
                  <div className="profile__form-group">
                    <label htmlFor="profile-middleName">Отчество <span className="profile__optional">(необязательно)</span></label>
                    <input id="profile-middleName" name="middleName" autoComplete="off" value={form.middleName || ''} onChange={handleChange} />
                  </div>
                  <div className="profile__form-group">
                    <label htmlFor="profile-email">{(userRole === 'Менеджер' || userRole === 'Администратор') ? 'Почта/Логин' : 'Почта'}</label>
                    <input id="profile-email" name="email" autoComplete="off" value={form.email} onChange={handleChange} className={errors.email ? 'profile__input--error' : ''} />
                    {errors.email && <span className="profile__error-text">{errors.email}</span>}
                  </div>
                  <div className="profile__form-group">
                    <div className="profile__password-group">
                      <label htmlFor="profile-password">Пароль</label>
                      <div className="profile__password-wrapper">
                        <input id="profile-password" name="password" autoComplete="off" type={showPassword ? 'text' : 'password'} placeholder="Оставьте пустым чтобы сохранить текущий пароль" value={form.password} onChange={handleChange} className={errors.password ? 'profile__input--error' : ''} />
                        <button type="button" className="profile__password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                          {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                        </button>
                      </div>
                      <span className="profile__password-hint">Оставьте пустым, чтобы сохранить текущий пароль</span>
                    </div>
                    {errors.password && <span className="profile__error-text">{errors.password}</span>}
                  </div>
                  <div className="profile__form-group">
                    <label htmlFor="profile-phone">Телефон</label>
                    <IMaskInput id="profile-phone" name="phone" autoComplete="off" mask={'+{7} (000) 000 00 00'} value={form.phone} onAccept={(value) => handleChange({ target: { name: 'phone', value } })} className={errors.phone ? 'profile__input--error' : ''} />
                    {errors.phone && <span className="profile__error-text">{errors.phone}</span>}
                  </div>
                  <div className="profile__form-group">
                    <label htmlFor="profile-address">Адрес доставки <span className="profile__optional">(необязательно)</span></label>
                    <input id="profile-address" name="address" autoComplete="off" placeholder="Город, улица, дом, квартира" value={form.address || ''} onChange={handleChange} />
                  </div>
                  <div className="profile__actions">
                    <button className="profile__save" onClick={handleSave} disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить изменения'}</button>
                    <button className="profile__cancel" onClick={() => { setEditing(false); setForm({ firstName: displayFirstName, lastName: displayLastName, middleName: displayMiddleName, email: user.email || '', phone: user.phone || '', address: displayAddress, password: '' }); setError(''); setSuccess(''); setErrors({}); setShowPassword(false); }}>Отмена</button>
                  </div>
                  {success && <div className="profile__success">{success}</div>}
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === 'orders' && (
            <div className="profile__bookings">
              <h2>Мои заказы</h2>
              <div className="profile__date-filter">
                <label>С:
                  <input
                    type="date"
                    value={dateFrom}
                    max={dateTo || undefined}
                    onChange={e => { setDateFrom(e.target.value); dispatch(setPage(1)); }}
                  />
                </label>
                <label>По:
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={e => { setDateTo(e.target.value); dispatch(setPage(1)); }}
                  />
                </label>
                {(dateFrom || dateTo) && (
                  <button
                    className="profile__date-reset"
                    onClick={() => { setDateFrom(''); setDateTo(''); dispatch(setPage(1)); }}
                  >✕ Сбросить</button>
                )}
              </div>
              <div className="profile__table-wrap">
                <table className="profile__table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSortClick('id')} onDoubleClick={handleSortDoubleClick}># {ordersState.sortBy === 'id' ? (ordersState.sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                      <th onClick={() => handleSortClick('itemsCount')} onDoubleClick={handleSortDoubleClick}>Товары {ordersState.sortBy === 'itemsCount' ? (ordersState.sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                      <th onClick={() => handleSortClick('createdAt')} onDoubleClick={handleSortDoubleClick}>Создано {ordersState.sortBy === 'createdAt' ? (ordersState.sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                      <th className="profile__th--no-sort">
                        <select
                          className="profile__status-filter"
                          value={statusFilter}
                          onChange={e => { setStatusFilter(e.target.value); dispatch(setPage(1)); }}
                        >
                          <option value="">Все статусы</option>
                          <option value="в ожидании">В ожидании</option>
                          <option value="подтверждено">Подтверждено</option>
                          <option value="отменено">Отменено</option>
                          <option value="выдано">Выдано</option>
                        </select>
                      </th>
                      <th className="profile__th--no-sort">
                        <select
                          className="profile__status-filter"
                          value={deliveryFilter}
                          onChange={e => { setDeliveryFilter(e.target.value); dispatch(setPage(1)); }}
                        >
                          <option value="">Все способы</option>
                          <option value="pickup">Самовывоз</option>
                          <option value="delivery">Доставка</option>
                        </select>
                      </th>
                      <th onClick={() => handleSortClick('total')} onDoubleClick={handleSortDoubleClick}>Стоимость {ordersState.sortBy === 'total' ? (ordersState.sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersPageData.data.map((b) => (
                      <tr key={b.id}>
                        <td>{b.id}</td>
                        <td>
                          <ul className="profile__items-list">
                            {b.items && b.items.length > 0 ? b.items.map(it => (
                              <li key={it.id}><Link href={`/products/${it.productId || it.product_id}`}>{it.productName || it.product_name || `Товар #${it.productId || it.product_id}`} x{it.quantity}</Link></li>
                            )) : <span className="profile__no-items">—</span>}
                          </ul>
                        </td>
                        <td>{b.createdAt || b.created_at ? new Date(b.createdAt || b.created_at).toLocaleDateString('ru-RU') : '-'}</td>
                        <td>{b.status}</td>
                        <td>{deliveryLabel(b.deliveryMethod, b.deliveryCarrier)}</td>
                        <td>{(b.total || 0).toLocaleString('ru-RU')} ₽</td>
                        <td>
                          {b.status !== 'отменено' && b.status !== 'выдано' && (
                            <button className="profile__cancel-btn" onClick={() => openCancelModal(b.id, b.id)}>Отменить</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="profile__pagination">
                <label htmlFor="orders-limit">Показывать по:</label>
                <select className="profile__pagination-limit" id="orders-limit" value={ordersState.limit} onChange={e => { dispatch(setPage(1)); dispatch(setLimit(Number(e.target.value))); }}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
                <button className="profile__pagination-btn" onClick={() => dispatch(setPage(Math.max(1, ordersState.page - 1)))} disabled={ordersState.page <= 1}>Назад</button>
                <span>
                  Страница
                  <input className="profile__pagination-input" type="number" min={1} max={Math.max(1, Math.ceil((ordersState.total || ordersPageData.total) / ordersState.limit))} value={ordersState.page} onChange={e => { let val = Number(e.target.value); if (!val || val < 1) val = 1; if (val > Math.ceil((ordersState.total || ordersPageData.total) / ordersState.limit)) val = Math.ceil((ordersState.total || ordersPageData.total) / ordersState.limit); dispatch(setPage(val)); }} />
                  из {Math.max(1, Math.ceil((ordersState.total || ordersPageData.total) / ordersState.limit))}
                </span>
                <button className="profile__pagination-btn" onClick={() => dispatch(setPage(ordersState.page + 1))} disabled={ordersState.page >= Math.ceil((ordersState.total || ordersPageData.total) / ordersState.limit)}>Вперёд</button>
              </div>
            </div>
          )}

          <ModalConfirm
            open={cancelModalOpen}
            variant="danger"
            title={`Отменить заказ #${modalOrderIndex}?`}
            body="Заказ будет отменён, товары вернутся на склад. Это действие нельзя отменить."
            confirmLabel="Отменить заказ"
            onCancel={closeCancelModal}
            onConfirm={confirmCancel}
          />

          <ModalConfirm
            open={logoutModalOpen}
            variant="danger"
            icon={AlertTriangle}
            title="Выйти из аккаунта?"
            body="Вы выйдете из аккаунта и вернётесь на главную страницу."
            confirmLabel="Выйти"
            onCancel={() => setLogoutModalOpen(false)}
            onConfirm={handleLogout}
          />
        </section>
      </div>
    </div>
  )
}

export default Profile
