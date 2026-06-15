import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ensureDemoAccounts } from './utils/auth'
import App from './App.tsx'

ensureDemoAccounts()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
