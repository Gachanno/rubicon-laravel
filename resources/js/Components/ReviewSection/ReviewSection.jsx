import React, { useState, useEffect, useRef } from 'react'
import { Rating } from 'react-simple-star-rating'
import { X } from 'lucide-react'
import { requestsService } from '../../api/api'
import './ReviewSection.scss'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'oldest', label: 'Сначала старые' },
  { value: 'high', label: 'Высокий рейтинг' },
  { value: 'low', label: 'Низкий рейтинг' },
]

const ReviewSection = ({ productId, currentUser, isAdmin }) => {
  const [reviews, setReviews] = useState([])
  const [canReview, setCanReview] = useState(false)
  const [hasReview, setHasReview] = useState(false)
  const [userReview, setUserReview] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ rating: 0, body: '', newImages: [], existingImages: [] })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [lightbox, setLightbox] = useState(null)
  const [sortOrder, setSortOrder] = useState('newest')
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, isOwn: false })
  const fileInputRef = useRef(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const reviewsData = await requestsService.getReviews(productId)
      setReviews(reviewsData || [])
      if (currentUser) {
        const status = await requestsService.canReview(productId)
        setCanReview(status.canReview)
        setHasReview(status.hasReview)
        if (status.review) setUserReview(status.review)
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { loadData() }, [productId, currentUser?.id])

  const openCreateForm = () => {
    setForm({ rating: 0, body: '', newImages: [], existingImages: [] })
    setError('')
    setShowForm(true)
  }

  const openEditForm = () => {
    if (!userReview) return
    setForm({
      rating: userReview.rating,
      body: userReview.body || '',
      newImages: [],
      existingImages: userReview.images || [],
    })
    setError('')
    setShowForm(true)
  }

  const totalImages = form.existingImages.length + form.newImages.length

  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files)
    const invalid = files.filter(f => !ALLOWED_IMAGE_TYPES.includes(f.type))
    if (invalid.length > 0) {
      setError('SVG и другие форматы не поддерживаются. Допустимые: JPG, PNG, GIF, WEBP')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    if (totalImages + files.length > 5) {
      setError(`Можно добавить не более 5 изображений (уже: ${totalImages})`)
      return
    }
    setForm(prev => ({ ...prev, newImages: [...prev.newImages, ...files] }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeExistingImage = (idx) => {
    setForm(prev => ({ ...prev, existingImages: prev.existingImages.filter((_, i) => i !== idx) }))
  }

  const removeNewImage = (idx) => {
    setForm(prev => ({ ...prev, newImages: prev.newImages.filter((_, i) => i !== idx) }))
  }

  const handleSubmit = async () => {
    if (!form.rating || form.rating === 0) {
      setError('Выберите оценку')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      let result
      if (hasReview) {
        result = await requestsService.updateReview(productId, {
          rating: form.rating,
          body: form.body,
          newImages: form.newImages,
          existingImages: form.existingImages,
        })
      } else {
        result = await requestsService.createReview(productId, {
          rating: form.rating,
          body: form.body,
          images: form.newImages,
        })
      }
      if (result?.success) {
        const reviewsData = await requestsService.getReviews(productId)
        setReviews(reviewsData || [])
        setHasReview(true)
        setUserReview(result.review)
        setShowForm(false)
      } else {
        setError(result?.error || 'Ошибка при сохранении отзыва')
      }
    } catch {
      setError('Ошибка при сохранении отзыва')
    }
    setSubmitting(false)
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortOrder === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt)
    if (sortOrder === 'high') return b.rating - a.rating
    if (sortOrder === 'low') return a.rating - b.rating
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  if (loading) return <div className="review-section__loading">Загрузка отзывов...</div>

  return (
    <div className="review-section">
      {/* Header */}
      <div className="review-section__header">
        <h2 className="review-section__title">Отзывы</h2>
        {reviews.length > 0 && (
          <div className="review-section__avg">
            <span className="review-section__avg-score">{avgRating.toFixed(1)}</span>
            <div className="review-section__avg-stars">
              <Rating readonly initialValue={avgRating} size={26} allowFraction SVGstyle={{ display: 'inline' }} />
            </div>
            <span className="review-section__count">{reviews.length} {declReviews(reviews.length)}</span>
          </div>
        )}
      </div>

      {/* Rating breakdown */}
      {reviews.length > 0 && (
        <div className="review-section__breakdown">
          {[5, 4, 3, 2, 1].map(star => {
            const count = reviews.filter(r => r.rating === star).length
            const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0
            return (
              <div key={star} className="breakdown-row">
                <span className="breakdown-row__star">{star} ★</span>
                <div className="breakdown-row__bar-wrap">
                  <div className="breakdown-row__bar" style={{ width: `${pct}%` }} />
                </div>
                <span className="breakdown-row__count">{count}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Write / manage review buttons */}
      {canReview && !showForm && (
        <div className="review-section__action" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {hasReview ? (
            <>
              <button className="review-section__btn" onClick={openEditForm}>Изменить мой отзыв</button>
              <button
                className="review-section__btn review-section__btn--cancel"
                onClick={() => setDeleteConfirm({ open: true, id: userReview?.id, isOwn: true })}
              >
                Удалить мой отзыв
              </button>
            </>
          ) : (
            <button className="review-section__btn" onClick={openCreateForm}>Написать отзыв</button>
          )}
        </div>
      )}

      {/* Author's own review awaiting moderation — visible only to them */}
      {userReview && userReview.status === 'pending' && !showForm && (
        <div className="review-section__pending">
          <div className="review-section__pending-head">
            <span className="review-section__pending-badge">На модерации</span>
            <span className="review-section__pending-note">
              Ваш отзыв виден только вам, пока его не одобрит модератор. На оценку товара он пока не влияет.
            </span>
          </div>
          <div className="review-card review-card--pending">
            <div className="review-card__header">
              <span className="review-card__author">{currentUser ? 'Вы' : 'Ваш отзыв'}</span>
              <Rating readonly initialValue={userReview.rating} size={18} SVGstyle={{ display: 'inline' }} />
              <span className="review-card__rating-num">{userReview.rating}.0</span>
              {userReview.createdAt && (
                <span className="review-card__date">{new Date(userReview.createdAt).toLocaleDateString('ru-RU')}</span>
              )}
            </div>
            {userReview.body && <p className="review-card__body">{userReview.body}</p>}
            {userReview.images && userReview.images.length > 0 && (
              <div className="review-card__images">
                {userReview.images.map((url, idx) => (
                  <img key={idx} src={url} alt="" className="review-card__image" onClick={() => setLightbox(url)} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="review-section__form">
          <h3 className="review-section__form-title">{hasReview ? 'Изменить отзыв' : 'Написать отзыв'}</h3>

          <div className="review-section__form-group">
            <label className="review-section__label">Оценка</label>
            <Rating
              onClick={(rate) => setForm(prev => ({ ...prev, rating: rate }))}
              initialValue={form.rating}
              size={36}
              SVGstyle={{ display: 'inline' }}
            />
          </div>

          <div className="review-section__form-group">
            <label className="review-section__label">Текст отзыва</label>
            <textarea
              className="review-section__textarea"
              value={form.body}
              onChange={e => setForm(prev => ({ ...prev, body: e.target.value }))}
              placeholder="Поделитесь впечатлениями о товаре..."
              rows={4}
              maxLength={2000}
            />
            <span className="review-section__char-count">{form.body.length}/2000</span>
          </div>

          <div className="review-section__form-group">
            <label className="review-section__label">Фотографии (до 5)</label>
            <div className="review-section__image-preview">
              {form.existingImages.map((url, idx) => (
                <div key={`ex-${idx}`} className="review-section__img-wrap">
                  <img src={url} alt="" onClick={() => setLightbox(url)} />
                  <button type="button" className="review-section__img-remove" onClick={() => removeExistingImage(idx)} aria-label="Удалить">
                    <X size={14} strokeWidth={2.6} />
                  </button>
                </div>
              ))}
              {form.newImages.map((file, idx) => (
                <div key={`nw-${idx}`} className="review-section__img-wrap">
                  <img src={URL.createObjectURL(file)} alt="" />
                  <button type="button" className="review-section__img-remove" onClick={() => removeNewImage(idx)} aria-label="Удалить">
                    <X size={14} strokeWidth={2.6} />
                  </button>
                </div>
              ))}
              {totalImages < 5 && (
                <label className="review-section__add-img">
                  +
                  <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleImageAdd} style={{ display: 'none' }} />
                </label>
              )}
            </div>
          </div>

          {error && <div className="review-section__error">{error}</div>}

          <div className="review-section__form-actions">
            <button className="review-section__btn review-section__btn--cancel" onClick={() => setShowForm(false)} disabled={submitting}>Отмена</button>
            <button className="review-section__btn review-section__btn--submit" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      )}

      {/* Sort + list */}
      {reviews.length === 0 ? (
        <div className="review-section__empty">Пока нет отзывов. Будьте первым!</div>
      ) : (
        <>
          <div className="review-section__sort">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`review-sort-btn ${sortOrder === opt.value ? 'active' : ''}`}
                onClick={() => setSortOrder(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="review-section__list">
            {sortedReviews.map(review => (
              <div key={review.id} className="review-card">
                <div className="review-card__header">
                  <span className="review-card__author">{review.userName}</span>
                  <Rating readonly initialValue={review.rating} size={18} SVGstyle={{ display: 'inline' }} />
                  <span className="review-card__rating-num">{review.rating}.0</span>
                  <span className="review-card__date">
                    {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                  {isAdmin && (
                    <button
                      className="review-card__delete-btn"
                      title="Удалить отзыв"
                      onClick={() => setDeleteConfirm({ open: true, id: review.id, isOwn: false })}
                    >
                      Удалить
                    </button>
                  )}
                </div>
                {review.body && <p className="review-card__body">{review.body}</p>}
                {review.images && review.images.length > 0 && (
                  <div className="review-card__images">
                    {review.images.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt=""
                        className="review-card__image"
                        onClick={() => setLightbox(url)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {deleteConfirm.open && (
        <div className="review-lightbox" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={() => setDeleteConfirm({ open: false, id: null })}>
          <div
            style={{ background: '#fff', borderRadius: 10, padding: '24px 28px', minWidth: 280, boxShadow: '0 8px 30px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', gap: 16 }}
            onClick={e => e.stopPropagation()}
          >
            <p style={{ margin: 0, fontSize: '1rem', color: '#2d3436', textAlign: 'center' }}>Удалить этот отзыв?</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
              <button
                className="review-section__btn review-section__btn--cancel"
                onClick={() => setDeleteConfirm({ open: false, id: null })}
              >Отмена</button>
              <button
                className="review-section__btn"
                style={{ background: '#e74c3c' }}
                onClick={async () => {
                  const { id, isOwn } = deleteConfirm
                  setDeleteConfirm({ open: false, id: null, isOwn: false })
                  let res
                  if (isOwn) {
                    res = await requestsService.deleteOwnReview(productId)
                    if (res?.success) {
                      setReviews(prev => prev.filter(r => r.id !== id))
                      setHasReview(false)
                      setUserReview(null)
                    }
                  } else {
                    res = await requestsService.deleteReview(id)
                    if (res?.success) setReviews(prev => prev.filter(r => r.id !== id))
                  }
                }}
              >Удалить</button>
            </div>
          </div>
        </div>
      )}

      {lightbox && (
        <div className="review-lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" className="review-lightbox__img" onClick={e => e.stopPropagation()} />
          <button className="review-lightbox__close" onClick={() => setLightbox(null)} aria-label="Закрыть">
            <X size={22} strokeWidth={2.4} />
          </button>
        </div>
      )}
    </div>
  )
}

function declReviews(n) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return 'отзывов'
  if (mod10 === 1) return 'отзыв'
  if (mod10 >= 2 && mod10 <= 4) return 'отзыва'
  return 'отзывов'
}

export default ReviewSection
