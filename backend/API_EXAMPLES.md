# EcoThonn Backend - API Examples & Curl Commands

## Quick Start Examples

### 1. Test Database Connection

```bash
curl -X GET "http://localhost:8000/api/v1/users/test-connection"
```

---

### 2. Perform Image Inference & Save Results

#### Option A: Inference Only (No Database Save)

```bash
curl -X POST "http://localhost:8000/infer" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/soil_image.jpg"
```

#### Option B: Inference + Auto-Save to Database

```bash
curl -X POST "http://localhost:8000/infer?user_id=user123&field_name=North%20Field" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/soil_image.jpg"
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

---

### 3. Save Soil Scan Result (Manual)

```bash
curl -X POST "http://localhost:8000/api/v1/soil-scan/save" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "image_url": "s3://ecothonn-scans/2026-05-25/scan_001.jpg",
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
      "Maintain optimal soil moisture",
      "Consider crop rotation"
    ],
    "suggested_crops": ["Cotton", "Sugarcane", "Maize"],
    "fertilizer_recommendation": "NPK 10-26-26",
    "field_name": "North Field Plot A",
    "location": {
      "latitude": 28.7041,
      "longitude": 77.1025
    },
    "notes": "Soil appears well-draining, good organic matter"
  }'
```

**Success Response (201):**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "user_id": "user123",
  "image_url": "s3://ecothonn-scans/2026-05-25/scan_001.jpg",
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
    "Maintain optimal soil moisture",
    "Consider crop rotation"
  ],
  "suggested_crops": ["Cotton", "Sugarcane", "Maize"],
  "fertilizer_recommendation": "NPK 10-26-26",
  "location": { "latitude": 28.7041, "longitude": 77.1025 },
  "field_name": "North Field Plot A",
  "notes": "Soil appears well-draining, good organic matter",
  "created_at": "2026-05-25T10:30:00",
  "updated_at": "2026-05-25T10:30:00"
}
```

---

### 4. Retrieve Specific Scan

```bash
curl -X GET "http://localhost:8000/api/v1/soil-scan/507f1f77bcf86cd799439011"
```

---

### 5. Get User's Scan History (With Pagination)

#### Get First 10 Scans

```bash
curl -X GET "http://localhost:8000/api/v1/soil-scan/history/user123?skip=0&limit=10"
```

#### Get Next 10 Scans

```bash
curl -X GET "http://localhost:8000/api/v1/soil-scan/history/user123?skip=10&limit=10"
```

#### Sort by Confidence Score (Descending)

```bash
curl -X GET "http://localhost:8000/api/v1/soil-scan/history/user123?sort_by=confidence_score&order=-1"
```

#### Sort by Soil Type (Ascending)

```bash
curl -X GET "http://localhost:8000/api/v1/soil-scan/history/user123?sort_by=soil_type&order=1"
```

**Response:**

```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "user_id": "user123",
    "image_url": "s3://ecothonn-scans/2026-05-25/scan_001.jpg",
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
    "recommendations": ["Add nitrogen-rich fertilizer"],
    "suggested_crops": ["Cotton", "Sugarcane"],
    "fertilizer_recommendation": "NPK 10-26-26",
    "location": {"latitude": 28.7041, "longitude": 77.1025},
    "field_name": "North Field Plot A",
    "notes": "Soil appears well-draining",
    "created_at": "2026-05-25T10:30:00",
    "updated_at": "2026-05-25T10:30:00"
  },
  ...
]
```

---

### 6. Get Recent Scans (For Homepage)

#### Get 5 Most Recent Scans

```bash
curl -X GET "http://localhost:8000/api/v1/soil-scan/recent/user123?limit=5"
```

#### Get 10 Most Recent Scans

```bash
curl -X GET "http://localhost:8000/api/v1/soil-scan/recent/user123?limit=10"
```

**Response:** (Same format as scan history)

---

### 7. Get User Analytics

```bash
curl -X GET "http://localhost:8000/api/v1/soil-scan/analytics/user123"
```

**Response:**

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
      "user_id": "user123",
      "soil_type": "Black_Soil",
      "confidence_score": 92.5,
      "health_status": "good",
      "quality_score": 85.2,
      "field_name": "North Field Plot A",
      "image_url": "s3://ecothonn-scans/2026-05-25/scan_001.jpg",
      "recommendations": ["Add nitrogen-rich fertilizer"],
      "created_at": "2026-05-25T10:30:00",
      "updated_at": "2026-05-25T10:30:00"
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

### 8. Get Total Scan Count

```bash
curl -X GET "http://localhost:8000/api/v1/soil-scan/count/user123"
```

**Response:**

```json
{
  "user_id": "user123",
  "total_scans": 42
}
```

---

### 9. Update Soil Scan

#### Update Health Status and Notes

```bash
curl -X PUT "http://localhost:8000/api/v1/soil-scan/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -d '{
    "health_status": "excellent",
    "notes": "Updated after treatment",
    "recommendations": ["Maintain current management", "Monitor pH levels"]
  }'
```

#### Update Quality Score

```bash
curl -X PUT "http://localhost:8000/api/v1/soil-scan/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -d '{
    "quality_score": 90.5
  }'
```

**Response (200 OK):**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "user_id": "user123",
  "health_status": "excellent",
  "quality_score": 90.5,
  "notes": "Updated after treatment",
  "recommendations": ["Maintain current management"],
  "updated_at": "2026-05-25T11:45:00",
  ...
}
```

---

### 10. Delete Soil Scan

```bash
curl -X DELETE "http://localhost:8000/api/v1/soil-scan/507f1f77bcf86cd799439011"
```

**Response:**

```
HTTP 204 No Content
```

---

## JavaScript/TypeScript Examples

### React Component - Save Scan After Inference

```typescript
async function saveInferenceResult(
  userId: string,
  inferenceData: any,
  fieldName?: string,
) {
  try {
    const response = await fetch("/api/v1/soil-scan/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        soil_type: inferenceData.prediction,
        confidence_score: inferenceData.confidence_score,
        ph_range: inferenceData.props.pH_range,
        npk_values: {
          nitrogen: inferenceData.props.Nitrogen_N,
          phosphorus: inferenceData.props.Phosphorus_P,
          potassium: inferenceData.props.Potassium_K,
        },
        health_status: "good", // Determined by your logic
        quality_score: inferenceData.confidence_score * 0.95,
        recommendations: generateRecommendations(inferenceData),
        field_name: fieldName,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save scan: ${response.statusText}`);
    }

    const savedScan = await response.json();
    console.log("Scan saved:", savedScan);
    return savedScan;
  } catch (error) {
    console.error("Error saving scan:", error);
    throw error;
  }
}
```

### React Component - Display Recent Scans

```typescript
import React, { useEffect, useState } from 'react';

interface SoilScan {
  id: string;
  field_name: string;
  soil_type: string;
  health_status: string;
  confidence_score: number;
  image_url: string;
  created_at: string;
}

export function FieldCollection({ userId }: { userId: string }) {
  const [recentScans, setRecentScans] = useState<SoilScan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentScans();
  }, [userId]);

  async function fetchRecentScans() {
    try {
      const response = await fetch(`/api/v1/soil-scan/recent/${userId}?limit=5`);
      const data = await response.json();
      setRecentScans(data);
    } catch (error) {
      console.error('Error fetching recent scans:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="field-collection">
      <h2>Field Collection</h2>
      <div className="scan-grid">
        {recentScans.map((scan) => (
          <div key={scan.id} className="scan-card">
            <img src={scan.image_url} alt={scan.field_name} />
            <h3>{scan.field_name}</h3>
            <p>Soil Type: {scan.soil_type}</p>
            <p>Health: {scan.health_status}</p>
            <p>Confidence: {scan.confidence_score}%</p>
            <p className="date">
              {new Date(scan.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### React Component - Analytics Dashboard

```typescript
import React, { useEffect, useState } from 'react';
import { PieChart, LineChart, BarChart } from 'chart-library';

interface Analytics {
  total_scans: number;
  scans_this_month: number;
  scans_this_week: number;
  soil_type_distribution: Record<string, number>;
  health_distribution: Record<string, number>;
  average_confidence: number;
  average_quality_score: number;
  scan_history_by_date: Record<string, number>;
}

export function AnalyticsDashboard({ userId }: { userId: string }) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [userId]);

  async function fetchAnalytics() {
    try {
      const response = await fetch(`/api/v1/soil-scan/analytics/${userId}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  }

  if (!analytics) return <div>Loading analytics...</div>;

  return (
    <div className="analytics-dashboard">
      <div className="stats">
        <div className="stat-card">
          <h3>Total Scans</h3>
          <p className="value">{analytics.total_scans}</p>
        </div>
        <div className="stat-card">
          <h3>This Month</h3>
          <p className="value">{analytics.scans_this_month}</p>
        </div>
        <div className="stat-card">
          <h3>Average Confidence</h3>
          <p className="value">{analytics.average_confidence.toFixed(1)}%</p>
        </div>
        <div className="stat-card">
          <h3>Avg Quality Score</h3>
          <p className="value">{analytics.average_quality_score.toFixed(1)}</p>
        </div>
      </div>

      <div className="charts">
        <div className="chart">
          <h3>Soil Type Distribution</h3>
          <PieChart data={analytics.soil_type_distribution} />
        </div>
        <div className="chart">
          <h3>Health Status</h3>
          <BarChart data={analytics.health_distribution} />
        </div>
        <div className="chart">
          <h3>Scans Over Time</h3>
          <LineChart data={analytics.scan_history_by_date} />
        </div>
      </div>
    </div>
  );
}
```

---

## Error Handling Examples

### Bad Request (Missing Required Field)

```bash
curl -X POST "http://localhost:8000/api/v1/soil-scan/save" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user123"}'
```

**Response (422 Unprocessable Entity):**

```json
{
  "detail": [
    {
      "loc": ["body", "soil_type"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### Not Found

```bash
curl -X GET "http://localhost:8000/api/v1/soil-scan/invalid_id"
```

**Response (404 Not Found):**

```json
{
  "detail": "Soil scan not found"
}
```

### Invalid Confidence Score

```bash
curl -X POST "http://localhost:8000/api/v1/soil-scan/save" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "soil_type": "Black_Soil",
    "confidence_score": 150,
    "health_status": "good"
  }'
```

**Response (422 Unprocessable Entity):**

```json
{
  "detail": [
    {
      "loc": ["body", "confidence_score"],
      "msg": "ensure this value is less than or equal to 100",
      "type": "value_error.number.not_le"
    }
  ]
}
```

---

## Testing with PostmanCollection

Import this into Postman for easy testing:

```json
{
  "info": {
    "name": "EcoThonn Soil Scan API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Save Soil Scan",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/v1/soil-scan/save",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": {
          "mode": "raw",
          "raw": "{\"user_id\": \"user123\", \"soil_type\": \"Black_Soil\", \"confidence_score\": 92.5, \"health_status\": \"good\"}"
        }
      }
    }
  ]
}
```

---

## Common Issues & Solutions

### Issue: 404 Not Found on `/api/v1/soil-scan/...`

**Solution:** Make sure the API routes are included in `main.py`:

```python
from app.api.v1 import api_router
app.include_router(api_router)
```

### Issue: MongoDB connection error

**Solution:** Check `.env` file for correct `MONGODB_URL`

### Issue: Confidence score validation fails

**Solution:** Ensure confidence_score is between 0-100

### Issue: CORS errors from frontend

**Solution:** Already configured in main.py with `CORSMiddleware`
