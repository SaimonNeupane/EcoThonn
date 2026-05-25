# EcoThonn Backend - Quick Reference

## 🚀 Start Backend

```bash
cd backend
source ecothonvenv/bin/activate
uvicorn app.main:app --reload
```

Server runs on: `http://localhost:8000`

---

## 📚 API Endpoints Quick Reference

### Inference

```
POST /infer
POST /infer?user_id=user123&field_name=Field1
```

### Soil Scans

```
POST   /api/v1/soil-scan/save              Create scan
GET    /api/v1/soil-scan/{id}              Get scan
GET    /api/v1/soil-scan/history/{uid}     Scan history
GET    /api/v1/soil-scan/recent/{uid}      Recent scans
GET    /api/v1/soil-scan/analytics/{uid}   Analytics
PUT    /api/v1/soil-scan/{id}              Update scan
DELETE /api/v1/soil-scan/{id}              Delete scan
```

---

## 🔍 Test Commands

### Inference + Auto-Save

```bash
curl -X POST "http://localhost:8000/infer?user_id=user123&field_name=North%20Field" \
  -F "file=@soil_image.jpg"
```

### Save Scan Manually

```bash
curl -X POST http://localhost:8000/api/v1/soil-scan/save \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "soil_type": "Black_Soil",
    "confidence_score": 92.5,
    "health_status": "good"
  }'
```

### Get Analytics

```bash
curl http://localhost:8000/api/v1/soil-scan/analytics/user123
```

### View Docs

```
http://localhost:8000/docs           (Swagger UI)
http://localhost:8000/redoc          (ReDoc)
```

---

## 📁 Key Files

| File                                 | Purpose                 |
| ------------------------------------ | ----------------------- |
| `app/main.py`                        | FastAPI app + inference |
| `app/models/soil_scan.py`            | Data schemas            |
| `app/services/soil_scan_service.py`  | Business logic          |
| `app/api/v1/endpoints/soil_scans.py` | API endpoints           |

---

## 💾 Database Collections

**soil_scans**

- user_id (indexed)
- soil_type
- confidence_score
- health_status
- npk_values
- recommendations
- created_at (indexed)

---

## 📊 Response Examples

### Save Response

```json
{
  "id": "507f1f77bcf86cd799439011",
  "user_id": "user123",
  "soil_type": "Black_Soil",
  "confidence_score": 92.5,
  "health_status": "good"
}
```

### Analytics Response

```json
{
  "total_scans": 42,
  "scans_this_month": 12,
  "soil_type_distribution": { "Black_Soil": 18 },
  "average_confidence": 87.34
}
```

---

## 🛠️ Common Tasks

### Add New Scan Endpoint

1. Update `models/soil_scan.py` (if needed)
2. Add method to `services/soil_scan_service.py`
3. Add route to `api/v1/endpoints/soil_scans.py`

### Debug Database Issues

```bash
# Test connection
python test_db_connection.py
```

### View Logs

```bash
# Check uvicorn output in terminal
# Look for INFO/ERROR messages
```

---

## 📖 Documentation

- `IMPLEMENTATION_SUMMARY.md` - Overview & architecture
- `SOIL_SCAN_DOCUMENTATION.md` - Complete API docs
- `API_EXAMPLES.md` - Curl commands & code samples
- `DATABASE_SETUP.md` - MongoDB configuration
- `SETUP_GUIDE.md` - Installation & setup

---

## ✅ Status

- ✅ Database schema created
- ✅ All CRUD endpoints working
- ✅ Analytics aggregation complete
- ✅ API documented
- ✅ Error handling implemented
- ✅ CORS enabled
- ✅ Ready for frontend integration

---

## 🐛 Troubleshooting

| Issue               | Solution                            |
| ------------------- | ----------------------------------- |
| Module not found    | Run from `/backend` directory       |
| DB connection error | Check MongoDB URL in `.env`         |
| 404 on endpoints    | Ensure routes included in `main.py` |
| CORS errors         | Already enabled, check frontend URL |

---

## 🎯 Frontend Integration

### Homepage - Recent Scans

```javascript
const scans = await fetch(`/api/v1/soil-scan/recent/${userId}`).then((r) =>
  r.json(),
);
```

### Analytics Page

```javascript
const analytics = await fetch(`/api/v1/soil-scan/analytics/${userId}`).then(
  (r) => r.json(),
);
// Use data for charts
```

### After Image Upload

```javascript
const response = await fetch(`/infer?user_id=${userId}`, {
  method: "POST",
  body: formData,
});
// Returns scan_id if auto-saved
```

---

## 📞 Quick Support

**API Test Tool**: http://localhost:8000/docs
**Database**: MongoDB Atlas (ecothonn_db)
**Format**: JSON
**Auth**: Currently not implemented (add as needed)

---

## Last Updated

May 25, 2026

## Files Created

- 7 Python modules
- 5 Documentation files
- ~1,500 lines of code

---

## 🎉 Ready to Use!

Backend is fully functional and documented.
Ready for frontend integration.
