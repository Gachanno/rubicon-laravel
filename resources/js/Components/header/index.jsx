import React, { useState, useEffect } from 'react'
import { Link, usePage, router } from '@inertiajs/react'
import './style.scss'
import Logo from './img/logo.svg?react'
import UserIcon from './img/user.svg?react'

const Header = () => {
  const { auth } = usePage().props
  const user = auth?.user
  const isAuthenticated = !!user
  const isAdmin = user?.role === 'Администратор'
  const isManager = user?.role === 'Менеджер'
  const currentPath = window.location.pathname
  const [menuOpen, setMenuOpen] = useState(false)

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  const handleLogoClick = (e) => {
    e.preventDefault()
    closeMenu()
    if (currentPath !== '/') {
      router.visit('/')
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleAboutClick = (e) => {
    e.preventDefault()
    closeMenu()
    if (currentPath !== '/') {
      router.visit('/', {
        onSuccess: () => {
          setTimeout(() => {
            document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
          }, 100)
        }
      })
    } else {
      document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      <header className="header">
        <div className="header__container">
          <div className="header__logo" onClick={handleLogoClick}>
            <Logo />
          </div>

          <nav className={`header__nav${menuOpen ? ' header__nav--open' : ''}`}>
            <ul className="header__nav-list">
              <li>
                <Link href="/" className={`header__nav-link${currentPath === '/' ? ' active' : ''}`} onClick={closeMenu}>Главная</Link>
              </li>
              <li>
                <Link href="/catalog" className={`header__nav-link${currentPath.startsWith('/catalog') ? ' active' : ''}`} onClick={closeMenu}>Каталог</Link>
              </li>
              <li>
                <Link href="/search" className={`header__nav-link${currentPath === '/search' ? ' active' : ''}`} onClick={closeMenu}>Поиск</Link>
              </li>
              <li>
                <a href="#about" className="header__nav-link" onClick={handleAboutClick}>О нас</a>
              </li>
              <li>
                <Link href="/contacts" className={`header__nav-link${currentPath === '/contacts' ? ' active' : ''}`} onClick={closeMenu}>Контакты</Link>
              </li>
            </ul>
          </nav>

          <div className="header__right">
            <div className="header__actions">
              {isAuthenticated ? (
                <>
                  {!isAdmin && !isManager && (
                    <Link href="/cart" className="header__button header__button--primary">Корзина</Link>
                  )}
                  {(isAdmin || isManager) && (
                    <Link href="/admin" className="header__button header__button--secondary">Админ-панель</Link>
                  )}
                  <Link href="/profile" className="header__user-link" onClick={closeMenu}>
                    <div className="header__user-circle">
                      <UserIcon />
                    </div>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="header__button header__button--primary">Корзина</Link>
                  <Link href="/login" className="header__button header__button--outline">Войти</Link>
                </>
              )}
            </div>

            <button
              className={`header__burger${menuOpen ? ' header__burger--open' : ''}`}
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
              aria-expanded={menuOpen}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>
      {menuOpen && <div className="header__overlay" onClick={closeMenu} aria-hidden="true" />}
    </>
  )
}

export default Header
