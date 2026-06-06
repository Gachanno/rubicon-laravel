import React, { useState } from 'react'
import { IMaskInput } from 'react-imask'
import { requestsService } from '../../api/api'
import { router } from '@inertiajs/react'
import { EyeOpenIcon, EyeClosedIcon } from './PasswordToggleIcon'

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone) => {
    const phoneRegex = /^[\d\s()+-]+$/
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
  }

  const getPasswordError = (password) => {
    if (!password) return 'Придумайте пароль'
    if (password.length < 8) return 'Пароль должен быть минимум 8 символов'
    if (!/[A-Z]/.test(password)) return 'Пароль должен содержать хотя бы 1 заглавную букву'
    if (!/\d/.test(password)) return 'Пароль должен содержать хотя бы 1 цифру'
    return ''
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
    if (successMessage) {
      setSuccessMessage('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const newErrors = {}

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Введите фамилию'
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Фамилия должна быть минимум 2 символа'
    }
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Введите имя'
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'Имя должно быть минимум 2 символа'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Введите email'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Некорректный формат email'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Введите телефон'
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Некорректный номер телефона'
    }

    const passwordError = getPasswordError(formData.password)
    if (passwordError) {
      newErrors.password = passwordError
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Подтвердите пароль'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)

    try {
      const result = await requestsService.register(
        formData.firstName,
        formData.lastName,
        formData.middleName || null,
        formData.email,
        formData.phone,
        formData.password
      )

      if (result.success) {
        router.visit('/')
      } else {
        setErrors(result.errors || {})
      }
    } catch (error) {
      console.error('Registration error:', error)
      setErrors({ submit: 'Ошибка при регистрации. Попробуйте позже.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {successMessage && (
        <div className="auth-form__success">{successMessage}</div>
      )}

      <div className="auth-form__group">
        <label className="auth-form__label" htmlFor="register-lastName">Фамилия</label>
        <input
          id="register-lastName"
          type="text"
          name="lastName"
          autoComplete='family-name'
          className={`auth-form__input ${errors.lastName ? 'auth-form__input--error' : ''}`}
          placeholder="Введите фамилию"
          value={formData.lastName}
          onChange={handleChange}
          disabled={isLoading}
        />
        {errors.lastName && <span className="auth-form__error">{errors.lastName}</span>}
      </div>
      <div className="auth-form__group">
        <label className="auth-form__label" htmlFor="register-firstName">Имя</label>
        <input
          id="register-firstName"
          type="text"
          name="firstName"
          autoComplete='given-name'
          className={`auth-form__input ${errors.firstName ? 'auth-form__input--error' : ''}`}
          placeholder="Введите имя"
          value={formData.firstName}
          onChange={handleChange}
          disabled={isLoading}
        />
        {errors.firstName && <span className="auth-form__error">{errors.firstName}</span>}
      </div>
      <div className="auth-form__group">
        <label className="auth-form__label" htmlFor="register-middleName">
          Отчество <span className="auth-form__optional">(необязательно)</span>
        </label>
        <input
          id="register-middleName"
          type="text"
          name="middleName"
          autoComplete='additional-name'
          className="auth-form__input"
          placeholder="Введите отчество"
          value={formData.middleName}
          onChange={handleChange}
          disabled={isLoading}
        />
      </div>

      <div className="auth-form__group">
        <label className="auth-form__label" htmlFor="register-email">Электронная почта</label>
        <input
          id="register-email"
          type="text"
          name="email"
          autoComplete='email'
          className={`auth-form__input ${errors.email ? 'auth-form__input--error' : ''}`}
          placeholder="example@gmail.com"
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
        />
        {errors.email
          ? <span className="auth-form__error">{errors.email}</span>
          : <span className="auth-form__hint">Например: example@mail.ru</span>
        }
      </div>

      <div className="auth-form__group">
        <label className="auth-form__label" htmlFor="register-phone">Телефон</label>
          <IMaskInput
            id="register-phone"
            mask={'+{7} (000) 000 00 00'}
            unmask={false}
            type="tel"
            name="phone"
            autoComplete='phone'
            className={`auth-form__input ${errors.phone ? 'auth-form__input--error' : ''}`}
            placeholder="+7 (___) ___ __ __"
            value={formData.phone}
            onAccept={(value) => handleChange({ target: { name: 'phone', value } })}
            disabled={isLoading}
          />
        {errors.phone && <span className="auth-form__error">{errors.phone}</span>}
      </div>

      <div className="auth-form__group">
        <label className="auth-form__label" htmlFor="register-password">Пароль</label>
        <div className="auth-form__password-wrapper">
          <input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            className={`auth-form__input ${errors.password ? 'auth-form__input--error' : ''}`}
            placeholder="Придумайте пароль"
            value={formData.password}
            autoComplete='new-password'
            onChange={handleChange}
            disabled={isLoading}
          />
          <button
            type="button"
            className="auth-form__password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
          </button>
        </div>
        {(formData.password.length > 0 || errors.password) && (
          <ul className="auth-form__rules">
            {[
              { label: 'Минимум 8 символов', ok: formData.password.length >= 8 },
              { label: 'Хотя бы одна заглавная буква (A–Z)', ok: /[A-Z]/.test(formData.password) },
              { label: 'Хотя бы одна цифра', ok: /\d/.test(formData.password) },
            ].map(rule => (
              <li
                key={rule.label}
                className={`auth-form__rule ${rule.ok ? 'auth-form__rule--ok' : errors.password ? 'auth-form__rule--fail' : ''}`}
              >
                {rule.ok ? '✓' : '✗'} {rule.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="auth-form__group">
        <label className="auth-form__label" htmlFor="register-confirmPassword">Подтвердите пароль</label>
        <div className="auth-form__password-wrapper">
          <input
            id="register-confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            className={`auth-form__input ${errors.confirmPassword ? 'auth-form__input--error' : ''}`}
            placeholder="Повторите пароль"
            autoComplete='new-password'
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={isLoading}
          />
          <button
            type="button"
            className="auth-form__password-toggle"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
          </button>
        </div>
        {errors.confirmPassword && <span className="auth-form__error">{errors.confirmPassword}</span>}
      </div>

      {errors.submit && <span className="auth-form__error">{errors.submit}</span>}

      <button type="submit" className="auth-form__button" disabled={isLoading}>
        {isLoading ? 'Загрузка...' : 'Зарегистрироваться'}
      </button>
    </form>
  )
}

export default RegisterForm
