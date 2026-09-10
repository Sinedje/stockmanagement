import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyBrandToCssVariables } from './theme'

// Publie la couleur de marque (definie dans src/theme.js) vers les variables CSS,
// pour que Tailwind, le CSS et Ant Design partagent une seule source.
applyBrandToCssVariables()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
