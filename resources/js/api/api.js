import axios from "axios"

// Ensure cookies (session, XSRF-TOKEN) are always sent
axios.defaults.withCredentials = true
axios.defaults.withXSRFToken = true
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'

class Requests {
    URL = '/api'

    async getProducts(params = {}) {
        const qs = new URLSearchParams()
        if (params.page) qs.set('page', String(params.page))
        if (params.limit) qs.set('limit', String(params.limit))
        if (params.sortBy) qs.set('sortBy', params.sortBy)
        if (params.sortDir) qs.set('sortDir', params.sortDir)
        if (params.minPrice != null && params.minPrice !== '' && !Number.isNaN(Number(params.minPrice))) qs.set('minPrice', String(params.minPrice))
        if (params.maxPrice != null && params.maxPrice !== '' && !Number.isNaN(Number(params.maxPrice))) qs.set('maxPrice', String(params.maxPrice))
        if (params.categoryId) qs.set('categoryId', String(params.categoryId))
        if (params.inStockOnly) qs.set('inStockOnly', String(params.inStockOnly))
        if (params.outOfStockOnly) qs.set('outOfStockOnly', String(params.outOfStockOnly))
        if (params.hasDiscount) qs.set('hasDiscount', String(params.hasDiscount))
        if (params.noPhoto) qs.set('noPhoto', String(params.noPhoto))
        if (params.q) qs.set('q', String(params.q))
        if (params.charFilters && Object.keys(params.charFilters).length > 0) qs.set('charFilters', JSON.stringify(params.charFilters))
        if (params.minRating) qs.set('minRating', String(params.minRating))
        const { data } = await axios.get(this.URL + '/products?' + qs.toString())
        return data
    }

    async createProduct(body) {
        try {
            const formData = new FormData()
            formData.append('name', body.name || '')
            formData.append('description', body.description ?? '')
            formData.append('price', String(body.price ?? 0))
            formData.append('available_quantity', String(body.available_quantity ?? 0))
            formData.append('discount_percent', String(body.discount_percent ?? 0))
            if (body.category && body.category.length) formData.append('category', JSON.stringify(body.category))
            formData.append('characteristics', JSON.stringify(body.characteristics || []))
            if (body.images && body.images.length) {
                const imageOrder = []
                const newFiles = []
                body.images.forEach(img => {
                    if (img.isNew && img.file) {
                        imageOrder.push(`__new__${newFiles.length}`)
                        newFiles.push(img.file)
                    } else {
                        imageOrder.push(img.url)
                    }
                })
                formData.append('imageOrder', JSON.stringify(imageOrder))
                newFiles.forEach(file => formData.append('images[]', file))
            }
            const { data } = await axios.post(this.URL + '/products', formData)
            return data
        } catch (err) {
            console.error('createProduct error:', err.response?.data || err)
            return { success: false, error: err.response?.data || err.message }
        }
    }

    async updateProduct(id, body) {
        try {
            const formData = new FormData()
            formData.append('_method', 'PATCH')
            formData.append('name', body.name || '')
            formData.append('description', body.description ?? '')
            formData.append('price', String(body.price ?? 0))
            formData.append('available_quantity', String(body.available_quantity ?? 0))
            formData.append('discount_percent', String(body.discount_percent ?? 0))
            if (body.category) formData.append('category', JSON.stringify(body.category))
            formData.append('characteristics', JSON.stringify(body.characteristics || []))
            if (Array.isArray(body.images)) {
                const imageOrder = []
                const newFiles = []
                body.images.forEach(img => {
                    if (img.isNew && img.file) {
                        imageOrder.push(`__new__${newFiles.length}`)
                        newFiles.push(img.file)
                    } else {
                        imageOrder.push(img.url)
                    }
                })
                formData.append('imageOrder', JSON.stringify(imageOrder))
                newFiles.forEach(file => formData.append('images[]', file))
            }
            const { data } = await axios.post(this.URL + `/products/${id}`, formData)
            return data
        } catch (err) {
            console.error('updateProduct error:', err.response?.data || err)
            return { success: false, error: err.response?.data || err.message }
        }
    }

    async deleteProduct(id) {
        try {
            const { data } = await axios.delete(this.URL + `/products/${id}`)
            return { success: true, data }
        } catch (err) {
            return { success: false, error: err }
        }
    }

    async getCategories() {
        const { data } = await axios.get(this.URL + '/categories')
        return data
    }

    async createCategory(body) {
        try {
            const formData = new FormData()
            formData.append('name', body.name || '')
            formData.append('description', body.description ?? '')
            if (body.parentId) formData.append('parentId', String(body.parentId))
            if (body.imageFile) formData.append('icon', body.imageFile)
            const { data } = await axios.post(this.URL + '/categories', formData)
            return { success: true, category: data }
        } catch (err) {
            console.error('createCategory error:', err.response?.data || err)
            return { success: false, error: err.response?.data || err.message }
        }
    }

    async updateCategory(id, body) {
        try {
            const formData = new FormData()
            formData.append('_method', 'PATCH')
            formData.append('name', body.name || '')
            formData.append('description', body.description ?? '')
            if (body.parentId) formData.append('parentId', String(body.parentId))
            if (body.imageFile) formData.append('icon', body.imageFile)
            const { data } = await axios.post(this.URL + `/categories/${id}`, formData)
            return { success: true, category: data }
        } catch (err) {
            console.error('updateCategory error:', err.response?.data || err)
            return { success: false, error: err.response?.data || err.message }
        }
    }

    async deleteCategory(id) {
        try {
            const { data } = await axios.delete(this.URL + `/categories/${id}`)
            return { success: true, data }
        } catch (err) {
            return { success: false, error: err }
        }
    }

    async getProductById(id) {
        const { data } = await axios.get(this.URL + `/products/${id}`)
        return data
    }

    async getOrders(params = {}) {
        const qs = new URLSearchParams()
        if (params.page) qs.set('page', String(params.page))
        if (params.limit) qs.set('limit', String(params.limit))
        if (params.sortBy) qs.set('sortBy', params.sortBy)
        if (params.sortDir) qs.set('sortDir', params.sortDir)
        if (params.userId) qs.set('userId', String(params.userId))
        if (params.q) qs.set('q', params.q)
        if (params.status) qs.set('status', params.status)
        if (params.deliveryMethod) qs.set('deliveryMethod', params.deliveryMethod)
        if (params.dateFrom) qs.set('dateFrom', params.dateFrom)
        if (params.dateTo) qs.set('dateTo', params.dateTo)
        const { data } = await axios.get(this.URL + '/orders?' + qs.toString())
        return data
    }

    async getOrderById(id) {
        const { data } = await axios.get(this.URL + `/orders/${id}`)
        return data
    }

    async getNotifications() {
        try {
            const { data } = await axios.get(this.URL + '/notifications')
            return Array.isArray(data) ? data : []
        } catch {
            return []
        }
    }

    async getPaymentCards() {
        try {
            const { data } = await axios.get(this.URL + '/payment-cards')
            return Array.isArray(data) ? data : []
        } catch {
            return []
        }
    }

    async savePaymentCard(body) {
        try {
            const { data } = await axios.post(this.URL + '/payment-cards', body)
            return data
        } catch (err) {
            return { success: false, error: err }
        }
    }

    async deletePaymentCard(id) {
        try {
            const { data } = await axios.delete(this.URL + `/payment-cards/${id}`)
            return data
        } catch (err) {
            return { success: false, error: err }
        }
    }

    async updateOrder(id, updates) {
        try {
            const { data } = await axios.patch(this.URL + `/orders/${id}`, updates)
            return data
        } catch (err) {
            return { success: false, error: err }
        }
    }

    async createOrder(body) {
        try {
            const { data } = await axios.post(this.URL + '/orders', body)
            return { success: true, order: data }
        } catch (err) {
            return { success: false, error: err }
        }
    }

    async getAllUsers() {
        const { data } = await axios.get(this.URL + '/users')
        return data
    }

    async getUserById(id) {
        const { data } = await axios.get(this.URL + `/users/${id}`)
        return data
    }

    async register(firstName, lastName, middleName, email, phone, password) {
        try {
            const { data } = await axios.post('/auth/register', {
                firstName, lastName, middleName, email, phone, password
            })
            return { success: true, user: data.user, token: null }
        } catch (error) {
            if (error.response?.status === 409) {
                return { success: false, errors: error.response.data }
            }
            throw error
        }
    }

    async login(emailOrPhone, password) {
        try {
            const { data } = await axios.post('/auth/login', {
                emailOrPhone, password
            })
            return { success: true, user: data.user, token: null }
        } catch (error) {
            if (error.response?.status === 401) {
                return { success: false, error: error.response.data.error }
            }
            throw error
        }
    }

    async updateUser(id, userData) {
        try {
            const { data } = await axios.patch(this.URL + `/users/${id}`, userData)
            return { success: true, user: data.user || data }
        } catch (error) {
            if (error.response?.status === 409) {
                return { success: false, errors: error.response.data }
            }
            throw error
        }
    }

    async createStaff(body) {
        try {
            const { data } = await axios.post(this.URL + '/users', body)
            return data
        } catch (err) {
            if (err.response?.status === 409 || err.response?.status === 422) {
                return { success: false, errors: err.response.data }
            }
            return { success: false, error: err.response?.data || err.message }
        }
    }

    async deleteUser(id) {
        try {
            const { data } = await axios.delete(this.URL + `/users/${id}`)
            return { success: true, data }
        } catch (error) {
            return { success: false, error }
        }
    }

    // Cart API
    async getCart() {
        const { data } = await axios.get(this.URL + '/cart')
        return data
    }

    async addToCart(productId, quantity) {
        const { data } = await axios.post(this.URL + '/cart/items', { productId, quantity })
        return data
    }

    async updateCartItem(productId, quantity) {
        const { data } = await axios.patch(this.URL + `/cart/items/${productId}`, { quantity })
        return data
    }

    async removeCartItem(productId) {
        const { data } = await axios.delete(this.URL + `/cart/items/${productId}`)
        return data
    }

    async clearCart() {
        const { data } = await axios.delete(this.URL + '/cart')
        return data
    }

    async confirmCart(productIds = null, delivery = null) {
        const { data } = await axios.post(this.URL + '/cart/confirm', {
            productIds,
            ...(delivery || {}),
        })
        return data
    }

    async getReviews(productId) {
        const { data } = await axios.get(this.URL + `/products/${productId}/reviews`)
        return data
    }

    async canReview(productId) {
        const { data } = await axios.get(this.URL + `/products/${productId}/reviews/can-review`)
        return data
    }

    async createReview(productId, reviewData) {
        try {
            const formData = new FormData()
            formData.append('rating', String(reviewData.rating))
            if (reviewData.body) formData.append('body', reviewData.body)
            if (reviewData.images && reviewData.images.length) {
                reviewData.images.forEach(file => formData.append('images[]', file))
            }
            const { data } = await axios.post(this.URL + `/products/${productId}/reviews`, formData)
            return data
        } catch (err) {
            return { success: false, error: err.response?.data?.error || err.message }
        }
    }

    async updateReview(productId, reviewData) {
        try {
            const formData = new FormData()
            formData.append('_method', 'PATCH')
            formData.append('rating', String(reviewData.rating))
            if (reviewData.body) formData.append('body', reviewData.body)
            formData.append('existingImages', JSON.stringify(reviewData.existingImages || []))
            if (reviewData.newImages && reviewData.newImages.length) {
                reviewData.newImages.forEach(file => formData.append('images[]', file))
            }
            const { data } = await axios.post(this.URL + `/products/${productId}/reviews`, formData)
            return data
        } catch (err) {
            return { success: false, error: err.response?.data?.error || err.message }
        }
    }

    async getAdminReviews(params = {}) {
        const qs = new URLSearchParams()
        if (params.page) qs.set('page', String(params.page))
        if (params.limit) qs.set('limit', String(params.limit))
        if (params.sortBy) qs.set('sortBy', params.sortBy)
        if (params.sortDir) qs.set('sortDir', params.sortDir)
        if (params.q) qs.set('q', params.q)
        if (params.product) qs.set('product', params.product)
        if (params.from) qs.set('from', params.from)
        if (params.to) qs.set('to', params.to)
        if (params.rating) qs.set('rating', String(params.rating))
        if (params.hasPhoto) qs.set('hasPhoto', params.hasPhoto)
        if (params.status) qs.set('status', params.status)
        const { data } = await axios.get(this.URL + '/admin/reviews?' + qs.toString())
        return data
    }

    async approveReview(id) {
        try {
            const { data } = await axios.patch(this.URL + `/admin/reviews/${id}/approve`)
            return data
        } catch (err) {
            return { success: false, error: err }
        }
    }

    async deleteReview(id) {
        try {
            const { data } = await axios.delete(this.URL + `/admin/reviews/${id}`)
            return data
        } catch (err) {
            return { success: false, error: err }
        }
    }

    async deleteReviewUser(id) {
        try {
            const { data } = await axios.delete(this.URL + `/admin/reviews/${id}/user`)
            return data
        } catch (err) {
            return { success: false, error: err }
        }
    }

    async deleteOwnReview(productId) {
        try {
            const { data } = await axios.delete(this.URL + `/products/${productId}/reviews`)
            return data
        } catch (err) {
            return { success: false, error: err }
        }
    }

    async getStatistics(params = {}) {
        const qs = new URLSearchParams()
        if (params.type) qs.set('type', params.type)
        if (params.id) qs.set('id', String(params.id))
        if (params.groupBy) qs.set('groupBy', params.groupBy)
        if (params.from) qs.set('from', params.from)
        if (params.to) qs.set('to', params.to)
        if (params.source) qs.set('source', params.source)
        const { data } = await axios.get(this.URL + '/statistics?' + qs.toString())
        return data
    }

    async createManualSale(body) {
        try {
            const { data } = await axios.post(this.URL + '/manual-sales', body)
            return data
        } catch (err) {
            return { success: false, error: err.response?.data || err.message }
        }
    }

    async getCharTemplates(categoryId = null) {
        const qs = new URLSearchParams()
        if (categoryId) qs.set('categoryId', String(categoryId))
        const { data } = await axios.get(this.URL + '/char-templates?' + qs.toString())
        return data
    }

    async createCharTemplate(body) {
        try {
            const { data } = await axios.post(this.URL + '/char-templates', body)
            return data
        } catch (err) {
            return { success: false, error: err.response?.data || err.message }
        }
    }

    async updateCharTemplate(id, body) {
        try {
            const { data } = await axios.patch(this.URL + `/char-templates/${id}`, body)
            return data
        } catch (err) {
            return { success: false, error: err.response?.data || err.message }
        }
    }

    async deleteCharTemplate(id) {
        try {
            const { data } = await axios.delete(this.URL + `/char-templates/${id}`)
            return data
        } catch (err) {
            return { success: false, error: err }
        }
    }

    // Slides
    async getSlides() {
        const { data } = await axios.get(this.URL + '/slides')
        return data
    }

    async getAdminSlides(params = {}) {
        const qs = new URLSearchParams()
        if (params.page) qs.set('page', String(params.page))
        if (params.limit) qs.set('limit', String(params.limit))
        if (params.sortBy) qs.set('sortBy', params.sortBy)
        if (params.sortDir) qs.set('sortDir', params.sortDir)
        if (params.q) qs.set('q', params.q)
        const { data } = await axios.get(this.URL + '/admin/slides?' + qs.toString())
        return data
    }

    async createSlide(body) {
        try {
            const formData = new FormData()
            formData.append('title', body.title || '')
            formData.append('description', body.description ?? '')
            formData.append('link', body.link ?? '')
            if (body.imageFile) formData.append('image', body.imageFile)
            const { data } = await axios.post(this.URL + '/admin/slides', formData)
            return data
        } catch (err) {
            return { success: false, error: err.response?.data || err.message }
        }
    }

    async updateSlide(id, body) {
        try {
            const formData = new FormData()
            formData.append('_method', 'PATCH')
            if (body.title != null) formData.append('title', body.title)
            if (body.description != null) formData.append('description', body.description)
            if (body.link != null) formData.append('link', body.link)
            if (body.imageFile) formData.append('image', body.imageFile)
            const { data } = await axios.post(this.URL + `/admin/slides/${id}`, formData)
            return data
        } catch (err) {
            return { success: false, error: err.response?.data || err.message }
        }
    }

    async deleteSlide(id) {
        try {
            const { data } = await axios.delete(this.URL + `/admin/slides/${id}`)
            return data
        } catch (err) {
            return { success: false, error: err }
        }
    }
}

export const requestsService = new Requests()
