# MongoDB Setup & Configuration Guide

## Connection String

Your MongoDB Atlas connection string in `.env`:

```env
MONGODB_URL=mongodb+srv://saimon:saimon@cluster0.kmcawaw.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=ecothonn_db
```

---

## Creating Database Indexes

For optimal performance, create these indexes in your MongoDB Atlas cluster.

### Option 1: Using MongoDB Atlas UI

1. Go to MongoDB Atlas Dashboard
2. Select your cluster → Collections → ecothonn_db.soil_scans
3. Click "Indexes" tab
4. Create the following indexes:

#### Index 1: User + Date (Primary)

- **Fields:**
  - `user_id` (Ascending)
  - `created_at` (Descending)
- **Name:** `user_id_1_created_at_-1`
- **Purpose:** Fast query for user's recent scans

#### Index 2: User + Soil Type

- **Fields:**
  - `user_id` (Ascending)
  - `soil_type` (Ascending)
- **Name:** `user_id_1_soil_type_1`
- **Purpose:** Fast filtering by soil type

#### Index 3: Date

- **Fields:**
  - `created_at` (Ascending)
- **Name:** `created_at_1`
- **Purpose:** Time-based queries

#### Index 4: User ID Only

- **Fields:**
  - `user_id` (Ascending)
- **Name:** `user_id_1`
- **Purpose:** General user queries

### Option 2: Using MongoDB Shell Commands

Connect to MongoDB and run:

```javascript
use ecothonn_db

// Index 1: User + Date
db.soil_scans.createIndex({ "user_id": 1, "created_at": -1 })

// Index 2: User + Soil Type
db.soil_scans.createIndex({ "user_id": 1, "soil_type": 1 })

// Index 3: Date only
db.soil_scans.createIndex({ "created_at": 1 })

// Index 4: User ID only
db.soil_scans.createIndex({ "user_id": 1 })

// Verify indexes
db.soil_scans.getIndexes()
```

### Option 3: Using Python

```python
from pymongo import MongoClient

client = MongoClient("mongodb+srv://saimon:saimon@cluster0.kmcawaw.mongodb.net/")
db = client["ecothonn_db"]
collection = db["soil_scans"]

# Create indexes
collection.create_index([("user_id", 1), ("created_at", -1)])
collection.create_index([("user_id", 1), ("soil_type", 1)])
collection.create_index([("created_at", 1)])
collection.create_index([("user_id", 1)])

print("Indexes created successfully!")
```

---

## Database Schema Validation (Optional)

To ensure data consistency, you can enable schema validation:

### Using MongoDB Atlas UI:

1. Go to Collections → soil_scans → Validation tab
2. Add JSON Schema:

```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": [
      "user_id",
      "soil_type",
      "confidence_score",
      "health_status",
      "created_at"
    ],
    "properties": {
      "_id": {
        "bsonType": "objectId"
      },
      "user_id": {
        "bsonType": "string",
        "description": "User ID who performed the scan"
      },
      "image_url": {
        "bsonType": "string",
        "description": "URL to the soil image"
      },
      "soil_type": {
        "bsonType": "string",
        "enum": [
          "Alluvial_Soil",
          "Arid_Soil",
          "Black_Soil",
          "Laterite_Soil",
          "Mountain_Soil",
          "Red_Soil",
          "Yellow_Soil"
        ]
      },
      "confidence_score": {
        "bsonType": "double",
        "minimum": 0,
        "maximum": 100
      },
      "ph_range": {
        "bsonType": "string"
      },
      "npk_values": {
        "bsonType": "object",
        "properties": {
          "nitrogen": { "bsonType": "string" },
          "phosphorus": { "bsonType": "string" },
          "potassium": { "bsonType": "string" }
        }
      },
      "health_status": {
        "bsonType": "string",
        "enum": ["excellent", "good", "fair", "poor", "degraded"]
      },
      "quality_score": {
        "bsonType": "double",
        "minimum": 0,
        "maximum": 100
      },
      "recommendations": {
        "bsonType": "array",
        "items": { "bsonType": "string" }
      },
      "suggested_crops": {
        "bsonType": "array",
        "items": { "bsonType": "string" }
      },
      "fertilizer_recommendation": {
        "bsonType": "string"
      },
      "location": {
        "bsonType": "object",
        "properties": {
          "latitude": { "bsonType": "double" },
          "longitude": { "bsonType": "double" }
        }
      },
      "field_name": {
        "bsonType": "string"
      },
      "notes": {
        "bsonType": "string"
      },
      "created_at": {
        "bsonType": "date"
      },
      "updated_at": {
        "bsonType": "date"
      }
    }
  }
}
```

---

## Backup & Recovery

### Create Automated Backups

1. In MongoDB Atlas Dashboard, go to Backup
2. Enable "Continuous Backup"
3. Set backup frequency to hourly
4. Configure automated point-in-time recovery

### Manual Backup with `mongodump`

```bash
mongodump --uri="mongodb+srv://saimon:saimon@cluster0.kmcawaw.mongodb.net/ecothonn_db" \
  --out=/path/to/backup
```

### Restore from Backup

```bash
mongorestore --uri="mongodb+srv://saimon:saimon@cluster0.kmcawaw.mongodb.net/ecothonn_db" \
  /path/to/backup
```

---

## Monitoring & Performance

### Enable Query Profiling

```javascript
use ecothonn_db

// Set profiling level to log slow queries (> 100ms)
db.setProfilingLevel(1, { slowms: 100 })

// View slow queries
db.system.profile.find({millis: {$gt: 100}}).limit(5).pretty()
```

### Check Collection Statistics

```javascript
db.soil_scans.stats();
```

**Example Output:**

```
{
  "ns" : "ecothonn_db.soil_scans",
  "size" : 1048576,
  "count" : 500,
  "avgObjSize" : 2097,
  "storageSize" : 2097152,
  "capped" : false,
  "indexSizes" : {
    "_id_" : 16384,
    "user_id_1_created_at_-1" : 32768
  }
}
```

---

## Data Export

### Export to CSV

```bash
mongoexport \
  --uri="mongodb+srv://saimon:saimon@cluster0.kmcawaw.mongodb.net/ecothonn_db" \
  --collection=soil_scans \
  --out=scans.csv \
  --csv \
  --fields=_id,user_id,soil_type,confidence_score,health_status,created_at
```

### Export to JSON

```bash
mongoexport \
  --uri="mongodb+srv://saimon:saimon@cluster0.kmcawaw.mongodb.net/ecothonn_db" \
  --collection=soil_scans \
  --out=scans.json \
  --jsonArray
```

---

## Troubleshooting

### Issue: Connection Timeout

**Solution:**

1. Check MongoDB Atlas IP Whitelist
2. Ensure your IP is added: Security → Network Access
3. Add 0.0.0.0/0 for development (not recommended for production)

### Issue: Slow Queries

**Solution:**

1. Check if indexes are created
2. Run `db.soil_scans.explain("executionStats").find({user_id: "..."})` to analyze query
3. Add missing indexes

### Issue: Document Size Exceeded

**Solution:**

- MongoDB has 16MB document limit
- Store large images in S3/cloud storage, save only URL in database
- Already implemented in our schema design

### Issue: Duplicate Key Error

**Solution:**

- Don't create unique indexes on user_id
- Let multiple scans exist per user

---

## Performance Optimization Tips

### 1. Connection Pooling

Already handled by Motor (AsyncIOMotorClient):

```python
# Automatically manages connection pool
client = AsyncIOMotorClient(MONGODB_URL, maxPoolSize=10)
```

### 2. Projection

Fetch only needed fields:

```python
# Instead of: db.soil_scans.find_one(...)
# Use: db.soil_scans.find_one(..., projection={"field": 1, "user_id": 1})

# In Motor (async):
scan = await db.soil_scans.find_one(
    {"_id": ObjectId(id)},
    projection={"user_id": 1, "soil_type": 1, "created_at": 1}
)
```

### 3. Batch Operations

```python
# Instead of inserting one by one
scans_list = [scan1, scan2, scan3]
result = await db.soil_scans.insert_many(scans_list)
```

### 4. Compound Indexes for Sorted Queries

Already using in queries like:

```python
.find({"user_id": user_id}).sort([("created_at", -1)]).limit(10)
```

---

## Security Best Practices

### 1. IP Whitelist

In MongoDB Atlas:

- Security → Network Access
- Add your application servers' IPs
- Remove 0.0.0.0/0 in production

### 2. Database User Roles

Create a limited user:

```javascript
use admin

db.createUser({
  user: "ecothonn_app",
  pwd: "strong_password",
  roles: [
    {
      role: "readWrite",
      db: "ecothonn_db"
    }
  ]
})
```

### 3. Environment Variables

Never commit credentials:

```env
MONGODB_URL=mongodb+srv://ecothonn_app:strong_password@cluster0.mongodb.net/
```

### 4. SSL/TLS Encryption

Already enabled by default with MongoDB Atlas.

### 5. Audit Logging

Enable in MongoDB Atlas:

- Security → Audit Log
- Review for suspicious activity

---

## Scaling Considerations

### When to Scale

- **Vertical**: Increase cluster tier when hitting CPU/RAM limits
- **Horizontal**: Add sharding when collection exceeds 100GB

### Sharding Key Selection

For soil_scans collection:

```javascript
// Good sharding key: balances queries and avoids hotspots
sh.shardCollection("ecothonn_db.soil_scans", { user_id: 1, _id: 1 });
```

---

## Testing Connection

Run this Python script to verify setup:

```python
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def test_connection():
    mongodb_url = os.getenv("MONGODB_URL")

    client = AsyncIOMotorClient(mongodb_url)
    db = client["ecothonn_db"]

    try:
        # Test connection
        await db.command("ping")
        print("✅ Successfully connected to MongoDB!")

        # Get stats
        stats = await db.command("dbstats")
        print(f"Database size: {stats['dataSize']} bytes")
        print(f"Number of collections: {stats['collections']}")

        # Check indexes
        collection = db["soil_scans"]
        indexes = await collection.list_indexes().to_list(None)
        print(f"Indexes on soil_scans: {[idx['name'] for idx in indexes]}")

    except Exception as e:
        print(f"❌ Connection failed: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(test_connection())
```

Run with:

```bash
python test_db_connection.py
```

---

## Summary

✅ Indexes created for optimal query performance
✅ Schema validation enabled for data consistency
✅ Backup and recovery procedures in place
✅ Security best practices implemented
✅ Performance optimization tips documented
✅ Troubleshooting guide provided
