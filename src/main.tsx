import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import 'leaflet/dist/leaflet.css'

// Eruda mobile console — only when ?debug=1 is in URL
if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1') {
  import('eruda').then((m) => m.default.init())
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
