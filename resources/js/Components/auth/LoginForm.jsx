import React, { useState } from 'react'
import { requestsService } from '../../api/api'
import { router } from '@inertiajs/react'
import { EyeOpenIcon, EyeClosedIcon } from './PasswordToggleIcon'

const LoginForm = () => {
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: ''
  })

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const newErrors = {}

    if (!formData.emailOrPhone.trim()) {
      newErrors.emailOrPhone = 'Введите email или телефон'
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Введите пароль'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    try {
      const result = await requestsService.login(formData.emailOrPhone, formData.password)
      if (result.success) {
        router.visit('/')
      } else {
        setErrors({ submit: result.error || 'Неверные учетные данные' })
      }
    } catch (err) {
      console.error('Login error', err)
      setErrors({ submit: 'Ошибка при входе. Попробуйте позже.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-form__group">
        <label className="auth-form__label" htmlFor="login-emailOrPhone">Электронная почта/телефон</label>
        <input
            id="login-emailOrPhone"
            type="text"
            name="emailOrPhone"
            className={`auth-form__input ${errors.emailOrPhone ? 'auth-form__input--error' : ''}`}
            placeholder="example@gmail.com / +7 (615) 733 69 15"
            value={formData.emailOrPhone}
            autoComplete='emailOrPhone'
            onChange={handleChange}
        />
        {errors.emailOrPhone && <span className="auth-form__error">{errors.emailOrPhone}</span>}
      </div>

      <div className="auth-form__group">
        <label className="auth-form__label" htmlFor="login-password">Пароль</label>
        <div className="auth-form__password-wrapper">
          <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              className={`auth-form__input ${errors.password ? 'auth-form__input--error' : ''}`}
              placeholder="Пароль"
              autoComplete='current-password'
              value={formData.password}
              onChange={handleChange}
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
        {errors.password && <span className="auth-form__error">{errors.password}</span>}
      </div>

      {errors.submit && <div className="auth-form__error">{errors.submit}</div>}

      <button type="submit" className="auth-form__button" disabled={isLoading}>
        {isLoading ? 'Загрузка...' : 'Войти'}
      </button>
    </form>
  )
}

export default LoginForm
