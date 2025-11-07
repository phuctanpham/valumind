# predictor.Dockerfile

# Sử dụng cùng một base image với trainer để đảm bảo tính nhất quán
FROM python:3.10-slim

# Cài đặt các thư viện hệ thống cần thiết (ví dụ: libgomp1 cho LightGBM)
RUN apt-get update && \
    apt-get install -y --no-install-recommends libgomp1 && \
    rm -rf /var/lib/apt/lists/*

# Thiết lập thư mục làm việc bên trong container
WORKDIR /app

# Copy file requirements và cài đặt
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy tất cả các artifact của model vào trong image
COPY ./model_artifacts /app/model_artifacts

# CMD mặc định là chạy script dự đoán
CMD ["python", "/app/model_artifacts/test_predict.py"]
