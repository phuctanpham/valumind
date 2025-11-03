# predictor.Dockerfile

# Sử dụng cùng một base image với trainer để đảm bảo tính nhất quán
FROM python:3.10-slim

# Cài đặt các thư viện hệ thống cần thiết (ví dụ: libgomp1 cho LightGBM, libgl1 cho matplotlib)
RUN apt-get update && \
    apt-get install -y --no-install-recommends libgomp1 && \
    rm -rf /var/lib/apt/lists/*

# Thiết lập thư mục làm việc bên trong container
WORKDIR /app

# Copy file requirements và cài đặt
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY ./model_artifacts/test_predict.py .

# File predict.py và model_artifacts sẽ được mount vào qua docker-compose
# nên không cần lệnh COPY ở đây.

COPY ./model_artifacts/preprocessor.pkl .
COPY ./model_artifacts/metadata.json .
COPY ./model_artifacts/lightgbm_model.txt .


# CMD mặc định là chạy script dự đoán
CMD ["python", "test_predict.py"]