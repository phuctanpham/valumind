from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class UserCreate(BaseModel):
    email: str
    name: Optional[str] = None
    phone: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    phone: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class PropertyImageSchema(BaseModel):
    filename: str
    url: str
    key: str


class PropertyReportCreate(BaseModel):
    # Basic info
    address: str
    property_type: str
    land_area: Optional[float] = None
    usable_area: float
    bedrooms: int
    bathrooms: int
    floors: int
    direction: str
    legal_status: str
    furniture: str
    width: Optional[float] = None
    length: Optional[float] = None
    
    # Condition assessment
    overall_condition: str
    cleanliness: str
    maintenance_status: str
    major_issues: Optional[List[str]] = None
    overall_description: str
    
    # Images and AI analysis - FIXED: images as List[Dict] not List[PropertyImageSchema]
    images: List[Dict[str, str]]
    ai_analysis_raw: Optional[Dict[str, Any]] = None


class PropertyReportResponse(BaseModel):
    id: int
    address: str
    property_type: str
    land_area: Optional[float]
    usable_area: float
    bedrooms: int
    bathrooms: int
    floors: int
    direction: str
    legal_status: str
    furniture: str
    overall_condition: str
    cleanliness: str
    maintenance_status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AnalysisResponse(BaseModel):
    success: bool
    data: Dict[str, Any]
    images: List[Dict[str, str]]


class AnalysisRequest(BaseModel):
    images: List[str]  # base64 encoded