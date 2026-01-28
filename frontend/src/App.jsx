import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './App.css'
import './styles/map.css'
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
  MapPage,
  AboutPage,
  ContactPage,
  PrivacyPolicyPage,
  TermsOfServicePage,
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
import ShareLocation from './pages/ShareLocation'
import TransparencyDashboard from './pages/TransparencyDashboard'
import { MainLayout } from './components/layout'
import { ChatWidget } from './components/Chatbot'

// Citizen Pages
import {
  ReportIssuePage,
  MyComplaintsPage,
  ComplaintDetailPage,
  ProfilePage as CitizenProfilePage,
  SettingsPage as CitizenSettingsPage,
  NotificationsPage
} from './pages/citizen'

// Official Pages
import {
  OfficialDashboard,
  ManageComplaintsPage,
  TerritoryPage
} from './pages/official'

// Admin Pages
import {
  ManageUsersPage,
  ManageTerritoriesPage,
  ManageCategoriesPage
} from './pages/admin'

// Error Pages
const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <p className="text-xl text-foreground/60 mb-8">Page not found</p>
      <a href="/" className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors">
        Go Home
      </a>
    </div>
  </div>
)

const UnauthorizedPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-red-600 mb-4">403</h1>
      <p className="text-xl text-foreground/60 mb-8">You don't have permission to access this page</p>
      <a href="/" className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors">
        Go Home
      </a>
    </div>
  </div>
)

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          
          {/* Map View - Public */}
          <Route path="/map" element={<MapPage />} />
          
          {/* WhatsApp Location Sharing - Public */}
          <Route path="/share-location" element={<ShareLocation />} />
          
          {/* Transparency Dashboard - Public */}
          <Route path="/transparency" element={<TransparencyDashboard />} />
          
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
          
          {/* Citizen Routes - Protected with Layout */}
          <Route path="/citizen" element={
            <CitizenRoute>
              <MainLayout />
            </CitizenRoute>
          }>
            <Route index element={<Navigate to="/citizen/dashboard" replace />} />
            <Route path="dashboard" element={<CitizenDashboard />} />
            <Route path="report" element={<ReportIssuePage />} />
            <Route path="complaints" element={<MyComplaintsPage />} />
            <Route path="complaints/:id" element={<ComplaintDetailPage />} />
            <Route path="profile" element={<CitizenProfilePage />} />
            <Route path="settings" element={<CitizenSettingsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>
          
          {/* Government Official Auth Routes */}
          <Route path="/official/login" element={
            <PublicOnlyRoute>
              <OfficialLogin />
            </PublicOnlyRoute>
          } />

          {/* Official Routes - Protected with Layout */}
          <Route path="/official" element={
            <OfficialRoute>
              <MainLayout />
            </OfficialRoute>
          }>
            <Route index element={<Navigate to="/official/dashboard" replace />} />
            <Route path="dashboard" element={<OfficialDashboard />} />
            <Route path="complaints" element={<ManageComplaintsPage />} />
            <Route path="complaints/:id" element={<ComplaintDetailPage />} />
            <Route path="territory" element={<TerritoryPage />} />
            <Route path="profile" element={<CitizenProfilePage />} />
          </Route>

          {/* Mayor Routes - Protected with Layout */}
          <Route path="/mayor" element={
            <MayorRoute>
              <MainLayout />
            </MayorRoute>
          }>
            <Route index element={<Navigate to="/mayor/dashboard" replace />} />
            <Route path="dashboard" element={<MayorDashboard />} />
            <Route path="complaints" element={<ManageComplaintsPage />} />
            <Route path="map" element={<TerritoryPage />} />
          </Route>

          {/* Legacy Township Dashboard Route - Redirect to Official */}
          <Route path="/township/dashboard" element={
            <TownshipRoute>
              <Navigate to="/official/dashboard" replace />
            </TownshipRoute>
          } />

          {/* Legacy UC Chairman Dashboard Route - Redirect to Official */}
          <Route path="/uc/dashboard" element={
            <UCChairmanRoute>
              <Navigate to="/official/dashboard" replace />
            </UCChairmanRoute>
          } />
          
          {/* Admin Auth Route (Secret - not linked anywhere) */}
          <Route path="/sudo/admin" element={
            <PublicOnlyRoute>
              <AdminLogin />
            </PublicOnlyRoute>
          } />

          {/* Admin Routes - Protected with Layout */}
          <Route path="/admin" element={
            <AdminRoute>
              <MainLayout />
            </AdminRoute>
          }>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<ManageUsersPage />} />
            <Route path="territories" element={<ManageTerritoriesPage />} />
            <Route path="categories" element={<ManageCategoriesPage />} />
          </Route>

          {/* Error Routes */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        
        {/* AI Chatbot Widget - Available on all pages */}
        <ChatWidget />
      </Router>
    </AuthProvider>
  )
}

export default App
