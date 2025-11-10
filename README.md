## Valumind

Tóm tắt luồng sử dụng: đăng nhập trang appraiser (ngân hàng) hoặc trang valumind (người vay) để gửi hình ảnh và thông tin tài sản, ứng dụng sẽ tạo định giá bằng AI được dạy từ các nguồn dữ liệu ở chợ tốt, bất động sản, ... Bên dưới là các trang được sử dụng:  

```
app: appraiser.pages.dev  
app: valumind.pages.dev  
api: api.vpbank.workers.dev  
auth: auth.vpbank.workers.dev  
```

### I/ Tài liệu kỹ thuật

```
📋 Mục lục

1. Tổng quan kiến trúc
2. Cấu trúc thư mục
3. Chi tiết các microservices' module
4. Kiến trúc Monorepos CI/CD
5. Kiến trúc Multi shared AWS Lambda Layer MLops 
6. Cài đặt môi trường
7. Sơ đồ kiến trúc tổng thể
```

#### 1. Tổng quan kiến trúc

Hệ thống AI Asset Valuation là một nền tảng định giá tài sản thông minh sử dụng Machine Learning và OCR, được xây dựng theo kiến trúc Microservices với Monorepo CI/CD và Multi-Layer Lambda Architecture.
Các thành phần chính:

* Frontend Layer: Admin (SPA) + App (Mobile PWA)
* Gateway Layer: API (API Gateway) + Auth (IAM)
* Business Logic Layer: Warp (AI Gateway)
* AI/ML Services Layer: OCR + Train + Predict
* Data Layer: Cron (Crawling)
* Infrastructure Layer: Shared (Lambda Layers) + .github (CI/CD)

#### 2. Cấu trúc thư mục

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

#### 3. Chi tiết các module

##### 3.1. Admin - Ứng dụng Web cho Ngân hàng
Mục đích: Cổng web bảo mật cho nhân viên ngân hàng xem xét hồ sơ vay vốn  
Công nghệ: React 19 + Next.js 16 + Tailwind CSS  
Cấu trúc:  

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

Tính năng chính:

* Xác thực email + Google OAuth
* Dashboard định giá bất động sản
* Upload và phân tích ảnh tài sản
* Xem chi tiết báo cáo định giá
* Quản lý hồ sơ vay vốn

Port mặc định: 3000  
Deployment: Cloudflare Pages (Next Build)
Production: AWS Amplify (Static Export)

##### 3.2. App - Ứng dụng Mobile PWA cho Người vay

Mục đích: Ứng dụng di động cho người vay định giá tài sản trước khi yêu cầu vay  
Công nghệ: React 19 + Vite + PWA + Google Maps  
Cấu trúc:  

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

Tính năng chính:

* PWA với offline support
* Quản lý danh sách tài sản
* Xem định giá trên bản đồ
* Chat với Bot tư vấn
* Lịch sử hoạt động

Port mặc định: 5173  
Deployment: Cloudflare Pages (Vite Build)  
Production: AWS Amplify (Vite Build) 