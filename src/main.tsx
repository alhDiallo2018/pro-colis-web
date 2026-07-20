import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/ds'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// PWA : app installable + tolérance aux coupures réseau (prod uniquement).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
