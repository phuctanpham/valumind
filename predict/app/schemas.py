# app/schemas.py
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class RealEstateFeatures(BaseModel):
    size: float = Field(..., example=90, description="Diện tích đất (m²)")
    living_size: Optional[float] = Field(None, example=270, description="Diện tích sử dụng (m²)")
    width: Optional[float] = Field(None, example=4, description="Chiều rộng (m)")
    length: Optional[float] = Field(None, example=22, description="Chiều dài (m)")
    rooms: Optional[int] = Field(None, example=5, description="Số phòng ngủ")
    toilets: Optional[int] = Field(None, example=5, description="Số phòng vệ sinh")
    floors: Optional[int] = Field(None, example=4, description="Số tầng")
    longitude: float = Field(..., example=106.65461, description="Kinh độ")
    latitude: float = Field(..., example=10.864375, description="Vĩ độ")
    category: str = Field(..., example="Nhà riêng", description="Loại bất động sản (vd: 'Nhà riêng', 'Căn hộ/Chung cư')")
    region: str = Field(..., example="TP.HCM", description="Tỉnh/Thành phố")
    area: str = Field(..., example="Quận 12", description="Quận/Huyện")

# <<< THÊM MỚI/CẬP NHẬT CÁC SCHEMA DƯỚI ĐÂY >>>

class ShapFactor(BaseModel):
    """Mô tả một yếu tố ảnh hưởng đến giá"""
    feature: str = Field(..., example="area", description="Tên đặc trưng")
    value: Any = Field(..., example="Quận 12", description="Giá trị của đặc trưng")
    shap_value: float = Field(..., example=1800500000, description="Giá trị SHAP (mức độ ảnh hưởng đến giá, đơn vị VNĐ)")
    
class PredictionAnalysis(BaseModel):
    """Kết quả phân tích chi tiết của dự đoán"""
    base_price_vnd: float = Field(..., example=3517112269, description="Giá khởi điểm (trung bình thị trường) VNĐ")
    factors: List[ShapFactor] = Field(..., description="Danh sách các yếu tố ảnh hưởng, sắp xếp theo mức độ quan trọng")

class PredictionResponse(BaseModel):
    """Schema cho kết quả trả về của API"""
    estimated_price_vnd: float = Field(..., example=6150450123, description="Giá trị ước tính cuối cùng (VNĐ)")
    analysis: PredictionAnalysis = Field(..., description="Phân tích chi tiết các yếu tố ảnh hưởng đến giá")