import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import linesSvg from './assets/lines.svg?url'

document.body.style.setProperty('--bg-lines', `url("${linesSvg}")`)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
