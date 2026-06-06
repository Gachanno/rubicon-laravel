import React, { useEffect, useRef, useState, useCallback } from 'react'
import { router } from '@inertiajs/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import './HeroSlider.scss'

const SWIPE_THRESHOLD = 60

const HeroSlider = ({ slides = [] }) => {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartX = useRef(null)
  const trackRef = useRef(null)

  const count = slides.length

  const goTo = useCallback((idx) => {
    if (count === 0) return
    setCurrent(((idx % count) + count) % count)
  }, [count])

  const next = useCallback(() => goTo(current + 1), [current, goTo])
  const prev = useCallback(() => goTo(current - 1), [current, goTo])

  const viewportWidth = () => trackRef.current?.parentElement?.offsetWidth || 1

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    setIsDragging(true)
    setDragOffset(0)
  }
  const handleTouchMove = (e) => {
    if (touchStartX.current === null) return
    const dx = e.touches[0].clientX - touchStartX.current
    const w = viewportWidth()
    // Soft clamp at edges
    if ((current === 0 && dx > 0) || (current === count - 1 && dx < 0)) {
      setDragOffset(dx * 0.35)
    } else {
      setDragOffset(Math.max(-w, Math.min(w, dx)))
    }
  }
  const handleTouchEnd = () => {
    const w = viewportWidth()
    const threshold = Math.min(SWIPE_THRESHOLD, w * 0.18)
    if (dragOffset <= -threshold) next()
    else if (dragOffset >= threshold) prev()
    touchStartX.current = null
    setDragOffset(0)
    setIsDragging(false)
  }

  // Re-enable transitions after looping reorders so the snap is invisible
  const [skipTransition, setSkipTransition] = useState(false)
  useEffect(() => {
    if (!skipTransition) return
    const id = requestAnimationFrame(() => setSkipTransition(false))
    return () => cancelAnimationFrame(id)
  }, [skipTransition])

  const handleSlideClick = (slide) => {
    if (slide?.link) {
      const link = slide.link
      if (/^https?:\/\//i.test(link)) {
        window.open(link, '_blank', 'noopener,noreferrer')
      } else {
        router.visit(link)
      }
    }
  }

  if (count === 0) return null

  const trackStyle = {
    transform: `translate3d(calc(${-current * 100}% + ${dragOffset}px), 0, 0)`,
    transition: isDragging || skipTransition
      ? 'none'
      : 'transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1)',
  }

  return (
    <section
      className={`hero-slider${paused ? ' hero-slider--paused' : ''}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div className="hero-slider__viewport">
        <div className="hero-slider__track" ref={trackRef} style={trackStyle}>
          {slides.map((s, idx) => (
            <div
              key={s.id ?? idx}
              className={`hero-slider__slide${idx === current ? ' hero-slider__slide--active' : ''}`}
              style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${s.image})` }}
              aria-hidden={idx !== current}
            >
              <div className="hero-slider__content" key={`content-${current}-${idx}`}>
                <h1 className="hero-slider__title">{s.title}</h1>
                {s.description && <p className="hero-slider__subtitle">{s.description}</p>}
                {s.link && (
                  <button className="hero-slider__button" onClick={() => handleSlideClick(s)}>
                    Подробнее
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            className="hero-slider__arrow hero-slider__arrow--left"
            onClick={prev}
            aria-label="Предыдущий слайд"
            type="button"
          >
            <ChevronLeft size={30} strokeWidth={2.4} />
          </button>
          <button
            className="hero-slider__arrow hero-slider__arrow--right"
            onClick={next}
            aria-label="Следующий слайд"
            type="button"
          >
            <ChevronRight size={30} strokeWidth={2.4} />
          </button>

          <div className="hero-slider__indicators">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`hero-slider__indicator${idx === current ? ' hero-slider__indicator--active' : ''}`}
                onClick={() => goTo(idx)}
                aria-label={`Перейти к слайду ${idx + 1}`}
              >
                <span
                  key={`fill-${current}-${idx}`}
                  className="hero-slider__indicator-fill"
                  onAnimationEnd={() => { if (idx === current) next() }}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export default HeroSlider
