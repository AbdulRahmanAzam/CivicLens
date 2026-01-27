# CivicLens Backend

A comprehensive backend API for the CivicLens citizen complaint management system built with Node.js, Express, and MongoDB.

## Features

- **Complaint Management**: Submit, track, and manage citizen complaints
- **Auto-Classification**: Keyword-based automatic categorization of complaints
- **Severity Scoring**: Intelligent severity calculation based on multiple factors
- **Geospatial Queries**: Location-based search and heatmap data
- **Image Upload**: Support for multiple image uploads via Cloudinary
- **Statistics & Analytics**: Dashboard statistics and trends
- **Duplicate Detection**: Automatic detection of similar complaints

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Image Storage**: Cloudinary
- **Validation**: express-validator
- **File Upload**: Multer
- **Security**: Helmet, CORS

## Getting Started

### Prerequisites

- Node.js v18 or higher
- MongoDB (local or Atlas)
- Cloudinary account (optional, for image uploads)
- Google Maps API key (optional, for reverse geocoding)

### Installation

1. Clone the repository
2. Navigate to the backend directory:
   ```bash
   cd civiclens/backend
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create environment file:
   ```bash
   cp .env.example .env
   ```

5. Update `.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/civiclens
   CORS_ORIGIN=http://localhost:3001
   ```

6. Start the server:
   ```bash
   # Development mode with hot reload
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Complaints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/complaints` | Submit a new complaint |
| GET | `/api/v1/complaints` | Get complaints with filters |
| GET | `/api/v1/complaints/:id` | Get complaint by ID |
| PATCH | `/api/v1/complaints/:id/status` | Update complaint status |
| GET | `/api/v1/complaints/stats` | Get statistics |
| GET | `/api/v1/complaints/heatmap` | Get heatmap data |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/categories` | Get all categories |
| GET | `/api/v1/categories/:name` | Get category by name |
| GET | `/api/v1/categories/stats` | Get category statistics |
| POST | `/api/v1/categories/seed` | Seed default categories |
| POST | `/api/v1/categories/classify` | Classify text to category |

## Query Parameters

### GET /api/v1/complaints

| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20, max: 100) |
| category | string | Filter by category (Roads, Water, Garbage, Electricity, Others) |
| status | string | Filter by status (reported, acknowledged, in_progress, resolved, closed, rejected) |
| area | string | Filter by area |
| ward | string | Filter by ward |
| severity_min | number | Minimum severity (1-10) |
| severity_max | number | Maximum severity (1-10) |
| date_from | ISO date | Filter from date |
| date_to | ISO date | Filter to date |
| lat | number | Latitude for geo-search |
| lng | number | Longitude for geo-search |
| radius | number | Search radius in meters (default: 1000) |
| sort_by | string | Sort field (createdAt, severity, status) |
| sort_order | string | Sort order (asc, desc) |

## Request Examples

### Submit a Complaint

```bash
curl -X POST http://localhost:3000/api/v1/complaints \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Large pothole on main road causing traffic issues",
    "phone": "9876543210",
    "name": "John Doe",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "address": "Main Road, Sector 5"
  }'
```

### Get Complaints Near a Location

```bash
curl "http://localhost:3000/api/v1/complaints?lat=28.6139&lng=77.2090&radius=2000&category=Roads"
```

### Update Complaint Status

```bash
curl -X PATCH http://localhost:3000/api/v1/complaints/CL-20260127-00001/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "acknowledged",
    "remarks": "Complaint received and forwarded to PWD",
    "updatedBy": "supervisor_001"
  }'
```

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files
│   │   ├── db.js       # Database connection
│   │   └── env.js      # Environment variables
│   ├── controllers/    # Request handlers
│   ├── middlewares/    # Express middlewares
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   ├── app.js          # Express app setup
│   └── server.js       # Server entry point
├── .env.example        # Environment template
├── .gitignore
├── package.json
└── README.md
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Error Handling

The API uses a centralized error handling mechanism:

- **400** - Bad Request (validation errors)
- **404** - Not Found
- **500** - Internal Server Error

Error Response Format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "phone",
      "message": "Phone number is required"
    }
  ]
}
```

## License

ISC
