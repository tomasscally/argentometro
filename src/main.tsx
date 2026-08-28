import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { iniciarAnalytics } from './lib/analytics'

// Antes de montar: el primer panel se registra en cuanto App lo decide, y para
// entonces gtag ya tiene que existir.
iniciarAnalytics()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
