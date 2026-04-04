import React from 'react'
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'
import './styles/auth.css'
import './styles/dashboard.css'

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

const resolvedApiBaseUrl = (() => {
  if (!configuredApiBaseUrl) {
    return ''
  }

  try {
    const parsedUrl = new URL(configuredApiBaseUrl)
    const configIsLocalhost = parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1'

    if (configIsLocalhost && !isLocalhost) {
      return ''
    }

    return configuredApiBaseUrl
  } catch {
    return configuredApiBaseUrl
  }
})()

axios.defaults.baseURL = resolvedApiBaseUrl || (isLocalhost ? 'http://localhost:5000' : '')

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
