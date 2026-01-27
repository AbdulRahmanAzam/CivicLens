import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import { AuthProvider } from './contexts'
import ProtectedRoute, { 
  PublicOnlyRoute, 
  CitizenRoute, 
  AdminRoute,
  MayorRoute,
  TownshipRoute,
  UCChairmanRoute,
  OfficialRoute
} from './components/ProtectedRoute'
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
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Map View - Public */}
          <Route path="/map" element={<MapPage />} />
          
          {/* WhatsApp Location Sharing - Public */}
          <Route path="/share-location" element={<ShareLocation />} />
          
          {/* Citizen Auth Routes - Public Only (redirect if logged in) */}
          <Route path="/login" element={
            <PublicOnlyRoute>
              <CitizenLogin />
            </PublicOnlyRoute>
          } />
          <Route path="/register" element={
            <PublicOnlyRoute>
              <CitizenRegister />
            </PublicOnlyRoute>
          } />
          
          {/* Citizen Dashboard - Protected */}
          <Route path="/citizen/dashboard" element={
            <CitizenRoute>
              <CitizenDashboard />
            </CitizenRoute>
          } />
          
          {/* Government Official Auth Routes */}
          <Route path="/official/login" element={
            <PublicOnlyRoute>
              <OfficialLogin />
            </PublicOnlyRoute>
          } />

          {/* Mayor Dashboard - Protected */}
          <Route path="/mayor/dashboard" element={
            <MayorRoute>
              <MayorDashboard />
            </MayorRoute>
          } />

          {/* Township Dashboard - Protected */}
          <Route path="/township/dashboard" element={
            <TownshipRoute>
              <TownshipDashboard />
            </TownshipRoute>
          } />

          {/* UC Chairman Dashboard - Protected */}
          <Route path="/uc/dashboard" element={
            <UCChairmanRoute>
              <UCChairmanDashboard />
            </UCChairmanRoute>
          } />
          
          {/* Admin Auth Route (Secret - not linked anywhere) */}
          <Route path="/sudo/admin" element={
            <PublicOnlyRoute>
              <AdminLogin />
            </PublicOnlyRoute>
          } />

          {/* Admin Dashboard - Protected */}
          <Route path="/admin/dashboard" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
