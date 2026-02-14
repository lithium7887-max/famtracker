import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.jsx'

try {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} catch (err) {
  document.getElementById('root').innerHTML = `<div style="padding: 20px; color: white;">Critical Render Error: ${err.message}</div>`;
}
