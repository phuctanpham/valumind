# predict/src/schemas.py
from typing import Optional, List, Any
from pydantic import BaseModel, Field

class RealEstateFeatures(BaseModel):
    size: float = Field(..., example=90, description="Land area (m²)")
    living_size: Optional[float] = Field(None, example=270)
    width: Optional[float] = Field(None, example=4)
    length: Optional[float] = Field(None, example=22)
    rooms: Optional[int] = Field(None, example=5)
    toilets: Optional[int] = Field(None, example=5)
    floors: Optional[int] = Field(None, example=4)
    longitude: float = Field(..., example=106.65461)
    latitude: float = Field(..., example=10.864375)
    category: str = Field(..., example="Nhà riêng")
    region: str = Field(..., example="TP.HCM")
    area: str = Field(..., example="Quận 12")

class ShapFactor(BaseModel):
    feature: str
    value: Any
    shap_value: float

class PredictionAnalysis(BaseModel):
    base_price_vnd: float
    factors: List[ShapFactor]

class PredictionResponse(BaseModel):
    estimated_price_vnd: float
    analysis: PredictionAnalysis