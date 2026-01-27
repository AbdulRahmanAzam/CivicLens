# CivicLens API Testing Guide

Base URL: `http://localhost:3000/api/v1`

## Health Check

### API Health
```
GET /health
```

### API Info
```
GET /
```

## Authentication

### Register User
```
POST /auth/register
```
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "confirmPassword": "Password123",
  "phone": "03001234567"
}
```

### Login
```
POST /auth/login
```
```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

### Refresh Token
```
POST /auth/refresh-token
```
```json
{
  "refreshToken": "your_refresh_token"
}
```

### Logout
```
POST /auth/logout
Authorization: Bearer YOUR_TOKEN
```

### Logout All Sessions
```
POST /auth/logout-all
Authorization: Bearer YOUR_TOKEN
```

### Get Profile
```
GET /auth/me
Authorization: Bearer YOUR_TOKEN
```

### Update Profile
```
PATCH /auth/me
Authorization: Bearer YOUR_TOKEN
```
```json
{
  "name": "John Updated",
  "phone": "03009876543"
}
```

### Change Password
```
PATCH /auth/change-password
Authorization: Bearer YOUR_TOKEN
```
```json
{
  "currentPassword": "Password123",
  "newPassword": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

### Forgot Password
```
POST /auth/forgot-password
```
```json
{
  "email": "john@example.com"
}
```

### Reset Password
```
POST /auth/reset-password/RESET_TOKEN
```
```json
{
  "password": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

### Verify Email
```
GET /auth/verify-email/VERIFICATION_TOKEN
```

### Resend Verification
```
POST /auth/resend-verification
Authorization: Bearer YOUR_TOKEN
```

### Delete Account
```
DELETE /auth/me
Authorization: Bearer YOUR_TOKEN
```
```json
{
  "password": "Password123"
}
```

### Admin: Get All Users
```
GET /auth/users
Authorization: Bearer YOUR_TOKEN (admin)
```

### Admin: Get User by ID
```
GET /auth/users/USER_ID
Authorization: Bearer YOUR_TOKEN (admin)
```

### Admin: Create User
```
POST /auth/users
Authorization: Bearer YOUR_TOKEN (admin)
```
```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "Password123",
  "role": "admin"
}
```

### Admin: Update User
```
PATCH /auth/users/USER_ID
Authorization: Bearer YOUR_TOKEN (admin)
```
```json
{
  "name": "Updated Name",
  "role": "citizen"
}
```

### Admin: Delete User
```
DELETE /auth/users/USER_ID
Authorization: Bearer YOUR_TOKEN (admin)
```

## Complaints

### Get My Complaints
```
GET /complaints/my
Authorization: Bearer YOUR_TOKEN
```

### Get AI Stats
```
GET /complaints/ai-stats
```

### Get SLA Breaches
```
GET /complaints/sla-breaches
Authorization: Bearer YOUR_TOKEN (uc_chairman+)
```

### Create Complaint
```
POST /complaints
Content-Type: multipart/form-data (if uploading images) or application/json
```
```json
{
  "description": "Large pothole on main road",
  "phone": "03001234567",
  "name": "John Doe",
  "latitude": 33.6844,
  "longitude": 73.0479,
  "address": "Main Road, Sector 5",
  "category": "Roads",
  "ucId": "UC_ID_OPTIONAL",
  "townId": "TOWN_ID_OPTIONAL",
  "cityId": "CITY_ID_OPTIONAL"
}
```

### Get Complaints
```
GET /complaints?page=1&limit=10&category=Roads&status=submitted
Authorization: Bearer YOUR_TOKEN (optional)
```

### Get Complaint by ID
```
GET /complaints/CL-20260127-00001
```

### Update Status
```
PATCH /complaints/CL-20260127-00001/status
Authorization: Bearer YOUR_TOKEN
```
```json
{
  "status": "acknowledged",
  "remarks": "Complaint received and forwarded to PWD",
  "estimatedResolution": "2026-02-01T10:00:00Z"
}
```

### Submit Citizen Feedback
```
POST /complaints/CL-20260127-00001/feedback
Authorization: Bearer YOUR_TOKEN (citizen)
```
```json
{
  "rating": 4,
  "comment": "Issue was resolved quickly",
  "satisfaction": "satisfied"
}
```

### Get Stats
```
GET /complaints/stats
```

### Get Heatmap
```
GET /complaints/heatmap?lat=33.6844&lng=73.0479&radius=2000
```

### Get Global Heatmap
```
GET /complaints/heatmap/global?severity_min=5
```

### Get Profile Heatmap
```
GET /complaints/heatmap/profile/ENTITY_ID
```

## Categories

### Get Categories
```
GET /categories
```

### Get Category by Name
```
GET /categories/Roads
```

### Classify Text
```
POST /categories/classify
```
```json
{
  "text": "Garbage overflow near main market"
}
```

### Get Category Stats
```
GET /categories/stats
```

### Seed Categories (Admin)
```
POST /categories/seed
Authorization: Bearer YOUR_TOKEN (admin)
```

## Voice

### Get Voice Status
```
GET /voice/status
```

### Get Supported Languages
```
GET /voice/languages
```

### Submit Voice Complaint
```
POST /voice/complaint
Content-Type: multipart/form-data
Authorization: Bearer YOUR_TOKEN (optional)
```
Form data:
- `audio`: audio file (required)
- `phone`: "03001234567" (required)
- `name`: "John Doe" (required)
- `latitude`: 33.6844 (required)
- `longitude`: 73.0479 (required)
- `address`: "Main Road" (optional)
- `email`: "john@example.com" (optional)
- `language`: "en" (optional)

### Transcribe Audio Only
```
POST /voice/transcribe
Content-Type: multipart/form-data
```
Form data:
- `audio`: audio file (required)
- `language`: "en" (optional)

## Hierarchy

### Get Full Tree
```
GET /hierarchy/tree
Authorization: Bearer YOUR_TOKEN
```

### Find UC by Location
```
POST /hierarchy/find-uc
Authorization: Bearer YOUR_TOKEN
```
```json
{
  "latitude": 33.6844,
  "longitude": 73.0479
}
```

### Get Nearby UCs
```
POST /hierarchy/nearby-ucs
Authorization: Bearer YOUR_TOKEN
```
```json
{
  "latitude": 33.6844,
  "longitude": 73.0479,
  "maxDistance": 5000
}
```

### Get Hierarchy Stats
```
GET /hierarchy/stats
Authorization: Bearer YOUR_TOKEN (website_admin/mayor)
```

### Get All Cities
```
GET /hierarchy/cities
Authorization: Bearer YOUR_TOKEN
```

### Create City
```
POST /hierarchy/cities
Authorization: Bearer YOUR_TOKEN (website_admin)
```
```json
{
  "name": "Islamabad",
  "code": "ISB",
  "province": "Islamabad Capital Territory",
  "center": {
    "type": "Point",
    "coordinates": [73.0479, 33.6844]
  },
  "population": 1000000
}
```

### Get City Details
```
GET /hierarchy/cities/CITY_ID
Authorization: Bearer YOUR_TOKEN
```

### Update City
```
PUT /hierarchy/cities/CITY_ID
Authorization: Bearer YOUR_TOKEN (website_admin)
```
```json
{
  "name": "Updated City Name",
  "population": 1200000
}
```

### Deactivate City
```
DELETE /hierarchy/cities/CITY_ID
Authorization: Bearer YOUR_TOKEN (website_admin)
```

### Get Towns in City
```
GET /hierarchy/cities/CITY_ID/towns
Authorization: Bearer YOUR_TOKEN
```

### Create Town
```
POST /hierarchy/cities/CITY_ID/towns
Authorization: Bearer YOUR_TOKEN (website_admin/mayor)
```
```json
{
  "name": "Sector E-11",
  "code": "E11",
  "center": {
    "type": "Point",
    "coordinates": [73.0479, 33.6844]
  },
  "population": 50000
}
```

### Get Town Details
```
GET /hierarchy/towns/TOWN_ID
Authorization: Bearer YOUR_TOKEN
```

### Update Town
```
PUT /hierarchy/towns/TOWN_ID
Authorization: Bearer YOUR_TOKEN (website_admin/mayor)
```
```json
{
  "name": "Updated Town Name",
  "population": 60000
}
```

### Deactivate Town
```
DELETE /hierarchy/towns/TOWN_ID
Authorization: Bearer YOUR_TOKEN (website_admin/mayor)
```

### Get UCs in Town
```
GET /hierarchy/towns/TOWN_ID/ucs
Authorization: Bearer YOUR_TOKEN
```

### Create UC
```
POST /hierarchy/towns/TOWN_ID/ucs
Authorization: Bearer YOUR_TOKEN (website_admin/mayor/town_chairman)
```
```json
{
  "name": "UC-1",
  "ucNumber": 1,
  "center": {
    "type": "Point",
    "coordinates": [73.0479, 33.6844]
  },
  "boundary": {
    "type": "Polygon",
    "coordinates": [[[73.0, 33.6], [73.1, 33.6], [73.1, 33.7], [73.0, 33.7], [73.0, 33.6]]]
  },
  "population": 5000,
  "area": 2.5,
  "contact": {
    "phone": "051-1234567",
    "email": "uc1@city.gov.pk",
    "address": "UC Office, Main Road"
  }
}
```

### Get UC Details
```
GET /hierarchy/ucs/UC_ID
Authorization: Bearer YOUR_TOKEN
```

### Update UC
```
PUT /hierarchy/ucs/UC_ID
Authorization: Bearer YOUR_TOKEN (website_admin/mayor/town_chairman)
```
```json
{
  "name": "Updated UC Name",
  "population": 5500
}
```

### Deactivate UC
```
DELETE /hierarchy/ucs/UC_ID
Authorization: Bearer YOUR_TOKEN (website_admin/mayor/town_chairman)
```

## Invitations

### Get Pending Invitations
```
GET /invitations
Authorization: Bearer YOUR_TOKEN (website_admin/mayor/town_chairman)
```

### Create Invitation
```
POST /invitations
Authorization: Bearer YOUR_TOKEN (website_admin/mayor/town_chairman)
```
```json
{
  "email": "chairman@example.com",
  "role": "uc_chairman",
  "targetEntityId": "UC_ID"
}
```

### Get Invitation Details
```
GET /invitations/INVITATION_ID
Authorization: Bearer YOUR_TOKEN (website_admin/mayor/town_chairman)
```

### Revoke Invitation
```
DELETE /invitations/INVITATION_ID
Authorization: Bearer YOUR_TOKEN (website_admin/mayor/town_chairman)
```

### Resend Invitation
```
POST /invitations/INVITATION_ID/resend
Authorization: Bearer YOUR_TOKEN (website_admin/mayor/town_chairman)
```

### Validate Token (Public)
```
GET /invitations/validate/INVITATION_TOKEN
```

### Accept Invitation (Public)
```
POST /invitations/accept
```
```json
{
  "token": "INVITATION_TOKEN",
  "name": "UC Chairman",
  "email": "chairman@example.com",
  "password": "Password123",
  "nic": "1234567890123"
}
```

### Get Invitation Stats
```
GET /invitations/stats
Authorization: Bearer YOUR_TOKEN (website_admin)
```

### Cleanup Expired Invitations
```
POST /invitations/cleanup
Authorization: Bearer YOUR_TOKEN (website_admin)
```

## Analytics

### System Analytics
```
GET /analytics/system
Authorization: Bearer YOUR_TOKEN (website_admin)
```

### SLA Performance Report
```
GET /analytics/sla-performance
Authorization: Bearer YOUR_TOKEN (town_chairman+)
```

### City Analytics
```
GET /analytics/city/CITY_ID
Authorization: Bearer YOUR_TOKEN (mayor+)
```

### Town Analytics
```
GET /analytics/town/TOWN_ID
Authorization: Bearer YOUR_TOKEN (town_chairman+)
```

### UC Analytics
```
GET /analytics/uc/UC_ID
Authorization: Bearer YOUR_TOKEN (uc_chairman+)
```

## Common Query Parameters

### Complaints Filtering
- `page=1` - Page number
- `limit=20` - Items per page (max 100)
- `category=Roads` - Filter by category
- `status=submitted` - Filter by status
- `severity_min=5` - Minimum severity (1-10)
- `severity_max=8` - Maximum severity (1-10)
- `area=Sector 5` - Filter by area
- `ward=Ward 3` - Filter by ward
- `date_from=2026-01-01` - Filter from date (ISO format)
- `date_to=2026-01-31` - Filter to date (ISO format)
- `lat=33.6844&lng=73.0479&radius=1000` - Location filter (meters)
- `sort_by=createdAt` - Sort field (createdAt, severity, status)
- `sort_order=desc` - Sort order (asc, desc)

### Hierarchy Filtering
- `active=true` - Only active entities
- `populated=true` - Include population data
- `stats=true` - Include statistics

### Status Values
- `submitted` - Initial state
- `acknowledged` - Confirmed by admin
- `in_progress` - Work started
- `resolved` - Fixed
- `closed` - Completed
- `citizen_feedback` - Citizen provided feedback
- `rejected` - Invalid complaint

### Category Values
- `Roads` - Road infrastructure issues
- `Water` - Water supply/drainage
- `Garbage` - Waste management
- `Electricity` - Power/electrical issues
- `Others` - Other municipal issues

### Role Values
- `citizen` - Regular user
- `uc_chairman` - UC Chairman
- `town_chairman` - Town Chairman
- `mayor` - City Mayor
- `website_admin` - System administrator

### Severity Levels
- `1-3` - Low priority
- `4-6` - Medium priority
- `7-8` - High priority
- `9-10` - Critical/Emergency

### SLA Hours (by Category)
- `Roads`: 72 hours
- `Water`: 48 hours
- `Garbage`: 24 hours
- `Electricity`: 48 hours
- `Others`: 72 hours

### File Upload Requirements
- **Images**: JPG, PNG, WebP (max 5MB each, max 5 files)
- **Audio**: MP3, WAV, M4A, OGG (max 10MB, max 30 seconds for voice)

### Response Format
All responses follow this structure:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```