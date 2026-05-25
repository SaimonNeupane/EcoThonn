# app/api/v1/endpoints/soil_scans.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from app.db.database import get_db
from app.services.soil_scan_service import SoilScanService
from app.models.soil_scan import (
    SoilScanCreate,
    SoilScanUpdate,
    SoilScanResponse,
    AnalyticsData,
)

router = APIRouter(prefix="/soil-scan", tags=["Soil Scans"])


def get_soil_scan_service(db: AsyncIOMotorDatabase = Depends(get_db)) -> SoilScanService:
    """Dependency to get SoilScanService"""
    return SoilScanService(db)


@router.post(
    "/save",
    response_model=SoilScanResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save a new soil scan result",
    description="Save soil scan results after image analysis to database"
)
async def save_soil_scan(
    scan_data: SoilScanCreate,
    service: SoilScanService = Depends(get_soil_scan_service)
):
    """
    Save a new soil scan result to the database.
    
    Example request body:
    ```json
    {
        "user_id": "user123",
        "image_url": "s3://bucket/scan_001.jpg",
        "soil_type": "Black_Soil",
        "confidence_score": 92.5,
        "ph_range": "6.5 - 7.2",
        "npk_values": {
            "nitrogen": "Medium",
            "phosphorus": "Low",
            "potassium": "High"
        },
        "health_status": "good",
        "quality_score": 85,
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
        }
    }
    ```
    """
    try:
        result = await service.create_soil_scan(scan_data)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to save soil scan: {str(e)}"
        )


@router.get(
    "/{scan_id}",
    response_model=SoilScanResponse,
    summary="Get a specific soil scan",
    description="Retrieve details of a specific soil scan by ID"
)
async def get_soil_scan(
    scan_id: str,
    service: SoilScanService = Depends(get_soil_scan_service)
):
    """Get a specific soil scan by ID"""
    result = await service.get_soil_scan_by_id(scan_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Soil scan not found"
        )
    return result


@router.get(
    "/history/{user_id}",
    response_model=List[SoilScanResponse],
    summary="Get user's scan history",
    description="Retrieve all soil scans for a specific user with pagination"
)
async def get_scan_history(
    user_id: str,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Number of records to return"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    order: int = Query(-1, description="Sort order: -1 (descending) or 1 (ascending)"),
    service: SoilScanService = Depends(get_soil_scan_service)
):
    """
    Get all soil scans for a user.
    
    Query parameters:
    - skip: Number of records to skip (for pagination)
    - limit: Maximum number of records to return (1-100)
    - sort_by: Field to sort by (default: created_at)
    - order: 1 for ascending, -1 for descending
    """
    results = await service.get_user_soil_scans(
        user_id=user_id,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        order=order
    )
    return results


@router.get(
    "/recent/{user_id}",
    response_model=List[SoilScanResponse],
    summary="Get recent scans for homepage",
    description="Retrieve the most recent soil scans for a user (ideal for homepage field collection)"
)
async def get_recent_scans(
    user_id: str,
    limit: int = Query(10, ge=1, le=50, description="Number of recent scans to return"),
    service: SoilScanService = Depends(get_soil_scan_service)
):
    """
    Get recent soil scans for a user.
    
    This endpoint is ideal for the homepage "Field Collection" section.
    Returns the most recent scans with limited information for display.
    """
    results = await service.get_recent_scans(user_id=user_id, limit=limit)
    return results


@router.put(
    "/{scan_id}",
    response_model=SoilScanResponse,
    summary="Update a soil scan",
    description="Update details of an existing soil scan"
)
async def update_soil_scan(
    scan_id: str,
    update_data: SoilScanUpdate,
    service: SoilScanService = Depends(get_soil_scan_service)
):
    """Update an existing soil scan record"""
    result = await service.update_soil_scan(scan_id, update_data)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Soil scan not found"
        )
    return result


@router.delete(
    "/{scan_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a soil scan",
    description="Delete a soil scan record"
)
async def delete_soil_scan(
    scan_id: str,
    service: SoilScanService = Depends(get_soil_scan_service)
):
    """Delete a soil scan"""
    success = await service.delete_soil_scan(scan_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Soil scan not found"
        )
    return None


@router.get(
    "/analytics/{user_id}",
    response_model=AnalyticsData,
    summary="Get user analytics",
    description="Retrieve aggregated analytics data for a user"
)
async def get_user_analytics(
    user_id: str,
    service: SoilScanService = Depends(get_soil_scan_service)
):
    """
    Get analytics and aggregated data for a user.
    
    Returns:
    - Total scans performed
    - Scans this month/week
    - Soil type distribution
    - Health status distribution
    - Average confidence and quality scores
    - Most common soil type and health status
    - Recent scans
    - Scan history by date (for trend charts)
    
    Example response:
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
        "recent_scans": [...],
        "scan_history_by_date": {
            "2026-05-20": 2,
            "2026-05-21": 1,
            "2026-05-22": 3
        }
    }
    ```
    """
    try:
        analytics = await service.get_user_analytics(user_id)
        return analytics
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve analytics: {str(e)}"
        )


@router.get(
    "/count/{user_id}",
    summary="Get total scan count",
    description="Get the total number of scans for a user"
)
async def get_scan_count(
    user_id: str,
    service: SoilScanService = Depends(get_soil_scan_service)
):
    """Get total count of scans for a user"""
    count = await service.get_user_scans_count(user_id)
    return {"user_id": user_id, "total_scans": count}
