import React, { useEffect, useRef, useState } from 'react'
import { usePage } from '@inertiajs/react'
import Header from '../Components/header'
import Footer from '../Components/footer'
import { useAppDispatch } from '../store/hooks'
import { fetchCart } from '../store/cartSlice'
import { requestsService } from '../api/api'
import './layout.scss'

const POLL_INTERVAL = 15000
const TOAST_TTL = 20000

const Layout = ({ children }) => {
  const dispatch = useAppDispatch()
  const { auth } = usePage().props
  const [toasts, setToasts] = useState([])
  const timersRef = useRef({})

  useEffect(() => {
    if (auth?.user) {
      dispatch(fetchCart())
    }
  }, [auth?.user?.id])

  const dismissToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id])
      delete timersRef.current[id]
    }
  }

  const pushToasts = (items) => {
    if (!items.length) return
    setToasts(prev => [...prev, ...items])
    items.forEach(item => {
      timersRef.current[item.id] = setTimeout(() => dismissToast(item.id), TOAST_TTL)
    })
  }

  // Poll for order status-change notifications while logged in
  useEffect(() => {
    if (!auth?.user) return

    let active = true
    const poll = async () => {
      const list = await requestsService.getNotifications()
      if (active && list.length) pushToasts(list)
    }

    poll()
    const interval = setInterval(poll, POLL_INTERVAL)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [auth?.user?.id])

  // Clear pending timers on unmount
  useEffect(() => () => {
    Object.values(timersRef.current).forEach(clearTimeout)
  }, [])

  return (
    <div className="layout">
      <Header />
      <main className="layout__main">
        {children}
      </main>
      <Footer />

      {toasts.length > 0 && (
        <div className="notify-toasts">
          {toasts.map(t => (
            <button
              key={t.id}
              type="button"
              className="notify-toast"
              onClick={() => dismissToast(t.id)}
              title="Нажмите, чтобы закрыть"
            >
              <span className="notify-toast__text">{t.message}</span>
              <span className="notify-toast__hint">нажмите, чтобы закрыть</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Layout
