import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import { 
  LandingPage, 
  CitizenLogin, 
  CitizenRegister, 
  OfficialLogin, 
  AdminLogin,
  MapPage
} from './pages'
import ShareLocation from './pages/ShareLocation'

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Map View */}
        <Route path="/map" element={<MapPage />} />
        
        {/* WhatsApp Location Sharing */}
        <Route path="/share-location" element={<ShareLocation />} />
        
        {/* Citizen Auth Routes */}
        <Route path="/login" element={<CitizenLogin />} />
        <Route path="/register" element={<CitizenRegister />} />
        
        {/* Government Official Auth Routes */}
        <Route path="/official/login" element={<OfficialLogin />} />
        
        {/* Admin Auth Route (Secret - not linked anywhere) */}
        <Route path="/sudo/admin" element={<AdminLogin />} />
      </Routes>
    </Router>
  )
}

export default App
