import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import store from './store/store'
import Layout from './Pages/Layout'
import './index.scss'

createInertiaApp({
  resolve: name => {
    const pages = import.meta.glob('./Pages/*.jsx', { eager: true })
    const page = pages[`./Pages/${name}.jsx`]
    if (!page) throw new Error(`Page not found: ${name}`)
    // Set default layout for all pages except Login
    if (name !== 'Login') {
      page.default.layout = page.default.layout || ((page) => <Layout>{page}</Layout>)
    }
    return page
  },
  setup({ el, App, props }) {
    createRoot(el).render(
      <Provider store={store}>
        <App {...props} />
      </Provider>
    )
  },
})
