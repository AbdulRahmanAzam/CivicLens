import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import { 
  LandingPage, 
  CitizenLogin, 
  CitizenRegister, 
  OfficialLogin, 
  AdminLogin,
  AdminDashboard,
  CitizenDashboard,
  MayorDashboard,
  TownshipDashboard,
  UCChairmanDashboard 
} from './pages'

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        
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
