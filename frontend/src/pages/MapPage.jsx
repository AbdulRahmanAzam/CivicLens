/**
 * Map Page
 * Full-page map view with complaint heatmap and markers
 */

import { Link } from 'react-router-dom';
import { CivicLensMap } from '../components/Map';
import { useAuth } from '../contexts';
import '../styles/map.css';

// Icons
const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const getDashboardPath = (role) => {
  switch (role) {
    case 'admin': return '/admin/dashboard';
    case 'mayor': return '/mayor/dashboard';
    case 'township_officer': return '/township/dashboard';
    case 'uc_chairman': return '/official/dashboard';
    default: return '/citizen/dashboard';
  }
};

const getProfilePath = (role) => {
  switch (role) {
    case 'admin': return '/admin/profile';
    case 'mayor': return '/mayor/profile';
    case 'township_officer': return '/township/profile';
    case 'uc_chairman': return '/official/profile';
    default: return '/citizen/profile';
  }
};

const MapPage = () => {
  const { user, isAuthenticated } = useAuth();
  const dashboardPath = getDashboardPath(user?.role);
  const profilePath = getProfilePath(user?.role);

  return (
    <div className="relative h-screen w-full">
      {/* Floating Navigation Panel */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        {/* Back to Dashboard */}
        {isAuthenticated && (
          <Link
            to={dashboardPath}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 text-gray-700 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 group"
          >
            <ArrowLeftIcon />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
        )}

        {/* Profile Link */}
        {isAuthenticated && (
          <Link
            to={profilePath}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 text-gray-700 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 group"
          >
            <UserIcon />
            <span className="text-sm font-medium">Profile</span>
          </Link>
        )}

        {/* Home Link (if not authenticated) */}
        {!isAuthenticated && (
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2.5 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 text-gray-700 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 group"
          >
            <HomeIcon />
            <span className="text-sm font-medium">Home</span>
          </Link>
        )}
      </div>

      {/* User Badge */}
      {isAuthenticated && user && (
        <div className="absolute top-4 right-4 z-[1000] flex items-center gap-3 px-4 py-2.5 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50">
          <div className="w-8 h-8 rounded-full bg-primary/15 text-primary font-semibold flex items-center justify-center text-sm">
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role?.replace('_', ' ')}</p>
          </div>
        </div>
      )}

      {/* Map Component */}
      <CivicLensMap />
    </div>
  );
};

export default MapPage;
