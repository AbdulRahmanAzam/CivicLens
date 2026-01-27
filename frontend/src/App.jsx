import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import { 
  LandingPage, 
  CitizenLogin, 
  CitizenRegister, 
  OfficialLogin, 
  AdminLogin,
  MapPage,
  AdminDashboard,
  CitizenDashboard,
  MayorDashboard,
  TownshipDashboard,
  UCChairmanDashboard 

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
        <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
        
        {/* Government Official Auth Routes */}
        <Route path="/official/login" element={<OfficialLogin />} />

        {/* Mayor Dashboard */}
        <Route path="/mayor/dashboard" element={<MayorDashboard />} />

        {/* Township Dashboard */}
        <Route path="/township/dashboard" element={<TownshipDashboard />} />

        {/* UC Chairman Dashboard */}
        <Route path="/uc/dashboard" element={<UCChairmanDashboard />} />
        
        {/* Admin Auth Route (Secret - not linked anywhere) */}
        <Route path="/sudo/admin" element={<AdminLogin />} />

        {/* Admin Dashboard */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  )
}

export default App
