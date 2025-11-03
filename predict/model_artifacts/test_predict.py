# test_predict.py
import joblib
import pandas as pd
import lightgbm as lgb
import shap
import numpy as np
import os
import logging

# --- Thiết lập logging ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- ĐỊNH NGHĨA CÁC ĐƯỜNG DẪN BÊN TRONG CONTAINER ---
BASE_DIR = '/app'
ARTIFACTS_DIR = os.path.join(BASE_DIR, 'model_artifacts')
# <<< THAY ĐỔI: Không cần preprocessor nữa, nhưng vẫn để đây phòng trường hợp cần thiết
# PREPROCESSOR_PATH = os.path.join(ARTIFACTS_DIR, 'preprocessor.pkl')
MODEL_PATH = os.path.join(ARTIFACTS_DIR, 'lightgbm_model.txt')

def predict_and_explain():
    try:
        logging.info("Đang tải model...")
        if not os.path.exists(MODEL_PATH):
            logging.error("Lỗi: Không tìm thấy model! Vui lòng chạy dịch vụ 'trainer' trước.")
            return

        lgbm_model = lgb.Booster(model_file=MODEL_PATH)
        logging.info("✅ Tải thành công!")
        
        sample_input = {
                "size": 90,
                "living_size": 270,
                "width": 4,
                "length": 22,
                "rooms": 5,
                "toilets": 5,
                "floors": 4,
                "longitude": 106.65461,
                "latitude": 10.864375,
                "category": "Nhà ở",
                "region": "Tp Hồ Chí Minh",
                "area": "Quận 12"
                }
        sample_data = pd.DataFrame([sample_input])
        
        for col in ['category', 'region', 'area']:
            sample_data[col] = sample_data[col].astype('category')
        
        predicted_price = lgbm_model.predict(sample_data)[0]

        logging.info("Đang phân tích dự đoán bằng SHAP...")
        explainer = shap.TreeExplainer(lgbm_model)
        shap_values_array = explainer.shap_values(sample_data)
        
        base_value = explainer.expected_value
        feature_names = lgbm_model.feature_name()
        shap_dict = dict(zip(feature_names, shap_values_array[0]))
        
        # <<< KẾT THÚC THAY ĐỔI TRIỆT ĐỂ >>>

        # --- TRÌNH BÀY KẾT QUẢ ---
        print("\n" + "="*50)
        print(" BÁO CÁO ĐỊNH GIÁ BẤT ĐỘNG SẢN")
        print("="*50)
        
        print(f"\n✨ GIÁ TRỊ ƯỚC TÍNH: {predicted_price:,.0f} VNĐ\n")

        print("--- PHÂN TÍCH CHI TIẾT CÁC YẾU TỐ ẢNH HƯỞNG ---")
        print(f"Giá khởi điểm (trung bình thị trường): {base_value:,.0f} VNĐ")
        
        sorted_shap = sorted(shap_dict.items(), key=lambda item: abs(item[1]), reverse=True)
        
        for feature_name, shap_val in sorted_shap:
            if abs(shap_val) < 1000:
                continue
            
            # Bây giờ 'feature_name' là tên cột gốc và sạch (ví dụ: 'size', 'area')
            feature_value = sample_input.get(feature_name, "N/A")
            
            arrow = "🔼" if shap_val > 0 else "🔽"
            sign = "+" if shap_val > 0 else ""
            
            print(f"{arrow} {feature_name:<15} = {str(feature_value):<15} | Ảnh hưởng: {sign}{shap_val:,.0f} VNĐ")

        print("\n" + "="*50)

    except Exception as e:
        logging.error(f"Đã xảy ra lỗi trong quá trình dự đoán: {e}", exc_info=True)

if __name__ == '__main__':
    predict_and_explain()