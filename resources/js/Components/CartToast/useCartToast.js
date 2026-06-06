import { useState, useRef, useCallback, useEffect } from 'react'

export function useCartToast(duration = 4000) {
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(false)
  const timer = useRef(null)

  const notify = useCallback((msg) => {
    setMessage(msg)
    setVisible(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setVisible(false), duration)
  }, [duration])

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  return { message, visible, notify }
}
