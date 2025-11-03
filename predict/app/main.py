# app/main.py

import joblib
import lightgbm as lgb
import pandas as pd
import shap  # Thêm thư viện SHAP
from fastapi import FastAPI, HTTPException
from . import schemas

# --- KHỞI TẠO ỨNG DỤNG VÀ LOAD MODEL ---

API_DESCRIPTION = """
API Ước tính Giá trị Bất động sản 🏡

Sử dụng mô hình LightGBM để dự đoán giá và **phân tích chi tiết** các yếu tố ảnh hưởng.
- Cung cấp giá trị ước tính.
- Giải thích "tại sao" lại có mức giá đó bằng phương pháp SHAP.
"""

app = FastAPI(
    title="Real Estate Price Prediction API",
    description=API_DESCRIPTION,
    version="2.0.0" # Nâng cấp phiên bản
)

# Đường dẫn tới các file model artifacts
MODEL_PATH = "model_artifacts/lightgbm_model.txt"

# Load model và SHAP explainer khi ứng dụng khởi động
try:
    model = lgb.Booster(model_file=MODEL_PATH)
    print("✅ Mô hình LightGBM đã được load thành công.")
    
    # Khởi tạo SHAP explainer ngay từ đầu để tái sử dụng
    explainer = shap.TreeExplainer(model)
    print("✅ SHAP Explainer đã được khởi tạo thành công.")
    
except FileNotFoundError as e:
    print(f"❌ LỖI: Không tìm thấy file model. Chi tiết: {e}")
    model = None
    explainer = None

# --- ĐỊNH NGHĨA CÁC ENDPOINTS ---

@app.get("/", tags=["General"])
def read_root():
    """Endpoint gốc để kiểm tra trạng thái của API."""
    return {"status": "OK", "message": "Chào mừng đến với API Ước tính Giá trị Bất động sản!"}

@app.post("/predict", 
          response_model=schemas.PredictionResponse, 
          tags=["Prediction"],
          summary="Dự đoán và phân tích giá bất động sản")
def predict_price(features: schemas.RealEstateFeatures):
    """
    Nhận các đặc điểm của bất động sản, trả về giá trị ước tính và phân tích chi tiết.
    """
    if not model or not explainer:
        raise HTTPException(status_code=503, detail="Model hoặc Explainer không sẵn sàng.")

    # 1. Chuyển Pydantic model thành pandas DataFrame
    input_dict = features.dict()
    input_df = pd.DataFrame([input_dict])

    # 2. Chuyển đổi dtype cho các cột categorical, giống hệt lúc training
    for col in ['category', 'region', 'area']:
        input_df[col] = input_df[col].astype('category')
    
    print("\n--- Dữ liệu đầu vào nhận được ---")
    print(input_df.to_markdown(index=False))

    # 3. Thực hiện dự đoán
    try:
        prediction = model.predict(input_df)
        estimated_price = prediction[0]
        print(f"\n--- Kết quả dự đoán (VND) ---\n{estimated_price:,.0f} VND")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Lỗi khi dự đoán: {e}")

    # 4. Phân tích dự đoán bằng SHAP
    try:
        # Tính toán giá trị SHAP
        shap_values_array = explainer.shap_values(input_df)
        
        # Lấy các thông tin cần thiết
        base_value = explainer.expected_value
        feature_names = model.feature_name()
        
        # Ghép tên cột và giá trị SHAP
        shap_dict = dict(zip(feature_names, shap_values_array[0]))
        
        # Sắp xếp các yếu tố theo mức độ ảnh hưởng
        sorted_shap = sorted(shap_dict.items(), key=lambda item: abs(item[1]), reverse=True)

        # Tạo danh sách các yếu tố để trả về trong response
        analysis_factors = []
        for feature_name, shap_val in sorted_shap:
            # Có thể thêm một ngưỡng để loại bỏ các yếu tố ảnh hưởng quá nhỏ
            if abs(shap_val) > 1:
                analysis_factors.append(schemas.ShapFactor(
                    feature=feature_name,
                    value=input_dict.get(feature_name),
                    shap_value=shap_val
                ))
    except Exception as e:
        # Nếu chỉ có lỗi ở phần SHAP, vẫn trả về giá, nhưng báo lỗi ở phần analysis
        print(f"Lỗi khi tính toán SHAP: {e}")
        return schemas.PredictionResponse(
            estimated_price_vnd=estimated_price,
            analysis=schemas.PredictionAnalysis(
                base_price_vnd=0,
                factors=[schemas.ShapFactor(feature="error", value=str(e), shap_value=0)]
            )
        )

    # 5. Xây dựng và trả về response cuối cùng
    return schemas.PredictionResponse(
        estimated_price_vnd=estimated_price,
        analysis=schemas.PredictionAnalysis(
            base_price_vnd=base_value,
            factors=analysis_factors
        )
    )