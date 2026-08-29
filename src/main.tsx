import '@fontsource-variable/figtree'
import '@fontsource-variable/unbounded'
import 'flag-icons/css/flag-icons.min.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
