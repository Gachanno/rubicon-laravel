import React, { useEffect, useState } from 'react'
import './style.scss'
import { Link, router } from '@inertiajs/react'
import { requestsService } from '../../api/api'

const Footer = () => {
  const handleAboutClick = (e) => {
    e.preventDefault()
    const currentPath = window.location.pathname
    if (currentPath !== '/') {
      router.visit('/', {
        onSuccess: () => {
          setTimeout(() => {
            const aboutSection = document.getElementById('about')
            if (aboutSection) aboutSection.scrollIntoView({ behavior: 'smooth' })
          }, 100)
        }
      })
    } else {
      const aboutSection = document.getElementById('about')
      if (aboutSection) aboutSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer className="footer">
      <div className="footer__content">
        <div className="footer__column">
          <h3 className="footer__title">О компании</h3>
          <p className="footer__text">
            Рубикон - ведущий поставщик товаров для сада и бытовой химии в России. Мы работаем с 2006 года и заслужили доверие тысяч клиентов.
          </p>
        </div>

        <div className="footer__column">
          <h3 className="footer__title">Категории</h3>
          <ul className="footer__list">
            <FooterCategories />
          </ul>
        </div>

        <div className="footer__column">
          <h3 className="footer__title">Полезные ссылки</h3>
          <ul className="footer__list">
            <li><a href="#about" className="footer__link" onClick={handleAboutClick}>О нас</a></li>
            <li><a href="#" className="footer__link">Акции</a></li>
            <li><Link href="/contacts" className="footer__link">Контакты</Link></li>
          </ul>
        </div>

        <div className="footer__column">
          <h3 className="footer__title">Контакты</h3>
          <p className="footer__text">
            141305, Московская область, г Сергиев Посад, Центральная ул, д. 1
          </p>
          <p className="footer__text">+7 (733) 315-33-69</p>
          <p className="footer__text">info@rubikonik.com</p>
          <p className="footer__text">Пн-Пт: 9:00 - 21:00,<br/>Сб-Вс: 9:00 - 18:00</p>
        </div>
      </div>

      <div className="footer__bottom">
        <p className="footer__copyright">
          © 2006–2026 Компания ООО «Рубикон СП». Администрация Сайта не несёт ответственности за размещаемые Пользователями материалы (в т.ч. информацию и изображения), их содержание и качество.
        </p>
      </div>
    </footer>
  )
}

export default Footer

function FooterCategories() {
  const [cats, setCats] = useState([])
  useEffect(() => {
    let mounted = true
    requestsService.getCategories().then(res => { if (mounted) setCats(res || []) }).catch(() => { if (mounted) setCats([]) })
    return () => { mounted = false }
  }, [])

  const top = cats.filter(c => c.parentId === null || c.parent_id === null)
  return (
    <>
      {top.map(c => (
        <li key={c.id}><Link href={`/catalog/${c.id}`} className="footer__link">{c.name}</Link></li>
      ))}
    </>
  )
}
