# app/services/soil_scan_service.py
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from app.models.soil_scan import (
    SoilScanCreate,
    SoilScanUpdate,
    SoilScanResponse,
    AnalyticsData,
    NPKValues,
)


class SoilScanService:
    """Service for soil scan database operations"""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db["soil_scans"]
        self.users_collection = db["users"]

    async def create_soil_scan(
        self, scan_data: SoilScanCreate
    ) -> SoilScanResponse:
        """Create a new soil scan record"""
        # Convert to dict and add timestamps
        scan_dict = scan_data.model_dump(exclude_unset=True)
        scan_dict["created_at"] = datetime.utcnow()
        scan_dict["updated_at"] = datetime.utcnow()

        # Insert into database
        result = await self.collection.insert_one(scan_dict)
        
        # Retrieve the created document
        created_scan = await self.collection.find_one({"_id": result.inserted_id})
        return self._format_response(created_scan)

    async def get_soil_scan_by_id(self, scan_id: str) -> Optional[SoilScanResponse]:
        """Get a soil scan by ID"""
        try:
            scan = await self.collection.find_one({"_id": ObjectId(scan_id)})
            if scan:
                return self._format_response(scan)
            return None
        except Exception:
            return None

    async def get_user_soil_scans(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 50,
        sort_by: str = "created_at",
        order: int = -1,
    ) -> List[SoilScanResponse]:
        """Get all soil scans for a user with pagination"""
        scans = await self.collection.find({"user_id": user_id}) \
            .sort(sort_by, order) \
            .skip(skip) \
            .limit(limit) \
            .to_list(length=limit)
        
        return [self._format_response(scan) for scan in scans]

    async def get_user_scans_count(self, user_id: str) -> int:
        """Get total count of scans for a user"""
        return await self.collection.count_documents({"user_id": user_id})

    async def get_recent_scans(
        self,
        user_id: str,
        limit: int = 10,
    ) -> List[SoilScanResponse]:
        """Get recent scans for a user"""
        return await self.get_user_soil_scans(
            user_id=user_id,
            limit=limit,
            sort_by="created_at",
            order=-1
        )

    async def update_soil_scan(
        self, scan_id: str, update_data: SoilScanUpdate
    ) -> Optional[SoilScanResponse]:
        """Update a soil scan"""
        try:
            update_dict = update_data.model_dump(exclude_unset=True)
            update_dict["updated_at"] = datetime.utcnow()
            
            result = await self.collection.find_one_and_update(
                {"_id": ObjectId(scan_id)},
                {"$set": update_dict},
                return_document=True
            )
            
            if result:
                return self._format_response(result)
            return None
        except Exception:
            return None

    async def delete_soil_scan(self, scan_id: str) -> bool:
        """Delete a soil scan"""
        try:
            result = await self.collection.delete_one({"_id": ObjectId(scan_id)})
            return result.deleted_count > 0
        except Exception:
            return False

    async def get_user_analytics(self, user_id: str) -> AnalyticsData:
        """Get analytics data for a user"""
        # Total scans
        total_scans = await self.collection.count_documents({"user_id": user_id})
        
        # Scans this month
        now = datetime.utcnow()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        scans_this_month = await self.collection.count_documents({
            "user_id": user_id,
            "created_at": {"$gte": month_start}
        })
        
        # Scans this week
        week_start = now - timedelta(days=now.weekday())
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        scans_this_week = await self.collection.count_documents({
            "user_id": user_id,
            "created_at": {"$gte": week_start}
        })
        
        # Get all user scans for aggregation
        all_scans = await self.collection.find({"user_id": user_id}).to_list(None)
        
        if not all_scans:
            return AnalyticsData(
                total_scans=0,
                scans_this_month=0,
                scans_this_week=0,
                soil_type_distribution={},
                health_distribution={},
                average_confidence=0,
                average_quality_score=0,
                most_common_soil_type="N/A",
                most_common_health_status="N/A",
                recent_scans=[],
                scan_history_by_date={}
            )
        
        # Calculate distributions
        soil_type_dist = {}
        health_dist = {}
        confidence_scores = []
        quality_scores = []
        scan_dates = {}
        
        for scan in all_scans:
            # Soil type distribution
            soil_type = scan.get("soil_type", "Unknown")
            soil_type_dist[soil_type] = soil_type_dist.get(soil_type, 0) + 1
            
            # Health distribution
            health = scan.get("health_status", "unknown")
            health_dist[health] = health_dist.get(health, 0) + 1
            
            # Confidence scores
            confidence = scan.get("confidence_score", 0)
            if confidence > 0:
                confidence_scores.append(confidence)
            
            # Quality scores
            quality = scan.get("quality_score")
            if quality is not None and quality > 0:
                quality_scores.append(quality)
            
            # Scan history by date
            created_date = scan.get("created_at")
            if created_date:
                date_key = created_date.strftime("%Y-%m-%d")
                scan_dates[date_key] = scan_dates.get(date_key, 0) + 1
        
        # Calculate averages
        avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
        avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else 0
        
        # Get recent scans
        recent = await self.get_recent_scans(user_id, limit=5)
        
        # Most common values
        most_common_soil = max(soil_type_dist, key=soil_type_dist.get) if soil_type_dist else "N/A"
        most_common_health = max(health_dist, key=health_dist.get) if health_dist else "N/A"
        
        return AnalyticsData(
            total_scans=total_scans,
            scans_this_month=scans_this_month,
            scans_this_week=scans_this_week,
            soil_type_distribution=soil_type_dist,
            health_distribution=health_dist,
            average_confidence=round(avg_confidence, 2),
            average_quality_score=round(avg_quality, 2),
            most_common_soil_type=most_common_soil,
            most_common_health_status=most_common_health,
            recent_scans=recent,
            scan_history_by_date=dict(sorted(scan_dates.items()))
        )

    @staticmethod
    def _format_response(scan: Dict[str, Any]) -> SoilScanResponse:
        """Format database scan document to response schema"""
        return SoilScanResponse(
            _id=str(scan["_id"]),
            user_id=scan.get("user_id"),
            image_url=scan.get("image_url"),
            soil_type=scan.get("soil_type"),
            confidence_score=scan.get("confidence_score"),
            ph_range=scan.get("ph_range"),
            npk_values=scan.get("npk_values"),
            health_status=scan.get("health_status"),
            quality_score=scan.get("quality_score"),
            recommendations=scan.get("recommendations", []),
            suggested_crops=scan.get("suggested_crops"),
            fertilizer_recommendation=scan.get("fertilizer_recommendation"),
            location=scan.get("location"),
            field_name=scan.get("field_name"),
            notes=scan.get("notes"),
            created_at=scan.get("created_at"),
            updated_at=scan.get("updated_at"),
        )
