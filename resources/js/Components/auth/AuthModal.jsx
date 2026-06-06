import React, { useState } from 'react'
import './style.scss'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import Logo from './img/logo.svg?react'
import { Link } from '@inertiajs/react'

const AuthModal = () => {
  const [activeTab, setActiveTab] = useState('login')

  return (
    <div className="auth-modal">
      <div className="auth-modal__content">
        <div className="auth-modal__header">
          <div className="auth-modal__logo">
            <Logo/>
          </div>
        </div>

        <div className="auth-modal__tabs">
          <button
            className={`auth-modal__tab ${activeTab === 'login' ? 'auth-modal__tab--active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Вход
          </button>
          <button
            className={`auth-modal__tab ${activeTab === 'register' ? 'auth-modal__tab--active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            Регистрация
          </button>
        </div>

        <div className="auth-modal__form-wrapper">
          {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
        </div>

        <div className="auth-modal__footer">
          <span className="auth-modal__footer-text">
            {activeTab === 'login' ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
          </span>
          <button
            className="auth-modal__footer-link"
            onClick={() => setActiveTab(activeTab === 'login' ? 'register' : 'login')}
          >
            {activeTab === 'login' ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </div>
        <div className="auth-modal__back">
          <Link href="/" className="auth-modal__back-link">← Назад на главную страницу</Link>
        </div>
      </div>
    </div>
  )
}

export default AuthModal
