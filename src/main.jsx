import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SolarSystem from './SolarSystem.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
     <div className="bg-[#101720]">
      <SolarSystem />
    </div>
  </StrictMode>,
)
