import React, { useEffect, useState } from 'react'
import { router } from '@inertiajs/react'
import './catalog.scss'
import { requestsService } from '../api/api'

const Catalog = ({ categories: initialCategories = [], categoryId = null }) => {
  const [parentCategory, setParentCategory] = useState(null)
  const [categories, setCategories] = useState(initialCategories)

  useEffect(() => {
    if (initialCategories.length === 0) {
      requestsService.getCategories().then(data => setCategories(data || []))
    }
  }, [])

  useEffect(() => {
    if (categoryId && categories.length > 0) {
      const parent = categories.find(c => c.id === parseInt(categoryId))
      setParentCategory(parent)
    }
  }, [categoryId, categories])

  let categoriesToShow = []
  let pageTitle = ''

  if (!categoryId) {
    categoriesToShow = categories.filter(c => c.parentId === null || c.parentId === undefined)
    pageTitle = 'Каталог'
  } else {
    categoriesToShow = categories.filter(c => c.parentId === parseInt(categoryId))
    pageTitle = parentCategory ? `${parentCategory.name}` : 'Каталог'
  }

  const handleAllProductsClick = () => {
    if (categoryId) {
      router.visit(`/products?categoryId=${categoryId}`)
    } else {
      router.visit('/products')
    }
  }

  const handleCategoryClick = (category) => {
    const childCategories = categories.filter(c => c.parentId === category.id)

    if (childCategories.length === 0) {
      router.visit(`/products?categoryId=${category.id}`)
    } else {
      router.visit(`/catalog/${category.id}`)
    }
  }

  return (
    <div className="catalog">
      <div className="catalog__header">
        <h1 className="catalog__title">{pageTitle}</h1>
        {categoryId && (
          <button
            className="catalog__back-button"
            onClick={() => {
              if (parentCategory && parentCategory.parentId) {
                router.visit(`/catalog/${parentCategory.parentId}`)
              } else {
                router.visit('/catalog')
              }
            }}
          >
            ← Назад
          </button>
        )}
      </div>

      <div className="catalog__content">
        <div
          className="category-card"
          onClick={handleAllProductsClick}
        >
          <div className="category-card__image-wrapper">
            <div className="category-card__image category-card__image--all">
              Все товары
            </div>
          </div>
          <h3 className="category-card__title">
            {categoryId ? `Все ${parentCategory?.name}` : 'Все товары'}
          </h3>
          <p className="category-card__description">
            {categoryId
              ? `Показать все товары категории "${parentCategory?.name}"`
              : 'Показать все доступные товары'}
          </p>
        </div>

        {categoriesToShow.map(category => (
          <div
            key={category.id}
            className="category-card"
            onClick={() => handleCategoryClick(category)}
          >
            <div className="category-card__image-wrapper">
              <img
                src={category.icon}
                alt={category.name}
                className="category-card__image"
              />
            </div>
            <h3 className="category-card__title">{category.name}</h3>
            <p className="category-card__description">{category.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Catalog
