# EcoThonn Backend - Soil Scan System Documentation

## Overview

This document describes the complete implementation of the soil scan storage and analytics system for EcoThonn.

## Folder Structure

```
backend/app/
├── __init__.py
├── main.py                          # FastAPI app entry point with inference endpoint
├── api/
│   └── v1/
│       ├── __init__.py              # Router aggregator
│       └── endpoints/
│           ├── __init__.py
│           ├── users.py             # User endpoints
│           └── soil_scans.py        # Soil scan endpoints
├── models/
│   ├── __init__.py
│   └── soil_scan.py                 # Pydantic schemas for soil scans
├── services/
│   ├── __init__.py
│   └── soil_scan_service.py         # Business logic for soil scans
├── db/
│   ├── __init__.py
│   └── database.py                  # MongoDB connection
└── SoilClassification.pth           # Pre-trained PyTorch model
```

## Database Collections

### soil_scans Collection

```javascript
db.soil_scans.insertOne({
  _id: ObjectId("..."),
  user_id: "user123",
  image_url: "s3://bucket/scan_001.jpg",
  soil_type: "Black_Soil",
  confidence_score: 92.5,
  ph_range: "7.2 - 8.5",
  npk_values: {
    nitrogen: "Low",
    phosphorus: "Low",
    potassium: "High",
  },
  health_status: "good",
  quality_score: 85.2,
  recommendations: ["Add nitrogen-rich fertilizer", "Maintain moisture levels"],
  suggested_crops: ["Cotton", "Sugarcane"],
  fertilizer_recommendation: "NPK 10-26-26",
  location: {
    latitude: 28.7041,
    longitude: 77.1025,
  },
  field_name: "North Field",
  notes: "Soil appears well-draining",
  created_at: ISODate("2026-05-25T10:30:00Z"),
  updated_at: ISODate("2026-05-25T10:30:00Z"),
});
```

### Indexes (Recommended)

```javascript
// Create indexes for better query performance
db.soil_scans.createIndex({ user_id: 1, created_at: -1 });
db.soil_scans.createIndex({ user_id: 1, soil_type: 1 });
db.soil_scans.createIndex({ created_at: 1 });
db.soil_scans.createIndex({ user_id: 1 });
```

## API Endpoints

### 1. Save Soil Scan Result

**POST** `/api/v1/soil-scan/save`

Saves a new soil scan result to the database.

**Request Body:**

```json
{
  "user_id": "user123",
  "image_url": "s3://bucket/scan_001.jpg",
  "soil_type": "Black_Soil",
  "confidence_score": 92.5,
  "ph_range": "7.2 - 8.5",
  "npk_values": {
    "nitrogen": "Low",
    "phosphorus": "Low",
    "potassium": "High"
  },
  "health_status": "good",
  "quality_score": 85.2,
  "recommendations": [
    "Add nitrogen-rich fertilizer",
    "Maintain moisture levels"
  ],
  "suggested_crops": ["Cotton", "Sugarcane"],
  "fertilizer_recommendation": "NPK 10-26-26",
  "field_name": "North Field",
  "location": {
    "latitude": 28.7041,
    "longitude": 77.1025
  },
  "notes": "Soil appears well-draining"
}
```

**Response (201 Created):**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "user_id": "user123",
  "image_url": "s3://bucket/scan_001.jpg",
  "soil_type": "Black_Soil",
  "confidence_score": 92.5,
  "ph_range": "7.2 - 8.5",
  "npk_values": {
    "nitrogen": "Low",
    "phosphorus": "Low",
    "potassium": "High"
  },
  "health_status": "good",
  "quality_score": 85.2,
  "recommendations": [
    "Add nitrogen-rich fertilizer",
    "Maintain moisture levels"
  ],
  "suggested_crops": ["Cotton", "Sugarcane"],
  "fertilizer_recommendation": "NPK 10-26-26",
  "location": { "latitude": 28.7041, "longitude": 77.1025 },
  "field_name": "North Field",
  "notes": "Soil appears well-draining",
  "created_at": "2026-05-25T10:30:00",
  "updated_at": "2026-05-25T10:30:00"
}
```

---

### 2. Get Scan History (with Pagination)

**GET** `/api/v1/soil-scan/history/{user_id}`

Retrieve all soil scans for a user with pagination.

**Query Parameters:**

- `skip`: Number of records to skip (default: 0)
- `limit`: Number of records to return (default: 50, max: 100)
- `sort_by`: Field to sort by (default: created_at)
- `order`: Sort order: -1 (descending) or 1 (ascending)

**Example Request:**

```
GET /api/v1/soil-scan/history/user123?skip=0&limit=10&sort_by=created_at&order=-1
```

**Response (200 OK):**

```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "user_id": "user123",
    "soil_type": "Black_Soil",
    "confidence_score": 92.5,
    "health_status": "good",
    "created_at": "2026-05-25T10:30:00",
    ...
  },
  ...
]
```

---

### 3. Get Recent Scans (Homepage)

**GET** `/api/v1/soil-scan/recent/{user_id}`

Get recent scans for the homepage "Field Collection" section.

**Query Parameters:**

- `limit`: Number of recent scans to return (default: 10, max: 50)

**Example Request:**

```
GET /api/v1/soil-scan/recent/user123?limit=5
```

**Response (200 OK):**

```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "user_id": "user123",
    "soil_type": "Black_Soil",
    "confidence_score": 92.5,
    "health_status": "good",
    "quality_score": 85.2,
    "field_name": "North Field",
    "image_url": "s3://bucket/scan_001.jpg",
    "recommendations": ["Add nitrogen-rich fertilizer"],
    "created_at": "2026-05-25T10:30:00"
  },
  ...
]
```

---

### 4. Get Analytics Data

**GET** `/api/v1/soil-scan/analytics/{user_id}`

Get aggregated analytics for a user (dashboards, charts).

**Example Request:**

```
GET /api/v1/soil-scan/analytics/user123
```

**Response (200 OK):**

```json
{
  "total_scans": 42,
  "scans_this_month": 12,
  "scans_this_week": 3,
  "soil_type_distribution": {
    "Black_Soil": 18,
    "Red_Soil": 15,
    "Alluvial_Soil": 9
  },
  "health_distribution": {
    "good": 28,
    "fair": 10,
    "excellent": 4
  },
  "average_confidence": 87.34,
  "average_quality_score": 82.1,
  "most_common_soil_type": "Black_Soil",
  "most_common_health_status": "good",
  "recent_scans": [
    {
      "id": "507f1f77bcf86cd799439011",
      "soil_type": "Black_Soil",
      "confidence_score": 92.5,
      "created_at": "2026-05-25T10:30:00",
      ...
    }
  ],
  "scan_history_by_date": {
    "2026-05-20": 2,
    "2026-05-21": 1,
    "2026-05-22": 3,
    "2026-05-23": 0,
    "2026-05-24": 1,
    "2026-05-25": 2
  }
}
```

---

### 5. Update Soil Scan

**PUT** `/api/v1/soil-scan/{scan_id}`

Update an existing soil scan record.

**Request Body (all fields optional):**

```json
{
  "health_status": "excellent",
  "quality_score": 90.0,
  "recommendations": ["Updated recommendation"],
  "notes": "Updated notes"
}
```

**Response (200 OK):**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "user_id": "user123",
  "health_status": "excellent",
  "quality_score": 90.0,
  "updated_at": "2026-05-25T11:45:00",
  ...
}
```

---

### 6. Delete Soil Scan

**DELETE** `/api/v1/soil-scan/{scan_id}`

Delete a soil scan record.

**Response (204 No Content)**

---

### 7. Get Scan Count

**GET** `/api/v1/soil-scan/count/{user_id}`

Get total count of scans for a user.

**Response (200 OK):**

```json
{
  "user_id": "user123",
  "total_scans": 42
}
```

---

## Integration with Inference Endpoint

The inference endpoint now supports automatic saving to the database:

**POST** `/infer?user_id=user123&field_name=North Field`

```bash
curl -X POST "http://localhost:8000/infer?user_id=user123&field_name=North%20Field" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@soil_image.jpg"
```

**Response:**

```json
{
  "prediction": "Black_Soil",
  "confidence_score": 92.5,
  "props": {
    "pH_range": "7.2 - 8.5 (Neutral to Alkaline)",
    "Nitrogen_N": "Low",
    "Phosphorus_P": "Low",
    "Potassium_K": "High (Also rich in Calcium and Magnesium)"
  },
  "success": true,
  "low_confidence": false,
  "scan_id": "507f1f77bcf86cd799439011",
  "saved": true
}
```

## Data Models

### SoilHealthStatus Enum

- `excellent` - Soil is in excellent condition
- `good` - Soil is in good condition
- `fair` - Soil has moderate conditions
- `poor` - Soil needs improvement
- `degraded` - Soil is significantly degraded

### SoilType Enum

- `Alluvial_Soil`
- `Arid_Soil`
- `Black_Soil`
- `Laterite_Soil`
- `Mountain_Soil`
- `Red_Soil`
- `Yellow_Soil`

## Frontend Integration Examples

### Saving a Scan (After Inference)

```typescript
// After user uploads image and model processes it
const response = await fetch("/api/v1/soil-scan/save", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    user_id: currentUser.id,
    soil_type: inferenceResult.prediction,
    confidence_score: inferenceResult.confidence_score,
    health_status: "good",
    // ... other fields
  }),
});
```

### Loading Recent Scans (Homepage)

```typescript
const recentScans = await fetch(`/api/v1/soil-scan/recent/${userId}`).then(
  (r) => r.json(),
);

// Use for Field Collection card display
recentScans.forEach((scan) => {
  console.log(`${scan.field_name}: ${scan.soil_type} (${scan.health_status})`);
});
```

### Loading Analytics (Analytics Page)

```typescript
const analytics = await fetch(`/api/v1/soil-scan/analytics/${userId}`).then(
  (r) => r.json(),
);

// Total scans
console.log(`Total scans: ${analytics.total_scans}`);

// For pie chart - soil type distribution
const soilChart = analytics.soil_type_distribution;

// For line chart - scan history by date
const trendData = Object.entries(analytics.scan_history_by_date).map(
  ([date, count]) => ({
    date,
    scans: count,
  }),
);

// For bar chart - health distribution
const healthChart = analytics.health_distribution;
```

## Backend Architecture Best Practices

### 1. Service Layer

- `SoilScanService` handles all database operations
- Centralized business logic
- Easy to test and maintain

### 2. Pydantic Models

- Separate models for Create, Update, and Response
- Built-in validation
- Clear API contracts

### 3. Async Operations

- All database operations use `async/await`
- Non-blocking I/O for better performance
- Suitable for high-concurrency scenarios

### 4. Error Handling

- Proper HTTP status codes
- Meaningful error messages
- Try-catch blocks in critical sections

### 5. Database Optimization

- Indexed queries for fast lookups
- Pagination support for large datasets
- Aggregation for analytics calculations

### 6. CORS Support

- Configured for cross-origin requests
- Suitable for mobile and web frontends

## Scalability Considerations

### Current Implementation

- In-memory aggregation for analytics
- Suitable for < 100k scans per user

### For Higher Scale

1. **Use MongoDB Aggregation Pipeline**

   ```python
   # Instead of loading all scans into memory
   async def get_user_analytics_aggregated(self, user_id: str):
       pipeline = [
           {"$match": {"user_id": user_id}},
           {"$group": {
               "_id": "$soil_type",
               "count": {"$sum": 1}
           }},
           {"$sort": {"count": -1}}
       ]
       return await self.collection.aggregate(pipeline).to_list(None)
   ```

2. **Add Caching Layer**
   - Cache analytics results (5-15 minute TTL)
   - Use Redis for session management

3. **Add Rate Limiting**
   - Prevent API abuse
   - Use FastAPI-Limiter

4. **Async Task Queue**
   - Process heavy aggregations async (Celery)
   - Send notifications asynchronously

## Testing

### Unit Test Example

```python
import pytest
from app.services.soil_scan_service import SoilScanService
from app.models.soil_scan import SoilScanCreate

@pytest.mark.asyncio
async def test_create_soil_scan(db):
    service = SoilScanService(db)
    scan_data = SoilScanCreate(
        user_id="test_user",
        soil_type="Black_Soil",
        confidence_score=90.0,
        health_status="good"
    )
    result = await service.create_soil_scan(scan_data)
    assert result.user_id == "test_user"
    assert result.soil_type == "Black_Soil"
```

## Monitoring & Logging

### Add Logging

```python
import logging

logger = logging.getLogger(__name__)

@router.post("/save")
async def save_soil_scan(scan_data: SoilScanCreate, service: SoilScanService = Depends(...)):
    logger.info(f"Saving scan for user: {scan_data.user_id}")
    try:
        result = await service.create_soil_scan(scan_data)
        logger.info(f"Scan saved successfully: {result.id}")
        return result
    except Exception as e:
        logger.error(f"Failed to save scan: {str(e)}", exc_info=True)
        raise
```

## Environment Variables

Add to your `.env` file:

```env
# MongoDB connection string
MONGODB_URL=mongodb+srv://user:password@cluster.mongodb.net/
DATABASE_NAME=ecothonn_db

# Optional: S3 for image storage
AWS_BUCKET=ecothonn-scans
AWS_REGION=ap-south-1
```

## Summary

This implementation provides:
✅ Complete CRUD operations for soil scans
✅ Aggregated analytics and reporting
✅ User-specific data isolation
✅ Scalable architecture
✅ Clean API contracts
✅ Database optimization with indexing
✅ Error handling and validation
✅ CORS support for mobile/web clients
