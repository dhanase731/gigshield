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

axios.defaults.baseURL = configuredApiBaseUrl || (isLocalhost ? 'http://localhost:5000' : '')

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
