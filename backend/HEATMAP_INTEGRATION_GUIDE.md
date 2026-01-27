# Dual Heatmap System - Frontend Integration Guide

## Overview
CivicLens implements a **dual heatmap system** using **Leaflet.js** and **OpenStreetMap** tiles (100% free, no API keys required). This guide covers both backend APIs and frontend implementation.

### Heatmap Types

1. **Global Heatmap** (`/heatmap/global`)
   - **Purpose**: Show all civic problems across the city
   - **Color Gradient**: Red (high problems) → Orange → Green (low problems)
   - **Weighting**: Frequency × Severity Score
   - **Use Case**: Public dashboard, city-wide problem visualization

2. **Profile Heatmap** (`/heatmap/profile/:entityId`)
   - **Purpose**: Show organizational/community impact (resolved complaints only)
   - **Color Gradient**: Red (high impact) → Yellow (low impact)
   - **Weighting**: Number of resolved complaints
   - **Use Case**: Organization profiles, impact reporting

---

## Backend APIs

### 1. Global Heatmap API

**Endpoint**: `GET /api/v1/complaints/heatmap/global`

**Query Parameters**:
| Parameter   | Type   | Default | Description                              |
|-------------|--------|---------|------------------------------------------|
| `category`  | String | all     | Filter by category (e.g., "roads")       |
| `days`      | Number | 30      | Lookback period in days                  |
| `precision` | Number | 3       | Decimal precision (3=~111m, 4=~11m)      |

**Example Request**:
```bash
curl "http://localhost:5000/api/v1/complaints/heatmap/global?days=90&category=sanitation"
```

**Response**:
```json
{
  "success": true,
  "message": "Global heatmap data retrieved successfully",
  "data": {
    "type": "global",
    "filters": {
      "category": "sanitation",
      "days": 90,
      "precision": 3
    },
    "clusters": [
      {
        "lat": 28.613,
        "lng": 77.209,
        "count": 15,
        "avgSeverity": 7.3,
        "maxSeverity": 9,
        "primaryCategory": "sanitation",
        "intensity": 10.95
      }
    ],
    "count": 42,
    "totalIntensity": 123.45
  }
}
```

**Data Fields**:
- `lat`, `lng`: Cluster center coordinates
- `count`: Number of complaints in this cluster
- `avgSeverity`: Average severity score (1-10)
- `maxSeverity`: Highest severity in cluster
- `intensity`: Weighted score (count × avgSeverity / 10)
- `primaryCategory`: Most common category in cluster

---

### 2. Profile Heatmap API

**Endpoint**: `GET /api/v1/complaints/heatmap/profile/:entityId`

**Path Parameters**:
- `entityId` (required): Organization/community ID (e.g., "MCD_SOUTH", "DELHI_POLICE")

**Query Parameters**:
| Parameter   | Type   | Default | Description                         |
|-------------|--------|---------|-------------------------------------|
| `days`      | Number | 365     | Lookback period (default 1 year)    |
| `precision` | Number | 3       | Decimal precision                   |

**Example Request**:
```bash
curl "http://localhost:5000/api/v1/complaints/heatmap/profile/MCD_SOUTH?days=180"
```

**Response**:
```json
{
  "success": true,
  "message": "Profile heatmap data retrieved successfully",
  "data": {
    "type": "profile",
    "entityId": "MCD_SOUTH",
    "totalResolved": 127,
    "filters": {
      "days": 180,
      "precision": 3
    },
    "clusters": [
      {
        "lat": 28.524,
        "lng": 77.185,
        "count": 23,
        "avgResolutionTime": 4.2,
        "primaryCategory": "roads",
        "intensity": 4.6
      }
    ],
    "count": 18
  }
}
```

**Data Fields**:
- `lat`, `lng`: Cluster center coordinates
- `count`: Number of resolved complaints
- `avgResolutionTime`: Average resolution time in days
- `intensity`: Impact score (count / 5)
- `totalResolved`: Total complaints resolved by entity

---

## Frontend Implementation (Leaflet.js)

### Installation

```bash
npm install leaflet leaflet.heat
```

### HTML Setup

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    #map { height: 600px; width: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"></script>
</body>
</html>
```

---

### Example 1: Global Heatmap (Red/Green Gradient)

```javascript
// Initialize map centered on Delhi
const map = L.map('map').setView([28.6139, 77.2090], 11);

// Add OpenStreetMap tile layer (FREE!)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19
}).addTo(map);

// Fetch global heatmap data
async function loadGlobalHeatmap() {
  const response = await fetch(
    'http://localhost:5000/api/v1/complaints/heatmap/global?days=30'
  );
  const { data } = await response.json();

  // Convert clusters to heatmap points [lat, lng, intensity]
  const heatPoints = data.clusters.map(cluster => [
    cluster.lat,
    cluster.lng,
    cluster.intensity
  ]);

  // Create heatmap layer with red/green gradient
  const heatLayer = L.heatLayer(heatPoints, {
    radius: 25,
    blur: 15,
    maxZoom: 13,
    gradient: {
      0.0: 'green',   // Low problems
      0.5: 'yellow',
      0.7: 'orange',
      1.0: 'red'      // High problems
    }
  }).addTo(map);

  // Add markers for high-severity clusters
  data.clusters
    .filter(c => c.avgSeverity >= 7)
    .forEach(cluster => {
      L.circleMarker([cluster.lat, cluster.lng], {
        radius: 8,
        fillColor: '#d32f2f',
        color: '#fff',
        weight: 2,
        fillOpacity: 0.7
      })
      .bindPopup(`
        <strong>${cluster.count} complaints</strong><br>
        Avg Severity: ${cluster.avgSeverity.toFixed(1)}/10<br>
        Category: ${cluster.primaryCategory}
      `)
      .addTo(map);
    });
}

loadGlobalHeatmap();
```

---

### Example 2: Profile Heatmap (Yellow/Red Gradient)

```javascript
const map = L.map('map').setView([28.6139, 77.2090], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

async function loadProfileHeatmap(entityId) {
  const response = await fetch(
    `http://localhost:5000/api/v1/complaints/heatmap/profile/${entityId}?days=365`
  );
  const { data } = await response.json();

  // Display total resolved count
  document.getElementById('totalResolved').innerText = data.totalResolved;

  // Convert to heatmap points
  const heatPoints = data.clusters.map(cluster => [
    cluster.lat,
    cluster.lng,
    cluster.intensity
  ]);

  // Create heatmap with yellow/red gradient
  const heatLayer = L.heatLayer(heatPoints, {
    radius: 20,
    blur: 10,
    maxZoom: 13,
    gradient: {
      0.0: '#fff59d',  // Light yellow (low impact)
      0.5: '#ff9800',  // Orange
      1.0: '#d32f2f'   // Red (high impact)
    }
  }).addTo(map);

  // Add markers with resolution stats
  data.clusters.forEach(cluster => {
    L.marker([cluster.lat, cluster.lng], {
      icon: L.divIcon({
        className: 'impact-marker',
        html: `<div style="background:#ff9800;color:white;padding:5px;border-radius:50%;width:30px;height:30px;text-align:center;">${cluster.count}</div>`
      })
    })
    .bindPopup(`
      <strong>${cluster.count} Resolved</strong><br>
      Avg Resolution: ${cluster.avgResolutionTime.toFixed(1)} days<br>
      Category: ${cluster.primaryCategory}
    `)
    .addTo(map);
  });
}

// Load heatmap for specific organization
loadProfileHeatmap('MCD_SOUTH');
```

---

### Example 3: Dual Heatmap Toggle

```html
<div id="map"></div>
<div style="position:absolute;top:10px;right:10px;z-index:1000;background:white;padding:10px;border-radius:5px;">
  <button onclick="switchHeatmap('global')">Global Problems</button>
  <button onclick="switchHeatmap('profile')">My Impact</button>
</div>
```

```javascript
let currentLayer = null;

async function switchHeatmap(type) {
  // Remove existing heatmap
  if (currentLayer) {
    map.removeLayer(currentLayer);
  }

  if (type === 'global') {
    const res = await fetch('http://localhost:5000/api/v1/complaints/heatmap/global');
    const { data } = await res.json();
    
    const points = data.clusters.map(c => [c.lat, c.lng, c.intensity]);
    currentLayer = L.heatLayer(points, {
      gradient: { 0.0: 'green', 0.5: 'yellow', 1.0: 'red' },
      radius: 25
    }).addTo(map);

  } else if (type === 'profile') {
    const entityId = 'MCD_SOUTH'; // Replace with actual entity ID
    const res = await fetch(`http://localhost:5000/api/v1/complaints/heatmap/profile/${entityId}`);
    const { data } = await res.json();
    
    const points = data.clusters.map(c => [c.lat, c.lng, c.intensity]);
    currentLayer = L.heatLayer(points, {
      gradient: { 0.0: '#fff59d', 1.0: '#d32f2f' },
      radius: 20
    }).addTo(map);
  }
}

// Default to global view
switchHeatmap('global');
```

---

## Advanced Features

### 1. Real-time Clustering

For better performance with large datasets, use Leaflet.markercluster:

```bash
npm install leaflet.markercluster
```

```javascript
const markers = L.markerClusterGroup();

data.clusters.forEach(cluster => {
  const marker = L.marker([cluster.lat, cluster.lng])
    .bindPopup(`${cluster.count} complaints`);
  markers.addLayer(marker);
});

map.addLayer(markers);
```

---

### 2. Custom Tooltips with Chart.js

```javascript
L.marker([cluster.lat, cluster.lng])
  .bindPopup(`
    <canvas id="chart-${cluster.lat}-${cluster.lng}"></canvas>
    <script>
      new Chart(document.getElementById('chart-${cluster.lat}-${cluster.lng}'), {
        type: 'doughnut',
        data: {
          labels: ['Resolved', 'Pending'],
          datasets: [{
            data: [${cluster.resolvedCount}, ${cluster.pendingCount}]
          }]
        }
      });
    </script>
  `)
  .addTo(map);
```

---

### 3. Export Heatmap as Image

```javascript
import leafletImage from 'leaflet-image';

leafletImage(map, function(err, canvas) {
  const img = document.createElement('img');
  img.src = canvas.toDataURL();
  document.body.appendChild(img);
});
```

---

## Best Practices

1. **Precision Tuning**:
   - Use `precision=3` (111m clusters) for city-wide views
   - Use `precision=4` (11m clusters) for neighborhood-level analysis

2. **Performance**:
   - Limit `days` parameter to avoid loading excessive data
   - Use `category` filter for domain-specific heatmaps
   - Cache API responses client-side

3. **Color Gradients**:
   - **Never mix** global and profile gradients (confuses users)
   - Global: Green (low) → Red (high)
   - Profile: Yellow (low impact) → Red (high impact)

4. **Mobile Optimization**:
   - Reduce `radius` and `blur` for mobile screens
   - Use touch-friendly popup controls

---

## OpenStreetMap Alternatives (Free)

If OpenStreetMap is slow, use these free alternatives:

1. **CartoDB Light**:
```javascript
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png')
```

2. **Stamen Toner** (High contrast):
```javascript
L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png')
```

3. **Humanitarian OSM**:
```javascript
L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png')
```

---

## Testing Endpoints

### Test Global Heatmap
```bash
curl "http://localhost:5000/api/v1/complaints/heatmap/global?days=7" | jq
```

### Test Profile Heatmap
```bash
curl "http://localhost:5000/api/v1/complaints/heatmap/profile/MCD_SOUTH" | jq
```

### Check Response Time
```bash
time curl "http://localhost:5000/api/v1/complaints/heatmap/global?days=90"
```

---

## Database Indexes (Already Configured)

The following MongoDB indexes optimize heatmap queries:

```javascript
// Geospatial queries
{ "location.coordinates": "2dsphere" }

// Profile heatmap filtering
{ "resolution.resolvedBy": 1, "status.current": 1 }

// Time-based filtering
{ "createdAt": 1 }
```

---

## Error Handling

```javascript
async function loadHeatmap(entityId) {
  try {
    const response = await fetch(`/api/v1/complaints/heatmap/profile/${entityId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const { data } = await response.json();
    
    if (!data.clusters || data.clusters.length === 0) {
      console.warn('No heatmap data available');
      return;
    }
    
    renderHeatmap(data.clusters);
    
  } catch (error) {
    console.error('Failed to load heatmap:', error);
    alert('Unable to load heatmap data. Please try again.');
  }
}
```

---

## Next Steps

1. **Implement React Component**: See [REACT_HEATMAP_EXAMPLE.md](#) for React integration
2. **Add Filters UI**: Category dropdown, date range picker
3. **Real-time Updates**: Use WebSockets to update heatmap live
4. **Export Reports**: Generate PDF reports with embedded heatmap screenshots

---

## Support

For issues or questions:
- Check [API_ENDPOINTS.md](./API_ENDPOINTS.md) for full API reference
- Review MongoDB aggregation pipelines in `complaintService.js`
- Test endpoints with Postman collection (coming soon)

---

**Built with ❤️ using 100% free and open-source tools**
