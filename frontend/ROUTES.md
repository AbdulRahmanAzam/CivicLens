# CivicLens Routes Documentation

This document describes all available routes in the CivicLens application.

## Public Routes (No Authentication Required)

### Landing & Information Pages
- **`/`** - Landing Page
  - Main homepage with hero, features, how it works, target users, and CTA sections
  
- **`/about`** - About Page
  - Information about CivicLens platform, mission, and features
  
- **`/contact`** - Contact Page
  - Contact form and contact information
  
- **`/privacy`** - Privacy Policy Page
  - Privacy policy and data protection information
  
- **`/terms`** - Terms of Service Page
  - Terms and conditions for using CivicLens

### Map & Location
- **`/map`** - Map Page
  - Full-page map view with complaint heatmap and markers (public access)
  
- **`/share-location`** - Share Location Page
  - WhatsApp location sharing interface

## Authentication Routes (Public Only - Redirect if Logged In)

### Citizen Authentication
- **`/login`** - Citizen Login
- **`/register`** - Citizen Registration

### Official Authentication
- **`/official/login`** - Government Official Login

### Admin Authentication
- **`/sudo/admin`** - Admin Login (Secret route - not linked in UI)

## Protected Routes (Login Required)

### Citizen Portal (`/citizen/*`)
All routes use MainLayout with sidebar and navbar.

- **`/citizen/dashboard`** - Citizen Dashboard
  - Report issues, provide feedback, view stats
  
- **`/citizen/report`** - Report Issue Page
  - Form to submit new civic complaints
  
- **`/citizen/complaints`** - My Complaints Page
  - List of user's submitted complaints with search/filter
  
- **`/citizen/complaints/:id`** - Complaint Detail Page
  - Full detail view of a specific complaint
  
- **`/citizen/profile`** - Profile Page
  - Edit profile information, upload avatar, change password
  
- **`/citizen/settings`** - Settings Page
  - Notification preferences, privacy settings, account management
  
- **`/citizen/notifications`** - Notifications Page
  - View and manage notifications

### Official Portal (`/official/*`)
Available to Township Officers, UC Chairmen, and other government officials.
All routes use MainLayout.

- **`/official/dashboard`** - Official Dashboard
  - Overview stats, quick actions, recent complaints
  
- **`/official/complaints`** - Manage Complaints Page
  - Filterable list of all complaints, status updates
  
- **`/official/complaints/:id`** - Complaint Detail Page
  - Full detail view with management actions
  
- **`/official/territory`** - Territory Page
  - Map view with complaint visualization for their territory
  
- **`/official/profile`** - Profile Page
  - Edit official profile information

### Mayor Portal (`/mayor/*`)
Available to Mayor role.
All routes use MainLayout.

- **`/mayor/dashboard`** - Mayor Dashboard
  - City-wide overview and analytics
  
- **`/mayor/complaints`** - Manage Complaints Page
  - View and manage all city complaints
  
- **`/mayor/map`** - Territory Map
  - City-wide map with complaint visualization

### Admin Portal (`/admin/*`)
Available to System Administrators.
All routes use MainLayout.

- **`/admin/dashboard`** - Admin Dashboard
  - System-wide statistics and management
  
- **`/admin/users`** - Manage Users Page
  - User management (create, edit, delete, toggle status)
  
- **`/admin/territories`** - Manage Territories Page
  - Territory CRUD (create, edit, delete territories)
  
- **`/admin/categories`** - Manage Categories Page
  - Complaint category management

## Legacy Routes (Redirects)

- **`/township/dashboard`** → `/official/dashboard`
  - Legacy route for Township Officers
  
- **`/uc/dashboard`** → `/official/dashboard`
  - Legacy route for UC Chairmen

## Error Pages

- **`/unauthorized`** - 403 Unauthorized
  - Shown when user tries to access a route they don't have permission for
  
- **`*`** - 404 Not Found
  - Catch-all route for non-existent pages

## Route Guards

### PublicOnlyRoute
- Redirects to user's dashboard if already logged in
- Used for login/register pages

### CitizenRoute
- Requires `citizen` role
- Redirects to `/unauthorized` if not authorized

### OfficialRoute
- Requires `township_officer` or `uc_chairman` role
- Redirects to `/unauthorized` if not authorized

### MayorRoute
- Requires `mayor` role
- Redirects to `/unauthorized` if not authorized

### TownshipRoute
- Requires `township_officer` role
- Legacy guard, currently only used for redirects

### UCChairmanRoute
- Requires `uc_chairman` role
- Legacy guard, currently only used for redirects

### AdminRoute
- Requires `admin` role
- Redirects to `/unauthorized` if not authorized

## Navigation Structure

All dashboard routes (`/citizen/*`, `/official/*`, `/mayor/*`, `/admin/*`) use the **MainLayout** component which includes:
- Responsive sidebar with role-based navigation
- Top navbar with notifications and user menu
- Breadcrumb/page title
- Main content area with `<Outlet />` for nested routes

## Notes

- All protected routes automatically redirect to `/login` if user is not authenticated
- Dashboard routes are nested within their respective role-based parent routes
- The app uses React Router v6 with nested routing
- All public pages include Navbar and Footer from landing components
