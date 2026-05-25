# app/models/soil_scan.py
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class SoilHealthStatus(str, Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"
    DEGRADED = "degraded"


class SoilType(str, Enum):
    ALLUVIAL = "Alluvial_Soil"
    ARID = "Arid_Soil"
    BLACK = "Black_Soil"
    LATERITE = "Laterite_Soil"
    MOUNTAIN = "Mountain_Soil"
    RED = "Red_Soil"
    YELLOW = "Yellow_Soil"


class NPKValues(BaseModel):
    """Nitrogen, Phosphorus, Potassium values"""
    nitrogen: Optional[str] = None
    phosphorus: Optional[str] = None
    potassium: Optional[str] = None


class SoilScanResult(BaseModel):
    """Schema for soil scan result"""
    user_id: str = Field(..., description="User ID who performed the scan")
    image_url: Optional[str] = Field(None, description="URL or path to uploaded soil image")
    soil_type: str = Field(..., description="Detected soil type")
    confidence_score: float = Field(..., ge=0, le=100, description="Confidence score 0-100")
    
    # Soil properties
    ph_range: Optional[str] = Field(None, description="pH range of soil")
    npk_values: Optional[NPKValues] = Field(None, description="NPK nutrient levels")
    
    # Health and quality
    health_status: SoilHealthStatus = Field(..., description="Overall soil health status")
    quality_score: Optional[float] = Field(None, ge=0, le=100, description="Soil quality score")
    
    # Recommendations
    recommendations: List[str] = Field(default_factory=list, description="Farming recommendations")
    suggested_crops: Optional[List[str]] = Field(None, description="Suggested crops for this soil")
    fertilizer_recommendation: Optional[str] = Field(None, description="Fertilizer recommendation")
    
    # Location and metadata
    location: Optional[Dict[str, Any]] = Field(None, description="GPS location if available")
    field_name: Optional[str] = Field(None, description="Field or plot name")
    notes: Optional[str] = Field(None, description="Additional notes about the scan")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class SoilScanCreate(BaseModel):
    """Schema for creating a new soil scan"""
    user_id: str
    image_url: Optional[str] = None
    soil_type: str
    confidence_score: float
    ph_range: Optional[str] = None
    npk_values: Optional[NPKValues] = None
    health_status: SoilHealthStatus
    quality_score: Optional[float] = None
    recommendations: List[str] = []
    suggested_crops: Optional[List[str]] = None
    fertilizer_recommendation: Optional[str] = None
    location: Optional[Dict[str, Any]] = None
    field_name: Optional[str] = None
    notes: Optional[str] = None


class SoilScanUpdate(BaseModel):
    """Schema for updating a soil scan"""
    health_status: Optional[SoilHealthStatus] = None
    quality_score: Optional[float] = None
    recommendations: Optional[List[str]] = None
    suggested_crops: Optional[List[str]] = None
    fertilizer_recommendation: Optional[str] = None
    notes: Optional[str] = None


class SoilScanResponse(BaseModel):
    """Response schema for soil scan"""
    id: str = Field(..., alias="_id")
    user_id: str
    image_url: Optional[str] = None
    soil_type: str
    confidence_score: float
    ph_range: Optional[str] = None
    npk_values: Optional[NPKValues] = None
    health_status: SoilHealthStatus
    quality_score: Optional[float] = None
    recommendations: List[str]
    suggested_crops: Optional[List[str]] = None
    fertilizer_recommendation: Optional[str] = None
    location: Optional[Dict[str, Any]] = None
    field_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


class AnalyticsData(BaseModel):
    """Analytics response data"""
    total_scans: int
    scans_this_month: int
    scans_this_week: int
    
    soil_type_distribution: Dict[str, int]
    health_distribution: Dict[str, int]
    average_confidence: float
    
    npk_averages: Optional[Dict[str, float]] = None
    average_quality_score: float
    
    most_common_soil_type: str
    most_common_health_status: str
    
    recent_scans: List[SoilScanResponse]
    scan_history_by_date: Dict[str, int]
