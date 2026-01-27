# Backend Routing Corrections Required

This document outlines the backend changes needed to fully support the CivicLens frontend. These changes should be implemented in the backend codebase.

---

## 🔴 Critical - Missing Endpoint

### 1. Territories API Routes

The frontend expects territory endpoints for UC/Town boundary data that don't exist in the backend.

**Required Route File:** `backend/src/routes/territoryRoutes.js`

```javascript
const express = require('express');
const router = express.Router();

// GET /api/v1/territories - Get territory boundaries
// Query params: level (UC|Town), city, town
router.get('/', async (req, res) => {
  // Return GeoJSON FeatureCollection of territory boundaries
  // Filter by level, city, town
});

// GET /api/v1/territories/ucs - Get list of all UCs
router.get('/ucs', async (req, res) => {
  // Return array of { id, name, town, city } objects
});

// GET /api/v1/territories/towns - Get list of all Towns
router.get('/towns', async (req, res) => {
  // Return array of { id, name, city } objects
});

module.exports = router;
```

**Register in `backend/src/app.js`:**
```javascript
const territoryRoutes = require('./routes/territoryRoutes');
app.use('/api/v1/territories', territoryRoutes);
```

**Required Model:** `backend/src/models/Territory.js`
```javascript
const mongoose = require('mongoose');

const territorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  level: { type: String, enum: ['UC', 'Town', 'District', 'City'], required: true },
  city: { type: String, default: 'Karachi' },
  town: { type: String }, // For UCs, their parent town
  boundaries: {
    type: { type: String, enum: ['Polygon', 'MultiPolygon'], default: 'Polygon' },
    coordinates: { type: Array, required: true }
  },
  properties: {
    uc_id: String,
    population: Number,
    area_sqkm: Number,
  }
}, { timestamps: true });

territorySchema.index({ boundaries: '2dsphere' });
territorySchema.index({ level: 1, city: 1 });

module.exports = mongoose.model('Territory', territorySchema);
```

---

## 🟡 Important - Auth Response Format

### 2. Standardize Auth API Responses

The frontend expects specific response formats from auth endpoints:

**Login Response Format:**
```json
{
  "success": true,
  "accessToken": "jwt_token_here",
  "refreshToken": "refresh_token_here",
  "user": {
    "_id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "citizen|uc_chairman|township_officer|mayor|admin",
    "phone": "+923001234567",
    "jurisdiction": {
      "uc_id": "UC-001",
      "town": "Gulshan",
      "city": "Karachi"
    }
  }
}
```

**Role Values Expected by Frontend:**
- `citizen` - Regular citizens filing complaints
- `uc_chairman` - Union Council Chairman
- `township_officer` - Township/Town level officer
- `mayor` - City Mayor
- `admin` - System administrator

Ensure the User model and auth controller use these exact role values.

---

## 🟡 Important - User Jurisdiction

### 3. Add Jurisdiction to User Model

For officials (UC Chairman, Township Officer, Mayor), the frontend needs jurisdiction data:

**Add to User Schema:**
```javascript
jurisdiction: {
  uc_id: { type: String },      // For UC Chairman
  uc_name: { type: String },
  town: { type: String },        // For Township Officer
  city: { type: String },        // For Mayor
}
```

This allows filtering complaints by the official's jurisdiction.

---

## 🟢 Optional - Enhance Complaint Filtering

### 4. Additional Complaint Query Parameters

The frontend sends these filters that should be supported:

```javascript
// In complaintController.js - getComplaints
const {
  category,
  severity_min,
  severity_max,
  status,
  uc_id,
  town,
  date_from,
  date_to,
  sw_lat, sw_lng, ne_lat, ne_lng, // Bounding box
  page,
  limit,
  sort
} = req.query;

// Build query with all filters
const query = {};

if (category) query['category.primary'] = category;
if (status) query.status = status;
if (uc_id) query['location.uc_id'] = uc_id;
if (town) query['location.town'] = town;

// Severity range
if (severity_min || severity_max) {
  query.severity = {};
  if (severity_min) query.severity.$gte = parseInt(severity_min);
  if (severity_max) query.severity.$lte = parseInt(severity_max);
}

// Date range
if (date_from || date_to) {
  query.createdAt = {};
  if (date_from) query.createdAt.$gte = new Date(date_from);
  if (date_to) query.createdAt.$lte = new Date(date_to);
}

// Geo bounding box
if (sw_lat && sw_lng && ne_lat && ne_lng) {
  query['location.coordinates'] = {
    $geoWithin: {
      $box: [
        [parseFloat(sw_lng), parseFloat(sw_lat)],
        [parseFloat(ne_lng), parseFloat(ne_lat)]
      ]
    }
  };
}
```

---

## 🟢 Optional - Heatmap Filters

### 5. Support Filters in Heatmap Endpoint

The `/complaints/heatmap` endpoint should support the same filters as the main complaints endpoint for consistent data:

```javascript
// GET /api/v1/complaints/heatmap
// Support: category, severity_min, status, bounding box
```

---

## 📋 Checklist

- [ ] Create Territory model and schema
- [ ] Create territoryRoutes.js
- [ ] Register territory routes in app.js
- [ ] Seed territory data for Karachi (UCs and Towns with GeoJSON boundaries)
- [ ] Verify auth response includes role field
- [ ] Add jurisdiction field to User model for officials
- [ ] Ensure complaint filtering supports all documented parameters
- [ ] Add CORS configuration for frontend domain

---

## 🔧 Environment Variables

Ensure these are set in backend `.env`:

```env
# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173

# JWT Configuration
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

---

## 📌 CORS Configuration

In `backend/src/app.js`:

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```
