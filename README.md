## I/ Giới thiệu dự án Valumind
**Tóm tắt luồng sử dụng:**
* đăng nhập trang appraiser (ngân hàng) hoặc trang valumind (người vay)
* gửi hình ảnh và thông tin tài sản vào ứng dụng
* đợi định giá bằng AI được dạy từ các nguồn dữ liệu ở chợ tốt, bất động sản, ... 

**Bên dưới là các trang được sử dụng:**
```
admin: appraiser.pages.dev  
app: valumind.pages.dev  
api: api.vpbank.workers.dev  
auth: auth.vpbank.workers.dev  
```
`codebase`: https://github.com/phuctanpham/valumind  
## II/ Tài liệu kỹ thuật
```
📋 Mục lục

1. Tổng quan kiến trúc
2. Cấu trúc thư mục
3. Chi tiết các microservices' module
4. Kiến trúc Monorepos driven Devsecops
5. Kiến trúc Shared Layers driven MLops
6. Cài đặt môi trường
7. Sơ đồ kiến trúc tổng thể
```

### 1. Tổng quan kiến trúc
Hệ thống AI Asset Valuation là một nền tảng định giá tài sản thông minh sử dụng Machine Learning và OCR, được xây dựng theo kiến trúc Microservices với Monorepo CI/CD và Multi-Layer Lambda Architecture.  
**Các thành phần chính:**
* Frontend Layer: Admin (SPA) + App (Mobile PWA)
* Gateway Layer: API (API Gateway) + Auth (IAM)
* Business Logic Layer: Warp (AI Gateway)
* AI/ML Services Layer: OCR + Train + Predict
* Data Layer: Cron (Crawling)
* Infrastructure Layer: Shared (Lambda Layers) + .github (CI/CD)

### 2. Cấu trúc thư mục
```
./
├── admin/                 # Web Admin SPA
├── app/                   # Mobile PWA
├── api/                   # API Gateway
├── auth/                  # IAM Service
├── warp/                  # Middle Gateway
├── ocr/                   # OCR Service
├── cron/                  # Data Crawling
├── train/                 # ML Training
├── predict/               # Valuation Service
├── shared/                # Lambda Layers
├── .github/               # CI/CD Workflows
│   ├── actions/           # Reusable Actions
│   ├── utils/             # Verification Scripts
│   └── workflows/         # GitHub Actions
├── testCICD.sh           # Local CI/CD Testing
└── README.md
```

### 3. Chi tiết các module
#### 3.1. Admin - Ứng dụng Web cho Ngân hàng
**Mục đích:** Cổng web bảo mật cho nhân viên ngân hàng xem xét hồ sơ vay vốn  
**Công nghệ:** React 19 + Next.js 16 + Tailwind CSS  
**Cấu trúc:**  
```
admin/
├── app/                   # Next.js App Router
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main entry
├── components/           # React Components
│   ├── auth/            # Authentication
│   ├── dashboard/       # Dashboard modules
│   └── ui/              # UI primitives
├── public/              # Static assets
├── next.config.mjs      # Next.js config
└── package.json
```
**Tính năng chính:**
* Xác thực email + Google OAuth
* Dashboard định giá bất động sản
* Upload và phân tích ảnh tài sản
* Xem chi tiết báo cáo định giá
* Quản lý hồ sơ vay vốn

**Port mặc định**: 3000  
**Deployment**: Cloudflare Pages (Next Build)  
**Production**: AWS Amplify (Static Export)

#### 3.2. App - Ứng dụng Mobile PWA cho Người vay
**Mục đích:** Ứng dụng di động cho người vay định giá tài sản trước khi yêu cầu vay  
**Công nghệ:** React 19 + Vite + PWA + Google Maps  
**Cấu trúc:**  
```
app/
├── src/
│   ├── components/       # React Components
│   │   ├── BotTab.tsx   # Chat với AI
│   │   ├── DetailTab.tsx # Chi tiết tài sản
│   │   ├── ValuationTab.tsx # Định giá
│   │   └── ...
│   ├── App.tsx          # Main App
│   ├── main.tsx         # Entry point
│   └── sw.ts            # Service Worker
├── public/
│   ├── manifest.json    # PWA Manifest
│   └── mock.json        # Mock data
├── vite.config.ts       # Vite + PWA config
└── package.json
```
**Tính năng chính:**
* PWA với offline support
* Quản lý danh sách tài sản
* Xem định giá trên bản đồ
* Chat với Bot tư vấn
* Lịch sử hoạt động

**Port mặc định**: 5173  
**Deployment**: Cloudflare Pages (Vite Build)  
**Production**: AWS Amplify (Vite Build) 

#### 3.3. API - API Gateway
**Mục đích:** Cổng API duy nhất cho cả Admin và App giao tiếp với backend  
**Công nghệ:** Node.js + Hono.js (Express-like framework)  
**Cấu trúc:**  
```
api/
├── src/
│   └── main.ts          # API Routes
├── wrangler.toml        # Cloudflare config
└── package.json
```
**Tính năng chính:**
* Quản lý giới hạn giao dịch (Rare limit)  
* Kiểm tra token hiệu lực
* Lưu tạm Hoãn giao dịch có token hết hiệu lực và thông báo auth
* Gửi giao dịch có token còn hiệu lực vào hàng đợi và thông báo cho warp
* Quản lý timeout các giao dịch tronng hàng đợi.

**Port mặc định**: 8787  
**Deployment**: Cloudflare Worker  
**Production**: AWS Lambda Function  

#### 3.4. Auth - Identity & Access Manager
**Mục đích**: Xác thực và phân quyền cho mọi giao dịch giữa API và thiết bị client  
**Công nghệ**: Node.js + Hono.js + JWT + Bcrypt  
**Cấu trúc**:
```
auth/
├── src/
│   └── main.ts          # Auth Routes
└── wrangler.toml
```

**Tính năng chính:**
* đăng ký, đăng nhập và phục hồi tài khoản
* phát hành accessToken và refreshToken
* Quản lý các thiếc bị dăng nhập

**Port mặc định**: `8788`  
**Deployment**: Cloudflare Workers    
**Production**: AWS Lambda Function

#### 3.5. Warp - AI Gateway
**Mục đích**: Tăng cường bảo mật kiểm toán tất cả dữ liệu ra vào các worker AI bên dưới  
**Công nghệ**: Python 3.11 + FastAPI + SQLAlchemy + JWT  
**Cấu trúc**:   
```
warp/
├── src/
│   ├── main.py                     # FastAPI App
│   ├── models.py                   # SQLAlchemy Models
│   ├── schemas.py                  # Pydantic Schemas
│   ├── auth.py                     # JWT Auth
│   ├── auth_routes.py              # Auth Endpoints
│   ├── email_service.py            # Email Service
│   ├── image_analysis_service.py   # AI Image Analysis
│   ├── parsers.py                  # Text Parsers
│   └── valuation.py                # Valuation Logic
├── requirements.txt
└── lambda_handler.py
```
**Tính năng chính:**
* Kiểm toán dữ liệu ra vào các worker AI
* Trao đổi dữ liệu giữa API gateway và các AI Workers 
* Ghi và lấy dữ liệu từ các Database

**Port mặc định**: `8000`  
**Deployment**: Cloudflare Worker AIAI  
**Production**: AWS Lambda Function + AWS Lambda Layer  

#### 3.6. OCR - Optical Character Recognition Service
**Mục đích**: Nhận diện và trích xuất thông tin từ giấy chứng nhận tài sản  
**Công nghệ**: Python 3.11 + OpenCV + Pillow + OpenAI GPT-4V  
**Cấu trúc**:  
```
ocr/
├── src/
│   ├── main.py          # FastAPI App
│   └── lambda_handler.py
└── requirements.txt
```
**Tính năng chính**:
- Nhận diện text từ ảnh chứng nhận
- Multi-pass OCR strategy
- Image preprocessing
- Trích xuất structured data

**Port mặc định**: `8001  
**Deployment**: Cloudflare Workers AI  
**Production**: AWS Lambda Function  

#### 3.7. Cron - Data Crawling Service
**Mục đích**: Thu thập và làm sạch dữ liệu từ các trang BĐS (Chợ Tốt, Batdongsan, ...)  
**Công nghệ**: Python 3.11 + FastAPI + SQLAlchemy + BeautifulSoup/Scrapy  
**Cấu trúc**:  
```
cron/
├── src/
│   ├── main.py          # Task Scheduler
│   └── lambda_handler.py
└── requirements.txt
```
**Tính năng chính:**
* Scheduled tasks quản lý
* Data crawling từ nhiều nguồn
* Data cleaning và normalization
* Lưu vào database bằng warp

**Port mặc định**: `8002`  
**Deployment**: Cloudflare Worker 
**Production**: AWS Lambda Function  

#### 3.8. Train - ML Training Service
**Mục đích**: Huấn luyện mô hình Machine Learning từ dữ liệu đã crawl  
**Công nghệ**: Python 3.11 + LightGBM + Scikit-learn + Pandas  
**Cấu trúc**:  
```
train/
├── src/
│   ├── main.py          # Training Pipeline
│   └── lambda_handler.py
└── requirements.txt
```

**Tính năng chính**:
- Data preprocessing
- Feature engineering
- Model training với LightGBM
- Model evaluation
- Save model artifacts lên S3

**Port mặc định**: `8003`  
**Deployment**: CLoudflare Worker AI + Cloudflare R2  
**Production**: AWS Lambda Function + AWS S3  

#### 3.9. Predict - Valuation Service
**Mục đích**: API định giá tài sản sử dụng mô hình đã huấn luyện  
**Công nghệ**: Python 3.11 + LightGBM + SHAP + FastAPI  
**Cấu trúc**:  
```
predict/
├── src/
│   ├── main.py          # Prediction API
│   ├── schemas.py       # Pydantic Models
│   └── lambda_handler.py
└── requirements.txt
```

**Tính năng chính:**
* Load model từ S3
* Real-time prediction
* SHAP explainability (giải thích dự đoán)
* Feature validation

**Port mặc định**: `8004`  
**Deployment**:CLoudflare Worker AI + Cloudflare R2  
**Production**: AWS Lambda Function + Model từ S3  

#### 3.10. Shared - Packages for Shared Layers driven MLops Architecture  
**Mục đích**: Chia sẻ dependencies giữa các Lambda functions để giảm deployment size  
**Công nghệ**: Python packages precompiled cho `manylinux2014_x86_64`  
**Cấu trúc**:  
```
shared/
├── shared_requirement_layer.txt      # FastAPI, Pydantic
├── ml_requirement_layer_1.txt        # Pandas, Numpy
├── ml_requirement_layer_2.txt        # LightGBM, Scikit-learn
├── ml_requirement_layer_3.txt        # Matplotlib, Geopy
├── ml_requirement_layer_4.txt        # Tabulate, Cloudpickle
├── ml_requirement_layer_5.txt        # SHAP
├── ocr_requirement_layer_1.txt       # Pillow, Numpy
├── ocr_requirement_layer_2.txt       # OpenCV
└── ocr_requirement_layer_3.txt       # OpenAI
```

**Layers mapping**:
* **predict** và **train**: `shared` + `ml1` + `ml2` + `ml3` + `ml4` + `ml5`
* **ocr**, **warp**, **cron**: `shared` + `ocr1` + `ocr2` + `ocr3`

**Lợi ích**:
* Giảm deployment package size (từ 500MB → 50MB)
* Deploy nhanh hơn
* Chia sẻ dependencies chung
* Tránh cold start lâu

#### 3.11. .github - CI/CD of Monorepos driven Devsecops Architecture
**Mục đích**: DevSecOps pipeline tự động không để lộ secrets giữa các repos  
**Công nghệ**: GitHub Actions + Reusable Workflows  
**Cấu trúc**:  
```
.github/
├── actions/                          # Reusable Actions
│   ├── build-lambda-package/         # Build Lambda ZIP
│   ├── setup-node/                   # Setup Node.js
│   └── setup-python/                 # Setup Python
├── utils/                            # Verification Scripts
│   ├── aws-lambda.sh                 # Verify AWS Lambda
│   ├── cloudflare.sh                 # Verify Cloudflare
│   └── build-layer.sh                # Build Lambda Layer
└── workflows/                        # GitHub Actions Workflows
    ├── main.yml                      # Main CI/CD
    ├── deploy-layers.yml             # Deploy Layers
    ├── aws-lambda.yml                # Deploy Lambda (single)
    ├── aws-lambda-with-layer.yml     # Deploy Lambda (with layers)
    ├── cloudflare-pages.yml          # Deploy CF Pages
    └── cloudflare-workers.yml        # Deploy CF Workers
```
**Deployment**: github action + aws cli + cloudflare cli  

### 4. Kiến trúc Monorepos drive Devsecops
#### 4.1. Main Workflow 
**Workflow:** `main.yml`  
**Trigger:** Push/PR to main branch  
**Flow:**
```
1. Detect Changes (dorny/paths-filter)
   ↓
2. Deploy Changed Services (parallel)
   ├── admin → cloudflare-pages.yml
   ├── app → cloudflare-pages.yml
   ├── api → cloudflare-workers.yml
   ├── auth → cloudflare-workers.yml
   ├── warp → aws-lambda-with-layer.yml
   ├── ocr → aws-lambda-with-layer.yml
   ├── cron → aws-lambda-with-layer.yml
   ├── train → aws-lambda-with-layer.yml
   ├── predict → aws-lambda-with-layer.yml
   └── shared → deploy-layers.yml
```
Ví dụ: Nếu chỉ sửa admin/, chỉ deploy admin, không deploy các service khác.  

#### 4.2. Lambda Deployment với Layers
**Workflow:** `aws-lambda-with-layer.yml`  
**Trigger:** directories change in branch `main`    
**Steps:**  
```
1. Checkout code
2. Setup Python 3.11
3. Configure AWS credentials
4. Get latest layer ARNs (shared, ml1-5, ocr1-3)
5. Build app package
   - Install dependencies
   - Copy source code
   - Clean __pycache__, tests, ...
6. Download model (if needed) from S3
7. Create deployment ZIP
8. Check size
9. Upload to S3
10. Determine layers based on function name
11. Update Lambda function code
12. Update Lambda configuration (layers, timeout, memory, env vars)
```
layer logic:  
```
if function == "predict" or "train":
  layers = shared + ml1 + ml2 + ml3 + ml4 + ml5
elif function == "warp" or "cron" or "ocr":
  layers = shared + ocr1 + ocr2 + ocr3
```

#### 4.3. Cloudflare Deployment
**Workflow:** `cloudflare-pages.yml`  
**Trigger:** frontend directories change in branch `test`    
**Steps:**  
```
1. Checkout code
2. Setup Node.js với npm cache
3. Install dependencies (npm ci)
4. Build
5. Detect build output (out/dist/build)
6. Deploy to Cloudflare Pages
```
#### 4.4. Secrets Management
Required Secrets:  
```
# AWS
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
AWS_BUCKET_NAME
AWS_ACCOUNT_ID

# Lambda Functions
AWS_LAMBDA_PREDICT_FUNCTION_NAME
AWS_LAMBDA_TRAIN_FUNCTION_NAME
AWS_LAMBDA_WARP_FUNCTION_NAME
AWS_LAMBDA_CRON_FUNCTION_NAME
AWS_LAMBDA_OCR_FUNCTION_NAME

# Cloudflare
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID

# Database
DATABASE_URL

# APIs
OPENAI_API_KEY

# Email
SMTP_HOST
SMTP_PORT
SMTP_USERNAME
SMTP_PASSWORD
SMTP_FROM_EMAIL
SMTP_FROM_NAME

# URLs
ADMIN_URL
WARP_URL
```
## 5. Kiến trúc Shared Layers driven MLops

### 5.1. Tại sao cần Layers?

**Vấn đề**: Lambda deployment package giới hạn 250MB (direct), 50MB (compressed)
L
**Giải pháp**: Tách dependencies thành Layers (tối đa 5 layers/function, 250MB/layer)

### 5.2. Layer Strategy

**Shared Layer** (cho tất cả):
```
fastapi==0.104.1
mangum==0.17.0
pydantic==2.5.0
python-dotenv==1.0.0
```

**ML Layers** (cho train/predict):
```
Layer 1: pandas, numpy
Layer 2: lightgbm, scikit-learn
Layer 3: matplotlib, geopy, joblib
Layer 4: tabulate, cloudpickle, packaging, slicer
Layer 5: shap
```

**OCR Layers** (cho ocr/warp/cron):
```
Layer 1: Pillow, numpy
Layer 2: opencv-python-headless
Layer 3: openai
```
### 6. Cài đặt môi trường localhost
#### 6.1. Environment Variables
Tạo file `.env` ở root:  
```
# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-southeast-1
AWS_BUCKET_NAME=your_bucket_name
AWS_ACCOUNT_ID=your_aws_account_id

# Lambda Functions
AWS_LAMBDA_PREDICT_FUNCTION_NAME=predict
AWS_LAMBDA_TRAIN_FUNCTION_NAME=train
AWS_LAMBDA_WARP_FUNCTION_NAME=warp
AWS_LAMBDA_CRON_FUNCTION_NAME=cron
AWS_LAMBDA_OCR_FUNCTION_NAME=ocr
AWS_LAMBDA_SHARED_FUNCTION_LAYER)NAME=shared
AWS_LAMBDA_OCR1_FUNCTION_LAYER)NAME=ocr1
AWS_LAMBDA_OCR2_FUNCTION_LAYER)NAME=ocr2
AWS_LAMBDA_ORC3_FUNCTION_LAYER)NAME=ocr3
AWS_LAMBDA_ML1_FUNCTION_LAYER)NAME=ml1
AWS_LAMBDA_ML2_FUNCTION_LAYER)NAME=ml2
AWS_LAMBDA_ML3_FUNCTION_LAYER)NAME=ml3
AWS_LAMBDA_ML4_FUNCTION_LAYER)NAME=ml4
AWS_LAMBDA_ML5_FUNCTION_LAYER)NAME=ml5

# Cloudflare
CLOUDFLARE_API_TOKEN=your_cf_token
CLOUDFLARE_ACCOUNT_ID=your_cf_account_id

# Database (NeonDB PostgreSQL)
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/db?sslmode=require

# OpenAI
OPENAI_API_KEY=sk-xxx

# Email (Gmail App Password)
SMTP_HOST=your_email_smtp_host
SMTP_PORT=your_email_smtp_port 
SMTP_USERNAME=your_email@domain
SMTP_PASSWORD=your_app_password
SMTP_FROM_EMAIL=your_email@gmail.com
SMTP_FROM_NAME=your_app_name

# URLs
ADMIN_URL=http://localhost:3000
WARP_URL=http://localhost:8000

# Security
WARP_KEY=your-secret-jwt-key-change-in-production
```
#### 6.2. Setup Script
Tạo file `setup.sh`:  
```
#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Install from https://nodejs.org/"
        exit 1
    fi
    print_info "Node.js: $(node --version)"
    
    # Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 not found. Install from https://python.org/"
        exit 1
    fi
    print_info "Python: $(python3 --version)"
    
    # Docker (optional)
    if command -v docker &> /dev/null; then
        print_info "Docker: $(docker --version)"
    else
        print_warning "Docker not found (optional)"
    fi
}

# Setup Admin (React/Next.js)
setup_admin() {
    print_info "Setting up Admin..."
    cd admin
    npm install
    cd ..
    print_info "✅ Admin setup complete (Port 3000)"
}

# Setup App (React/Vite)
setup_app() {
    print_info "Setting up App..."
    cd app
    npm install
    cd ..
    print_info "✅ App setup complete (Port 5173)"
}

# Setup API (Node.js/Hono)
setup_api() {
    print_info "Setting up API..."
    cd api
    npm install
    cd ..
    print_info "✅ API setup complete (Port 8787)"
}

# Setup Auth (Node.js/Hono)
setup_auth() {
    print_info "Setting up Auth..."
    cd auth
    npm install
    cd ..
    print_info "✅ Auth setup complete (Port 8788)"
}

# Setup Warp (Python/FastAPI)
setup_warp() {
    print_info "Setting up Warp..."
    cd warp
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    deactivate
    cd ..
    print_info "✅ Warp setup complete (Port 8000)"
}

# Setup OCR (Python/FastAPI)
setup_ocr() {
    print_info "Setting up OCR..."
    cd ocr
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    deactivate
    cd ..
    print_info "✅ OCR setup complete (Port 8001)"
}

# Setup Cron (Python/FastAPI)
setup_cron() {
    print_info "Setting up Cron..."
    cd cron
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    deactivate
    cd ..
    print_info "✅ Cron setup complete (Port 8002)"
}

# Setup Train (Python/LightGBM)
setup_train() {
    print_info "Setting up Train..."
    cd train
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    deactivate
    cd ..
    print_info "✅ Train setup complete (Port 8003)"
}

# Setup Predict (Python/LightGBM)
setup_predict() {
    print_info "Setting up Predict..."
    cd predict
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    deactivate
    cd ..
    print_info "✅ Predict setup complete (Port 8004)"
}

# Main
main() {
    echo "======================================"
    echo "  AI Asset Valuation Setup Script"
    echo "======================================"
    echo ""
    
    check_prerequisites
    
    # Check .env
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating template..."
        cp .env.example .env 2>/dev/null || touch .env
        print_warning "Please configure .env before running services"
    fi
    
    echo ""
    print_info "Select services to setup:"
    echo "  1) All services"
    echo "  2) Frontend only (admin + app)"
    echo "  3) Backend only (warp + ocr + cron + train + predict)"
    echo "  4) Custom selection"
    read -p "Enter choice (1-4): " choice
    
    case $choice in
        1)
            setup_admin
            setup_app
            setup_api
            setup_auth
            setup_warp
            setup_ocr
            setup_cron
            setup_train
            setup_predict
            ;;
        2)
            setup_admin
            setup_app
            ;;
        3)
            setup_warp
            setup_ocr
            setup_cron
            setup_train
            setup_predict
            ;;
        4)
            echo ""
            read -p "Setup admin? (y/n): " ans
            [[ $ans == "y" ]] && setup_admin
            
            read -p "Setup app? (y/n): " ans
            [[ $ans == "y" ]] && setup_app
            
            read -p "Setup api? (y/n): " ans
            [[ $ans == "y" ]] && setup_api
            
            read -p "Setup auth? (y/n): " ans
            [[ $ans == "y" ]] && setup_auth
            
            read -p "Setup warp? (y/n): " ans
            [[ $ans == "y" ]] && setup_warp
            
            read -p "Setup ocr? (y/n): " ans
            [[ $ans == "y" ]] && setup_ocr
            
            read -p "Setup cron? (y/n): " ans
            [[ $ans == "y" ]] && setup_cron
            
            read -p "Setup train? (y/n): " ans
            [[ $ans == "y" ]] && setup_train
            
            read -p "Setup predict? (y/n): " ans
            [[ $ans == "y" ]] && setup_predict
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
    
    echo ""
    print_info "======================================"
    print_info "Setup complete!"
    print_info "======================================"
    echo ""
    echo "Port assignments:"
    echo "  Admin:   http://localhost:3000"
    echo "  App:     http://localhost:5173"
    echo "  API:     http://localhost:8787"
    echo "  Auth:    http://localhost:8788"
    echo "  Warp:    http://localhost:8000"
    echo "  OCR:     http://localhost:8001"
    echo "  Cron:    http://localhost:8002"
    echo "  Train:   http://localhost:8003"
    echo "  Predict: http://localhost:8004"
    echo ""
    print_info "Run './start.sh' to start all services"
}

main
```

#### 6.3. Start Script
Tạo file `start.sh`:  
```
#!/bin/bash

GREEN='\033[0;32m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# Start Admin
start_admin() {
    print_info "Starting Admin on port 3000..."
    cd admin
    npm run dev &
    cd ..
}

# Start App
start_app() {
    print_info "Starting App on port 5173..."
    cd app
    npm run dev &
    cd ..
}

# Start API
start_api() {
    print_info "Starting API on port 8787..."
    cd api
    npm run dev &
    cd ..
}

# Start Auth
start_auth() {
    print_info "Starting Auth on
    print_info "Starting Auth on port 8788..."
    cd auth
    npm run dev &
    cd ..
}

# Start Warp
start_warp() {
    print_info "Starting Warp on port 8000..."
    cd warp
    source venv/bin/activate
    uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload &
    deactivate
    cd ..
}

# Start OCR
start_ocr() {
    print_info "Starting OCR on port 8001..."
    cd ocr
    source venv/bin/activate
    uvicorn src.main:app --host 0.0.0.0 --port 8001 --reload &
    deactivate
    cd ..
}

# Start Cron
start_cron() {
    print_info "Starting Cron on port 8002..."
    cd cron
    source venv/bin/activate
    uvicorn src.main:app --host 0.0.0.0 --port 8002 --reload &
    deactivate
    cd ..
}

# Start Train
start_train() {
    print_info "Starting Train on port 8003..."
    cd train
    source venv/bin/activate
    uvicorn src.main:app --host 0.0.0.0 --port 8003 --reload &
    deactivate
    cd ..
}

# Start Predict
start_predict() {
    print_info "Starting Predict on port 8004..."
    cd predict
    source venv/bin/activate
    uvicorn src.main:app --host 0.0.0.0 --port 8004 --reload &
    deactivate
    cd ..
}

# Kill all processes
cleanup() {
    print_info "Stopping all services..."
    pkill -f "npm run dev"
    pkill -f "uvicorn"
    print_info "All services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Main
main() {
    echo "======================================"
    echo "  Starting AI Asset Valuation Services"
    echo "======================================"
    echo ""
    
    # Load .env
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    echo "Select services to start:"
    echo "  1) All services"
    echo "  2) Frontend only (admin + app)"
    echo "  3) Backend only (warp + ocr + cron + train + predict)"
    echo "  4) Essential (admin + app + warp + predict)"
    read -p "Enter choice (1-4): " choice
    
    case $choice in
        1)
            start_admin
            start_app
            start_api
            start_auth
            start_warp
            start_ocr
            start_cron
            start_train
            start_predict
            ;;
        2)
            start_admin
            start_app
            ;;
        3)
            start_warp
            start_ocr
            start_cron
            start_train
            start_predict
            ;;
        4)
            start_admin
            start_app
            start_warp
            start_predict
            ;;
        *)
            echo "Invalid choice"
            exit 1
            ;;
    esac
    
    echo ""
    print_info "======================================"
    print_info "All selected services started!"
    print_info "======================================"
    echo ""
    echo "Access URLs:"
    echo "  Admin:   http://localhost:3000"
    echo "  App:     http://localhost:5173"
    echo "  Warp:    http://localhost:8000/docs"
    echo "  Predict: http://localhost:8004/docs"
    echo ""
    print_info "Press Ctrl+C to stop all services"
    
    # Wait forever
    while true; do
        sleep 1
    done
}

main
```

### 7. Sơ đồ kiến trúc tổng thể

#### 7.1. Kiến trúc hệ thống
```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │   Admin (Web)    │              │   App (Mobile)   │         │
│  │  React + Next.js │              │  React + Vite    │         │
│  │  Port: 3000      │              │  Port: 5173      │         │
│  │  CF Pages        │              │  CF Pages + PWA  │         │
│  └────────┬─────────┘              └────────┬─────────┘         │
│           │                                 │                   │
└───────────┼─────────────────────────────────┼───────────────────┘
            │                                 │
            └────────────┬────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      GATEWAY LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │   API Gateway    │◄────────────►│   Auth (IAM)     │         │
│  │   Hono.js        │              │   Hono.js + JWT  │         │
│  │   Port: 8787     │              │   Port: 8788     │         │
│  │   CF Workers     │              │   CF Workers     │         │
│  └────────┬─────────┘              └──────────────────┘         │
│           │                                                     │
└───────────┼─────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                          │
├─────────────────────────────────────────────────────────────────┤AI
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐     │
│  │                  Warp (AI Gateway)                     │     │
│  │              Python + FastAPI                          │     │
│  │              Port: 8000                                │     │
│  │              AWS Lambda + Function URL                 │     │
│  │                                                        │     │
│  │  Features:                                             │     │
│  │  • Email Auth + Verification                           │     │
│  │  • S3 Upload                                           │     │
│  │  • AI Image Analysis (GPT-4V)                          │     │
│  │  • Multi-pass OCR                                      │     │
│  │  • Report Management                                   │     │
│  └────────┬───────────────────────────────────────────────┘     │
│           │                                                     │
└───────────┼─────────────────────────────────────────────────────┘
            │
            ├──────────────┬──────────────┬──────────────┐
            ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     AI/ML SERVICES LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐   │
│  │   OCR    │    │   Cron   │    │  Train   │    │ Predict  │   │
│  │ OpenCV + │    │  Scrapy  │    │ LightGBM │    │ LightGBM │   │
│  │  GPT-4V  │    │ FastAPI  │    │ FastAPI  │    │ + SHAP   │   │
│  │          │    │          │    │          │    │ FastAPI  │   │
│  │ Port:    │    │ Port:    │    │ Port:    │    │ Port:    │   │
│  │  8001    │    │  8002    │    │  8003    │    │  8004    │   │
│  │          │    │          │    │          │    │          │   │
│  │ Lambda   │    │ Lambda + │    │ Lambda   │    │ Lambda   │   │
│  │ +OCR     │    │EventBridge│   │ +ML      │    │ +ML      │   │
│  │ Layers   │    │          │    │ Layers   │    │ Layers   │   │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘   │
│       │               │               │               │         │
└───────┼───────────────┼───────────────┼───────────────┼─────────┘
        │               │               │               │
        └───────────────┴───────────────┴───────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   NeonDB     │    │   AWS S3     │    │  External    │       │
│  │  PostgreSQL  │    │  (Storage)   │    │  Data        │       │
│  │              │    │              │    │  Sources     │       │
│  │  • Users     │    │  • Images    │    │              │       │
│  │  • Reports   │    │  • Models    │    │ • Chợ Tốt    │       │
│  │  • Images    │    │  • Layers    │    │ • BĐS.vn     │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
#### 7.2. Lambda Layer Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                   AWS LAMBDA FUNCTIONS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Predict  │  │  Train   │  │   Warp   │  │   OCR    │         │
│  │ (50MB)   │  │ (50MB)   │  │ (30MB)   │  │ (30MB)   │         │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘         │
│       │             │             │             │               │
│       └──────┬──────┴──────┬──────┴──────┬──────┘               │
│              │             │             │                      │
└──────────────┼─────────────┼─────────────┼──────────────────────┘
               │             │             │
               ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LAMBDA LAYERS (Shared)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐       │
│  │  Layer: shared (25MB)                                │       │
│  │  • FastAPI, Pydantic, Mangum, python-dotenv          │       │
│  │  Used by: ALL functions                              │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐       │
│  │  ML Layers (for Predict + Train)                     │       │
│  ├──────────────────────────────────────────────────────┤       │
│  │  Layer 1 (80MB): pandas, numpy                       │       │
│  │  Layer 2 (100MB): lightgbm, scikit-learn             │       │
│  │  Layer 3 (60MB): matplotlib, geopy, joblib           │       │
│  │  Layer 4 (40MB): tabulate, cloudpickle, packaging    │       │
│  │  Layer 5 (70MB): shap                                │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐       │
│  │  OCR Layers (for Warp + OCR + Cron)                  │       │
│  ├──────────────────────────────────────────────────────┤       │
│  │  Layer 1 (50MB): Pillow, numpy                       │       │
│  │  Layer 2 (150MB): opencv-python-headless             │       │
│  │  Layer 3 (20MB): openai                              │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Lợi ích**:
* Deployment size: 500MB → 50MB (~90% giảm)
* Cold start: ~8s → ~2s (~75% nhanh hơn)
* Reusable: 1 layer cho nhiều functions
* Update độc lập: Chỉ update layer khi thay đổi dependencies

#### 7.3. CI/CD Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                         DEVELOPER                               │
│                    git push origin main                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      GITHUB ACTIONS                             │
│                    (Monorepo CI/CD)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: Detect Changes (dorny/paths-filter)                    │
│  ┌─────────────────────────────────────────────────┐            │
│  │  Changed: admin/, app/, warp/, predict/         │            │
│  └─────────────────────────────────────────────────┘            │
│                                                                 │
│  Step 2: Deploy Changed Services (Parallel)                     │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Deploy Admin │  │ Deploy App   │  │ Deploy Warp  │           │
│  │ CF Pages     │  │ CF Pages     │  │ AWS Lambda   │           │
│  │              │  │              │  │ with Layers  │           │
│  │ 1. Build     │  │ 1. Build     │  │              │           │
│  │ 2. Deploy    │  │ 2. Deploy    │  │ 1. Get Layers│           │
│  │              │  │              │  │ 2. Build     │           │
│  │ ✓ Success    │  │ ✓ Success    │  │ 3. Upload S3 │           │
│  └──────────────┘  └──────────────┘  │ 4. Update    │           │
│                                      │              │           │
│                                      │ ✓ Success    │           │
│                                      └──────────────┘           │
│                                                                 │
│  ┌──────────────┐                                               │
│  │Deploy Predict│                                               │
│  │ AWS Lambda   │                                               │
│  │              │                                               │
│  │ 1. Get Layers│                                               │
│  │ 2. Download  │                                               │
│  │    Model     │                                               │
│  │ 3. Build     │                                               │
│  │ 4. Upload S3 │                                               │
│  │ 5. Update    │                                               │
│  │              │                                               │
│  │ ✓ Success    │                                               │
│  └──────────────┘                                               │
│                                                                 │
│  Step 3: Notification (Optional)                                │
│  ┌─────────────────────────────────────────────────┐            │
│  │  Deployment Summary:                            │            │
│  │  • admin: ✓ Deployed                            │            │
│  │  • app: ✓ Deployed                              │            │
│  │  • warp: ✓ Deployed                             │            │
│  │  • predict: ✓ Deployed                          │            │
│  └─────────────────────────────────────────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 7.4. Data Flow - Upload & Analysis
```
┌─────────────────────────────────────────────────────────────────┐
│                         USER (PWA)                              │
│               Upload Images + Request Analysis                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Admin (SPA)                                │
│          POST /api/analysis/upload-and-analyze                  │
│          Authorization: Bearer {token}                          │
│          Files: [image1.jpg, image2.jpg, ...]                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│    Ocr Service + Warp Service + Auth Service + API Service      │
│                                                                 │
│  1. Authenticate User (JWT)                                     │
│  2. For each image:                                             │
│     ├─ Compress if > 20MB                                       │
│     ├─ Preprocess (contrast, sharpen, denoise)                  │
│     ├─ Convert to base64                                        │
│     └─ Upload original to S3                                    │
│                                                                 │
│  3. Call OpenAI GPT-4V (PASS 1)                                 │
│     ├─ Comprehensive extraction                                 │
│     └─ Focus on critical fields                                 │
│                                                                 │
│  4. Validate critical fields                                    │
│     └─ If missing → PASS 2 (targeted retry)                     │
│                                                                 │
│  5. Return analysis result                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Admin (SPA)                              │
│                                                                 │
│  • Display extracted data                                       │
│  • Allow user to review/edit                                    │
│  • Submit to create report                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Predict Service + Warp Service + Auth Service + API Service    │
│                   POST /api/reports                             │
│                                                                 │
│  • Save report to NeonDB                                        │
│  • Link images from S3                                          │
│  • Store AI analysis raw                                        │
└─────────────────────────────────────────────────────────────────┘
```

#### 7.5. Data Flow - Valuation
```
┌─────────────────────────────────────────────────────────────────┐
│                         USER (PWA)                              │
│                 Request Property Valuation                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                            API                                  │
│                   POST /predict                                 │
│                   Body: Property Features                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Predict Service + Warp Service                     │
│                                                                 │
│  1. Load LightGBM Model from Memory                             │
│     (Pre-loaded at cold start from S3)                          │
│                                                                 │
│  2. Validate Input Features                                     │
│     ├─ size, living_size, width, length                         │
│     ├─ rooms, toilets, floors                                   │
│     ├─ longitude, latitude                                      │
│     └─ category, region, area                                   │
│                                                                 │
│  3. Transform Features                                          │
│     ├─ Convert categorical to category dtype                    │
│     └─ Create pandas DataFrame                                  │
│                                                                 │
│  4. Predict Price                                               │
│     └─ model.predict(features)                                  │
│                                                                 │
│  5. Calculate SHAP Values                                       │
│     ├─ explainer.shap_values(features)                          │
│     ├─ Sort by importance                                       │
│     └─ Create explanation                                       │
│                                                                 │
│  6. Return Response                                             │
│     ├─ estimated_price_vnd                                      │
│     └─ analysis (base_price + factors)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      App Frontend                               │
│                                                                 │
│  • Display estimated price                                      │
│  • Show SHAP explanation                                        │
│  • Visualize factors on chart                                   │
└─────────────────────────────────────────────────────────────────┘
```

