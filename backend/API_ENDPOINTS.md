# CivicLens API Documentation

> **Base URL:** `http://localhost:3000/api/v1`

## Table of Contents

- [Configuration](#configuration)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)
  - [Health & Info](#health--info)
  - [Complaints](#complaints)
  - [Categories](#categories)
  - [Voice](#voice)
- [Data Models](#data-models)
- [Constants & Enums](#constants--enums)
- [Frontend Integration Guide](#frontend-integration-guide)

---

## Configuration

### Environment Variables (Frontend needs to know)

```env
# Backend API URL
VITE_API_URL=http://localhost:3000/api/v1

# For image uploads (Cloudinary URLs will be returned)
# Images are uploaded to Cloudinary and URLs are returned in responses
```

### CORS

The backend accepts requests from: `http://localhost:3001` (configurable via `CORS_ORIGIN`)

---

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Optional success message",
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message",
      "value": "invalid value"
    }
  ]
}
```

### Pagination Response

```json
{
  "success": true,
  "data": {
    "complaints": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalPages": 5,
      "totalItems": 100,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## Error Handling

| Status Code | Description |
|-------------|-------------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request / Validation Error |
| `401` | Unauthorized |
| `403` | Forbidden |
| `404` | Not Found |
| `422` | Unprocessable Entity |
| `500` | Internal Server Error |

---

## Endpoints

---

## Health & Info

### GET `/health`

Check if API is running.

**Response:**
```json
{
  "success": true,
  "message": "CivicLens API is running",
  "timestamp": "2026-01-27T10:00:00.000Z",
  "version": "1.0.0"
}
```

### GET `/`

Get API info and available endpoints.

**Response:**
```json
{
  "success": true,
  "message": "Welcome to CivicLens API",
  "version": "1.0.0",
  "documentation": "/api/v1/docs",
  "endpoints": { ... }
}
```

---

## Complaints

### POST `/complaints`

Submit a new complaint.

**Content-Type:** `multipart/form-data`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | string | ✅ | Complaint description (max 2000 chars) |
| `phone` | string | ✅ | Phone number (10-15 digits) |
| `latitude` | number | ✅ | Latitude (-90 to 90) |
| `longitude` | number | ✅ | Longitude (-180 to 180) |
| `name` | string | ❌ | Citizen name (max 100 chars) |
| `email` | string | ❌ | Email address |
| `address` | string | ❌ | Address (max 500 chars) |
| `source` | string | ❌ | `web` \| `mobile` \| `whatsapp` \| `voice` (default: `web`) |
| `images` | File[] | ❌ | Up to 5 images (JPEG, PNG, WebP, max 5MB each) |

**Example Request (JavaScript/Fetch):**
```javascript
const formData = new FormData();
formData.append('description', 'Large pothole on main road causing accidents');
formData.append('phone', '+923001234567');
formData.append('latitude', '24.8607');
formData.append('longitude', '67.0011');
formData.append('name', 'Ahmed Khan');
formData.append('email', 'ahmed@example.com');
formData.append('address', 'Shahrah-e-Faisal, Karachi');
formData.append('source', 'web');
// Optional: Add images
formData.append('images', imageFile1);
formData.append('images', imageFile2);

const response = await fetch('http://localhost:3000/api/v1/complaints', {
  method: 'POST',
  body: formData
});
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Complaint registered successfully",
  "data": {
    "complaintId": "CL-20260127-00001",
    "category": {
      "primary": "Roads",
      "subcategory": "Pothole",
      "urgency": "high",
      "keywords": ["pothole", "road", "accident"],
      "source": "groq",
      "needsReview": false
    },
    "severity": {
      "score": 7,
      "priority": "high",
      "factors": {
        "frequency": 3,
        "duration": 2,
        "categoryUrgency": 4,
        "areaImpact": 3,
        "citizenUrgency": 2
      }
    },
    "status": "reported",
    "location": {
      "address": "Shahrah-e-Faisal, Karachi",
      "area": "Karachi"
    },
    "duplicateInfo": {
      "isDuplicate": false
    },
    "aiProcessing": {
      "processedAt": "2026-01-27T10:00:00.000Z",
      "classificationTime": 150
    }
  }
}
```

---

### GET `/complaints`

Get all complaints with filters and pagination.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `category` | string | - | Filter by category |
| `status` | string | - | Filter by status |
| `area` | string | - | Filter by area |
| `ward` | string | - | Filter by ward |
| `severity_min` | number | - | Min severity (1-10) |
| `severity_max` | number | - | Max severity (1-10) |
| `date_from` | ISO date | - | Start date filter |
| `date_to` | ISO date | - | End date filter |
| `lat` | number | - | Center latitude for geo search |
| `lng` | number | - | Center longitude for geo search |
| `radius` | number | - | Search radius in meters (100-50000) |
| `sort_by` | string | createdAt | `createdAt` \| `severity` \| `status` |
| `sort_order` | string | desc | `asc` \| `desc` |

**Example Request:**
```javascript
// Get recent complaints in Karachi, category Roads, high severity
const params = new URLSearchParams({
  page: 1,
  limit: 10,
  category: 'Roads',
  severity_min: 7,
  area: 'Karachi',
  sort_by: 'severity',
  sort_order: 'desc'
});

const response = await fetch(`http://localhost:3000/api/v1/complaints?${params}`);
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "complaints": [
      {
        "id": "507f1f77bcf86cd799439011",
        "complaintId": "CL-20260127-00001",
        "description": "Large pothole on main road",
        "category": {
          "primary": "Roads",
          "subcategory": "Pothole",
          "urgency": "high",
          "keywords": ["pothole", "road"],
          "source": "groq",
          "needsReview": false
        },
        "status": "reported",
        "statusHistory": [
          {
            "status": "reported",
            "timestamp": "2026-01-27T10:00:00.000Z",
            "updatedBy": "system",
            "remarks": "Complaint submitted"
          }
        ],
        "severity": {
          "score": 7,
          "priority": "high",
          "factors": { ... }
        },
        "location": {
          "coordinates": [67.0011, 24.8607],
          "address": "Shahrah-e-Faisal",
          "area": "Karachi",
          "ward": "Ward 5",
          "pincode": "75400"
        },
        "citizenInfo": {
          "name": "Ahmed Khan",
          "phone": "+9******67",
          "email": "a****d@example.com"
        },
        "images": [
          { "url": "https://res.cloudinary.com/..." }
        ],
        "source": "web",
        "assignedTo": null,
        "resolution": null,
        "duplicateOf": null,
        "aiProcessing": { ... },
        "createdAt": "2026-01-27T10:00:00.000Z",
        "updatedAt": "2026-01-27T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 5,
      "totalItems": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### GET `/complaints/:id`

Get a single complaint by ID.

**Params:**
- `id` - Complaint ID (either `CL-20260127-00001` format or MongoDB ObjectId)

**Example:**
```javascript
const response = await fetch('http://localhost:3000/api/v1/complaints/CL-20260127-00001');
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "complaintId": "CL-20260127-00001",
    "description": "...",
    "category": { ... },
    "status": "reported",
    "statusHistory": [ ... ],
    "severity": { ... },
    "location": { ... },
    "citizenInfo": { ... },
    "images": [ ... ],
    "source": "web",
    "createdAt": "2026-01-27T10:00:00.000Z",
    "updatedAt": "2026-01-27T10:00:00.000Z"
  }
}
```

---

### PATCH `/complaints/:id/status`

Update complaint status.

**Content-Type:** `application/json`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | ✅ | New status |
| `remarks` | string | ❌ | Update remarks (max 500 chars) |
| `updatedBy` | string | ✅ | Who is updating |

**Valid Status Transitions:**
```
reported → acknowledged, rejected
acknowledged → in_progress, rejected
in_progress → resolved, rejected
resolved → closed
closed → (none)
rejected → (none)
```

**Example:**
```javascript
const response = await fetch('http://localhost:3000/api/v1/complaints/CL-20260127-00001/status', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'acknowledged',
    remarks: 'Complaint received and forwarded to Roads Department',
    updatedBy: 'Officer Ahmed'
  })
});
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Status updated successfully",
  "data": {
    "complaintId": "CL-20260127-00001",
    "currentStatus": "acknowledged",
    "statusHistory": [
      {
        "status": "reported",
        "timestamp": "2026-01-27T10:00:00.000Z",
        "updatedBy": "system",
        "remarks": "Complaint submitted"
      },
      {
        "status": "acknowledged",
        "timestamp": "2026-01-27T11:00:00.000Z",
        "updatedBy": "Officer Ahmed",
        "remarks": "Complaint received and forwarded to Roads Department"
      }
    ]
  }
}
```

---

### GET `/complaints/stats`

Get complaint statistics.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `date_from` | ISO date | Start date |
| `date_to` | ISO date | End date |
| `area` | string | Filter by area |

**Example:**
```javascript
const response = await fetch('http://localhost:3000/api/v1/complaints/stats?area=Karachi');
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalComplaints": 150,
    "byCategory": {
      "Roads": 45,
      "Water": 30,
      "Garbage": 35,
      "Electricity": 25,
      "Others": 15
    },
    "byStatus": {
      "reported": 30,
      "acknowledged": 25,
      "in_progress": 40,
      "resolved": 45,
      "closed": 8,
      "rejected": 2
    },
    "byArea": [
      { "_id": "Karachi", "count": 80 },
      { "_id": "Lahore", "count": 50 },
      { "_id": "Islamabad", "count": 20 }
    ],
    "averageResolutionTime": 48.5,
    "todayCount": 12,
    "weeklyTrend": []
  }
}
```

---

### GET `/complaints/ai-stats`

Get AI classification statistics.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "classification": {
      "totalClassified": 500,
      "bySource": {
        "groq": 350,
        "local": 150
      },
      "cacheHitRate": 0.65,
      "avgConfidence": 0.85
    },
    "duplicates": {
      "totalChecked": 500,
      "duplicatesFound": 45,
      "duplicateRate": 0.09
    },
    "severity": {
      "distribution": {
        "critical": 20,
        "high": 80,
        "medium": 250,
        "low": 150
      },
      "avgScore": 5.2
    }
  }
}
```

---

### GET `/complaints/heatmap`

Get heatmap data for visualization.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `category` | string | - | Filter by category |
| `days` | number | 30 | Number of days (1-365) |

**Example:**
```javascript
const response = await fetch('http://localhost:3000/api/v1/complaints/heatmap?days=7&category=Roads');
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "clusters": [
      {
        "_id": {
          "lng": 67.0,
          "lat": 24.9
        },
        "count": 15,
        "avgSeverity": 6.5,
        "categories": ["Roads", "Water"]
      },
      {
        "_id": {
          "lng": 67.1,
          "lat": 24.8
        },
        "count": 8,
        "avgSeverity": 4.2,
        "categories": ["Garbage"]
      }
    ],
    "count": 2
  }
}
```

---

## Categories

### GET `/categories`

Get all categories.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `active` | boolean | Filter by active status |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "Roads",
        "description": "Road conditions, potholes, traffic issues",
        "icon": "road",
        "color": "#F59E0B",
        "department": "Roads & Infrastructure",
        "priority": 5,
        "slaHours": 72,
        "isActive": true
      },
      {
        "id": "507f1f77bcf86cd799439012",
        "name": "Water",
        "description": "Water supply and drainage issues",
        "icon": "droplet",
        "color": "#3B82F6",
        "department": "Water & Sanitation",
        "priority": 5,
        "slaHours": 48,
        "isActive": true
      },
      {
        "id": "507f1f77bcf86cd799439013",
        "name": "Garbage",
        "description": "Waste collection and cleanliness",
        "icon": "trash",
        "color": "#10B981",
        "department": "Sanitation",
        "priority": 4,
        "slaHours": 24,
        "isActive": true
      },
      {
        "id": "507f1f77bcf86cd799439014",
        "name": "Electricity",
        "description": "Power supply and electrical issues",
        "icon": "zap",
        "color": "#EF4444",
        "department": "Electricity",
        "priority": 5,
        "slaHours": 24,
        "isActive": true
      },
      {
        "id": "507f1f77bcf86cd799439015",
        "name": "Others",
        "description": "Other civic issues",
        "icon": "more-horizontal",
        "color": "#6B7280",
        "department": "General",
        "priority": 3,
        "slaHours": 96,
        "isActive": true
      }
    ],
    "count": 5
  }
}
```

---

### GET `/categories/:name`

Get single category by name.

**Example:**
```javascript
const response = await fetch('http://localhost:3000/api/v1/categories/Roads');
```

---

### POST `/categories/seed`

Seed default categories (admin only).

**Success Response (200):**
```json
{
  "success": true,
  "message": "Default categories seeded successfully",
  "data": {
    "categories": ["Roads", "Water", "Garbage", "Electricity", "Others"],
    "count": 5
  }
}
```

---

### POST `/categories/classify`

Classify text into a category (AI-powered).

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "text": "There is a big pothole on the main road near school"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "category": "Roads",
    "confidence": 85,
    "confidenceLevel": "high"
  }
}
```

---

### GET `/categories/stats`

Get category-wise statistics.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": [
      {
        "category": "Roads",
        "total": 45,
        "resolved": 30,
        "pending": 15,
        "avgSeverity": 6.2,
        "resolutionRate": 66.7,
        "color": "#F59E0B",
        "icon": "road"
      },
      {
        "category": "Water",
        "total": 30,
        "resolved": 25,
        "pending": 5,
        "avgSeverity": 5.8,
        "resolutionRate": 83.3,
        "color": "#3B82F6",
        "icon": "droplet"
      }
    ],
    "totalCategories": 5
  }
}
```

---

## Voice

### GET `/voice/status`

Get speech recognition service status.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "available": true,
    "mode": "simulation",
    "model": "./models/ggml-small.bin",
    "supportedLanguages": [
      { "code": "en", "name": "English" },
      { "code": "hi", "name": "Hindi" },
      { "code": "ur", "name": "Urdu" },
      { "code": "auto", "name": "Auto-detect" }
    ],
    "maxDuration": 30,
    "maxFileSize": 10
  }
}
```

---

### GET `/voice/languages`

Get supported languages for speech recognition.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "languages": [
      { "code": "en", "name": "English" },
      { "code": "hi", "name": "Hindi" },
      { "code": "ur", "name": "Urdu" },
      { "code": "auto", "name": "Auto-detect" }
    ]
  }
}
```

---

### POST `/voice/transcribe`

Transcribe audio to text (without creating complaint).

**Content-Type:** `multipart/form-data`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `audio` | File | ✅ | Audio file (WAV, WebM, OGG, MP3, max 10MB, max 30s) |
| `language` | string | ❌ | `en` \| `hi` \| `ur` \| `auto` (default: `auto`) |

**Example:**
```javascript
const formData = new FormData();
formData.append('audio', audioFile);
formData.append('language', 'auto');

const response = await fetch('http://localhost:3000/api/v1/voice/transcribe', {
  method: 'POST',
  body: formData
});
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "transcript": "There is a big pothole on the main road",
    "language": "en",
    "confidence": 0.92,
    "duration": 5.2,
    "processingTime": 1500,
    "simulation": true
  }
}
```

---

### POST `/voice/complaint`

Submit a voice complaint (audio is transcribed and complaint is created).

**Content-Type:** `multipart/form-data`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `audio` | File | ✅ | Audio file |
| `phone` | string | ✅ | Phone number |
| `latitude` | number | ✅ | Latitude |
| `longitude` | number | ✅ | Longitude |
| `name` | string | ❌ | Citizen name |
| `email` | string | ❌ | Email |
| `address` | string | ❌ | Address |
| `language` | string | ❌ | `en` \| `hi` \| `ur` \| `auto` |

**Example:**
```javascript
const formData = new FormData();
formData.append('audio', audioFile);
formData.append('phone', '+923001234567');
formData.append('latitude', '24.8607');
formData.append('longitude', '67.0011');
formData.append('language', 'auto');

const response = await fetch('http://localhost:3000/api/v1/voice/complaint', {
  method: 'POST',
  body: formData
});
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Complaint registered successfully",
  "data": {
    "complaintId": "CL-20260127-00002",
    "transcription": {
      "text": "There is a big pothole on the main road near school",
      "language": "en",
      "confidence": 0.92,
      "duration": 5.2
    },
    "category": {
      "primary": "Roads",
      "subcategory": "Pothole",
      "urgency": "high"
    },
    "severity": {
      "score": 7,
      "priority": "high"
    },
    "status": "reported",
    "location": {
      "address": "Generated address",
      "area": "Karachi"
    },
    "duplicateInfo": {
      "isDuplicate": false
    }
  }
}
```

---

## Data Models

### Complaint Object

```typescript
interface Complaint {
  id: string;                    // MongoDB ObjectId
  complaintId: string;           // Format: CL-YYYYMMDD-NNNNN
  description: string;           // Complaint text
  category: {
    primary: Category;           // 'Roads' | 'Water' | 'Garbage' | 'Electricity' | 'Others'
    subcategory: string | null;
    urgency: Urgency;            // 'low' | 'medium' | 'high' | 'critical'
    keywords: string[];
    source: ClassificationSource; // 'groq' | 'local' | 'manual' | 'default'
    needsReview: boolean;
  };
  status: Status;                // Current status
  statusHistory: StatusHistory[];
  severity: {
    score: number;               // 1-10
    priority: Priority;          // 'low' | 'medium' | 'high' | 'critical'
    factors: SeverityFactors;
  };
  location: {
    coordinates: [number, number]; // [longitude, latitude]
    address: string;
    area: string;
    ward: string;
    pincode: string;
  };
  citizenInfo: {
    name: string;
    phone: string;               // Masked for privacy
    email: string;               // Masked for privacy
  };
  images: Array<{ url: string }>;
  source: Source;                // 'web' | 'mobile' | 'whatsapp' | 'voice'
  assignedTo: string | null;
  resolution: Resolution | null;
  duplicateOf: string | null;
  aiProcessing: AIProcessing | null;
  createdAt: string;             // ISO date
  updatedAt: string;             // ISO date
}
```

### Status History

```typescript
interface StatusHistory {
  status: Status;
  timestamp: string;
  updatedBy: string;
  remarks: string;
}
```

### Severity Factors

```typescript
interface SeverityFactors {
  frequency: number;      // How common in area (0-10)
  duration: number;       // How long existing (0-10)
  categoryUrgency: number; // Category base urgency (0-10)
  areaImpact: number;     // Impact on area (0-10)
  citizenUrgency: number; // Citizen-reported urgency (0-10)
}
```

---

## Constants & Enums

### Categories

```javascript
const CATEGORIES = ['Roads', 'Water', 'Garbage', 'Electricity', 'Others'];
```

### Status

```javascript
const STATUS = ['reported', 'acknowledged', 'in_progress', 'resolved', 'closed', 'rejected'];
```

### Priority / Urgency

```javascript
const PRIORITY = ['low', 'medium', 'high', 'critical'];
```

### Source

```javascript
const SOURCE = ['web', 'mobile', 'whatsapp', 'voice'];
```

### Severity Score Mapping

| Score | Priority |
|-------|----------|
| 1-3 | low |
| 4-5 | medium |
| 6-7 | high |
| 8-10 | critical |

---

## Frontend Integration Guide

### 1. Setup Axios Instance

```javascript
// src/api/client.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';
    return Promise.reject({ message, errors: error.response?.data?.errors });
  }
);

export default apiClient;
```

### 2. API Service Functions

```javascript
// src/api/complaints.js
import apiClient from './client';

export const complaintsAPI = {
  // Submit complaint
  create: async (formData) => {
    return apiClient.post('/complaints', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Get complaints list
  getAll: async (params = {}) => {
    return apiClient.get('/complaints', { params });
  },

  // Get single complaint
  getById: async (id) => {
    return apiClient.get(`/complaints/${id}`);
  },

  // Update status
  updateStatus: async (id, data) => {
    return apiClient.patch(`/complaints/${id}/status`, data);
  },

  // Get stats
  getStats: async (params = {}) => {
    return apiClient.get('/complaints/stats', { params });
  },

  // Get heatmap data
  getHeatmap: async (params = {}) => {
    return apiClient.get('/complaints/heatmap', { params });
  },

  // Get AI stats
  getAIStats: async () => {
    return apiClient.get('/complaints/ai-stats');
  },
};
```

```javascript
// src/api/categories.js
import apiClient from './client';

export const categoriesAPI = {
  getAll: async (active = true) => {
    return apiClient.get('/categories', { params: { active } });
  },

  getByName: async (name) => {
    return apiClient.get(`/categories/${name}`);
  },

  classify: async (text) => {
    return apiClient.post('/categories/classify', { text });
  },

  getStats: async () => {
    return apiClient.get('/categories/stats');
  },

  seed: async () => {
    return apiClient.post('/categories/seed');
  },
};
```

```javascript
// src/api/voice.js
import apiClient from './client';

export const voiceAPI = {
  getStatus: async () => {
    return apiClient.get('/voice/status');
  },

  getLanguages: async () => {
    return apiClient.get('/voice/languages');
  },

  transcribe: async (audioFile, language = 'auto') => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('language', language);
    return apiClient.post('/voice/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  submitComplaint: async (formData) => {
    return apiClient.post('/voice/complaint', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};
```

### 3. React Hook Example

```javascript
// src/hooks/useComplaints.js
import { useState, useEffect } from 'react';
import { complaintsAPI } from '../api/complaints';

export const useComplaints = (initialFilters = {}) => {
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchComplaints = async (filters = initialFilters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await complaintsAPI.getAll(filters);
      setComplaints(response.data.complaints);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  return { complaints, pagination, loading, error, refetch: fetchComplaints };
};
```

### 4. Form Submission Example

```jsx
// src/components/ComplaintForm.jsx
import { useState } from 'react';
import { complaintsAPI } from '../api/complaints';

const ComplaintForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.target);

    try {
      const response = await complaintsAPI.create(formData);
      setSuccess(`Complaint registered! ID: ${response.data.complaintId}`);
    } catch (err) {
      setError(err.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea name="description" required placeholder="Describe your complaint..." />
      <input name="phone" type="tel" required placeholder="Phone number" />
      <input name="latitude" type="hidden" value="24.8607" />
      <input name="longitude" type="hidden" value="67.0011" />
      <input name="images" type="file" accept="image/*" multiple />
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Complaint'}
      </button>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
    </form>
  );
};
```

### 5. Map Integration (Heatmap)

```jsx
// Using React Leaflet for heatmap
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import { useEffect, useState } from 'react';
import { complaintsAPI } from '../api/complaints';

const ComplaintHeatmap = () => {
  const [clusters, setClusters] = useState([]);

  useEffect(() => {
    const fetchHeatmap = async () => {
      const response = await complaintsAPI.getHeatmap({ days: 30 });
      setClusters(response.data.clusters);
    };
    fetchHeatmap();
  }, []);

  return (
    <MapContainer center={[24.8607, 67.0011]} zoom={12}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {clusters.map((cluster, index) => (
        <Circle
          key={index}
          center={[cluster._id.lat, cluster._id.lng]}
          radius={cluster.count * 50}
          color={cluster.avgSeverity > 6 ? 'red' : cluster.avgSeverity > 4 ? 'orange' : 'green'}
        >
          <Popup>
            <strong>Complaints: {cluster.count}</strong><br />
            Avg Severity: {cluster.avgSeverity.toFixed(1)}
          </Popup>
        </Circle>
      ))}
    </MapContainer>
  );
};
```

### 6. Voice Recording Integration

```jsx
// src/components/VoiceComplaint.jsx
import { useState, useRef } from 'react';
import { voiceAPI } from '../api/voice';

const VoiceComplaint = () => {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcript, setTranscript] = useState('');
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    chunks.current = [];

    mediaRecorder.current.ondataavailable = (e) => chunks.current.push(e.data);
    mediaRecorder.current.onstop = () => {
      const blob = new Blob(chunks.current, { type: 'audio/webm' });
      setAudioBlob(blob);
    };

    mediaRecorder.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.current.stop();
    setRecording(false);
  };

  const transcribeAudio = async () => {
    const response = await voiceAPI.transcribe(audioBlob);
    setTranscript(response.data.transcript);
  };

  return (
    <div>
      <button onClick={recording ? stopRecording : startRecording}>
        {recording ? '🔴 Stop Recording' : '🎤 Start Recording'}
      </button>
      {audioBlob && <button onClick={transcribeAudio}>Transcribe</button>}
      {transcript && <p>Transcript: {transcript}</p>}
    </div>
  );
};
```

---

## Testing API Endpoints

### Using cURL

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Get complaints
curl "http://localhost:3000/api/v1/complaints?page=1&limit=10"

# Submit complaint (form-data)
curl -X POST http://localhost:3000/api/v1/complaints \
  -F "description=Test complaint" \
  -F "phone=+923001234567" \
  -F "latitude=24.8607" \
  -F "longitude=67.0011"

# Classify text
curl -X POST http://localhost:3000/api/v1/categories/classify \
  -H "Content-Type: application/json" \
  -d '{"text": "pothole on road"}'
```

### Using Postman

Import collection from: `POST http://localhost:3000/api/v1/` to see all endpoints.

---

## Notes for Frontend Developers

1. **Phone numbers** are masked in responses (e.g., `+9******67`) for privacy
2. **Email addresses** are masked in responses (e.g., `a****d@example.com`)
3. **Images** are uploaded to Cloudinary - URLs are returned in responses
4. **Location coordinates** are `[longitude, latitude]` (GeoJSON format)
5. **Complaint IDs** follow format: `CL-YYYYMMDD-NNNNN`
6. **All dates** are ISO 8601 format
7. **AI Classification** happens automatically on complaint creation
8. **Duplicate detection** happens automatically (200m radius, 7 days)
9. **Severity** is calculated automatically (1-10 score)

---

**API Version:** 1.0.0  
**Last Updated:** January 27, 2026
