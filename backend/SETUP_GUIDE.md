# EcoThonn Backend - Soil Scan System Setup

## Quick Setup Guide

### 1. Install Dependencies

Make sure all required packages are in your `requirements.txt`:

```
fastapi==0.136.3
uvicorn[standard]==0.30.0
motor==3.7.1
pydantic==2.4.2
pydantic-settings==2.1.0
torch==2.1.0
torchvision==0.16.0
pillow==12.2.0
python-dotenv==1.0.0
```

Install with:

```bash
pip install -r requirements.txt
```

### 2. Environment Setup

Your `.env` file should contain:

```env
MONGODB_URL=mongodb+srv://saimon:saimon@cluster0.kmcawaw.mongodb.net/
DATABASE_NAME=ecothonn_db
```

### 3. Start the Backend Server

```bash
cd /Users/keshavrajsharma/Desktop/EcoThonn/backend
source ecothonvenv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The server will start on `http://localhost:8000`

### 4. Access API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## File Structure Created

```
backend/app/
├── models/
│   ├── __init__.py
│   └── soil_scan.py                 # NEW: Pydantic models
├── services/
│   ├── __init__.py
│   └── soil_scan_service.py         # NEW: Business logic
├── api/
│   └── v1/
│       ├── __init__.py              # UPDATED: Router aggregator
│       └── endpoints/
│           ├── soil_scans.py        # NEW: API endpoints
│           └── users.py
├── db/
│   └── database.py
└── main.py                          # UPDATED: Includes new routes
```

---

## API Endpoints Summary

| Method     | Endpoint                                | Purpose                                     |
| ---------- | --------------------------------------- | ------------------------------------------- |
| **POST**   | `/infer`                                | Perform inference (with optional auto-save) |
| **POST**   | `/api/v1/soil-scan/save`                | Manually save scan result                   |
| **GET**    | `/api/v1/soil-scan/{scan_id}`           | Get specific scan                           |
| **GET**    | `/api/v1/soil-scan/history/{user_id}`   | Get scan history (paginated)                |
| **GET**    | `/api/v1/soil-scan/recent/{user_id}`    | Get recent scans (homepage)                 |
| **GET**    | `/api/v1/soil-scan/analytics/{user_id}` | Get analytics data                          |
| **GET**    | `/api/v1/soil-scan/count/{user_id}`     | Get total scan count                        |
| **PUT**    | `/api/v1/soil-scan/{scan_id}`           | Update scan                                 |
| **DELETE** | `/api/v1/soil-scan/{scan_id}`           | Delete scan                                 |

---

## Key Features

✅ **Complete CRUD Operations**

- Create, Read, Update, Delete soil scans
- Pagination support for history

✅ **Analytics & Reporting**

- Total scans, monthly/weekly stats
- Soil type distribution
- Health status breakdown
- Average confidence and quality scores
- Scan history by date

✅ **Smart Inference Integration**

- Automatic health status determination
- Quality score calculation
- Personalized recommendations
- Database auto-save option

✅ **Database Optimization**

- MongoDB indexes for fast queries
- Efficient aggregation
- User-specific data isolation

✅ **API Documentation**

- Swagger UI with interactive testing
- Full request/response examples
- Parameter descriptions

✅ **Error Handling**

- Proper HTTP status codes
- Meaningful error messages
- Input validation

---

## Integration Examples

### Frontend: Save After Inference

```typescript
// Perform inference and auto-save
const formData = new FormData();
formData.append("file", imageFile);

const response = await fetch(
  `/infer?user_id=${userId}&field_name=${fieldName}`,
  { method: "POST", body: formData },
);

const result = await response.json();
if (result.saved) {
  console.log("Scan saved with ID:", result.scan_id);
}
```

### Frontend: Display Recent Scans

```typescript
const recentScans = await fetch(
  `/api/v1/soil-scan/recent/${userId}?limit=5`,
).then((r) => r.json());

// Use for Field Collection cards
```

### Frontend: Load Analytics

```typescript
const analytics = await fetch(`/api/v1/soil-scan/analytics/${userId}`).then(
  (r) => r.json(),
);

// Data ready for charts:
// - analytics.soil_type_distribution (pie chart)
// - analytics.health_distribution (bar chart)
// - analytics.scan_history_by_date (line chart)
```

---

## Database Schema

### soil_scans Collection

```json
{
  "_id": ObjectId,
  "user_id": "string (indexed)",
  "image_url": "string",
  "soil_type": "string",
  "confidence_score": "number (0-100)",
  "ph_range": "string",
  "npk_values": {
    "nitrogen": "string",
    "phosphorus": "string",
    "potassium": "string"
  },
  "health_status": "enum: excellent|good|fair|poor|degraded",
  "quality_score": "number (0-100)",
  "recommendations": ["string array"],
  "suggested_crops": ["string array"],
  "fertilizer_recommendation": "string",
  "location": {
    "latitude": "number",
    "longitude": "number"
  },
  "field_name": "string",
  "notes": "string",
  "created_at": "datetime (indexed)",
  "updated_at": "datetime"
}
```

### Recommended Indexes

Create these in MongoDB for optimal performance:

```javascript
// In MongoDB Atlas or local instance
db.soil_scans.createIndex({ user_id: 1, created_at: -1 });
db.soil_scans.createIndex({ user_id: 1, soil_type: 1 });
db.soil_scans.createIndex({ created_at: 1 });
```

---

## Testing the System

### 1. Test Inference Only

```bash
curl -X POST "http://localhost:8000/infer" \
  -F "file=@soil_image.jpg"
```

### 2. Test Inference + Auto-Save

```bash
curl -X POST "http://localhost:8000/infer?user_id=user123&field_name=North%20Field" \
  -F "file=@soil_image.jpg"
```

### 3. Test Save Endpoint

```bash
curl -X POST "http://localhost:8000/api/v1/soil-scan/save" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "soil_type": "Black_Soil",
    "confidence_score": 92.5,
    "health_status": "good"
  }'
```

### 4. Test Analytics

```bash
curl -X GET "http://localhost:8000/api/v1/soil-scan/analytics/user123"
```

---

## Troubleshooting

### Issue: Module Not Found Errors

**Solution:** Make sure you're running from the `/backend` directory and all `__init__.py` files exist

### Issue: Database Connection Failed

**Solution:** Verify MongoDB URL in `.env` and check network connectivity

### Issue: CORS Errors from Frontend

**Solution:** Already enabled in `app.main` with `CORSMiddleware`

### Issue: Image Inference Fails

**Solution:** Ensure `SoilClassification.pth` is in `/backend/app/` directory

### Issue: Confidence Score Validation Error

**Solution:** Ensure confidence_score is between 0-100

---

## Performance Optimization Tips

### 1. Enable MongoDB Compression

Add to connection string: `?compressors=snappy`

### 2. Use Connection Pooling

Motor automatically handles connection pooling

### 3. Add Caching Layer

```python
from functools import lru_cache
import redis

@lru_cache(maxsize=100)
async def cached_analytics(user_id: str):
    # Cache analytics for 5 minutes
    pass
```

### 4. Batch Operations

```python
# Insert multiple scans at once
await collection.insert_many(scan_list)
```

---

## Next Steps

1. **Frontend Integration**
   - Update homepage to show recent scans
   - Add analytics page with charts
   - Implement scan upload with progress

2. **Advanced Features**
   - Recommendation engine based on historical data
   - Crop suitability predictor
   - Soil improvement tracking
   - Comparative analysis across fields

3. **Scalability**
   - Add Redis caching
   - Implement task queue (Celery)
   - Database read replicas

4. **Monitoring**
   - Add logging with Python logging module
   - Set up error tracking (Sentry)
   - Performance monitoring

---

## Documentation Files

- **SOIL_SCAN_DOCUMENTATION.md** - Complete API documentation
- **API_EXAMPLES.md** - Curl commands and code examples

---

## Support

For issues or questions:

1. Check the API documentation in Swagger UI
2. Review example curl commands in API_EXAMPLES.md
3. Check MongoDB connection and indexes
4. Verify all required packages are installed
