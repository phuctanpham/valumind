import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import boto3
from datetime import datetime
from io import BytesIO

from .models import PropertyReport, PropertyImage, get_db
from .schemas import PropertyReportCreate
from .auth_middleware import get_current_user
from .image_analysis_service import compress_image_if_needed, preprocess_image_for_ocr, convert_bytes_to_base64_for_analysis, analyze_images_to_property_form

import logging
logging.basicConfig(level=logging.INFO)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

logger.info("Training server starting...")
app = FastAPI(title="AI Asset Valuation API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:5173",
        "http://localhost:8000",
        "http://localhost:8001",
        "http://localhost:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# AWS S3
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION", "ap-southeast-1")
)

S3_BUCKET = os.getenv("S3_BUCKET", "ai-asset-valuation")
AWS_REGION = os.getenv("AWS_REGION", "ap-southeast-1")
logger = logging.getLogger(__name__)


def upload_to_s3(file_content: bytes, user_id: int, filename: str) -> dict:
    """Upload file to S3"""
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        year_month = datetime.now().strftime("%Y/%m")
        s3_key = f"assets/{year_month}/{user_id}/{timestamp}_{filename}"
        
        s3_client.upload_fileobj(
            BytesIO(file_content),
            S3_BUCKET,
            s3_key,
            ExtraArgs={'ContentType': 'image/jpeg'}
        )
        
        s3_url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
        return {"success": True, "url": s3_url, "key": s3_key}
    except Exception as e:
        logger.error(f"S3 upload error: {str(e)}")
        return {"success": False, "error": str(e)}


@app.post("/api/analysis/upload-and-analyze")
async def upload_and_analyze(
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload images và analyze với PREPROCESSING
    """
    try:
        images_base64 = []
        uploaded_urls = []
        
        user_id = int(current_user["user_id"])
        
        for file in files:
            content = await file.read()
            
            # Compress nếu cần
            content = compress_image_if_needed(content)
            
            # ✨ NEW: Preprocess trước khi analyze
            preprocessed_content = preprocess_image_for_ocr(content)
            
            # Convert to base64 for analysis (skip preprocess vì đã làm rồi)
            img_b64 = convert_bytes_to_base64_for_analysis(
                preprocessed_content, 
                preprocess=False  # Already preprocessed
            )
            images_base64.append(img_b64)
            
            # Upload ORIGINAL (không preprocess) lên S3
            s3_result = upload_to_s3(content, user_id, file.filename)
            if s3_result['success']:
                uploaded_urls.append({
                    "filename": file.filename,
                    "url": s3_result['url'],
                    "key": s3_result['key']
                })
        
        # Analyze với ảnh đã preprocess
        logger.info(f"Analyzing {len(images_base64)} preprocessed images")
        analysis_result = analyze_images_to_property_form(images_base64)
        
        if not analysis_result['success']:
            raise HTTPException(status_code=500, detail=analysis_result['error'])
        
        logger.info(f"Analysis successful. Tokens used: {analysis_result.get('usage')}")
        
        return {
            "success": True,
            "data": analysis_result['data'],
            "images": uploaded_urls,
            "usage": analysis_result.get('usage')
        }
    except Exception as e:
        logger.error(f"Upload error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/reports")
async def create_report(
    payload: PropertyReportCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new property report"""
    try:
        user_id = int(current_user["user_id"])
        
        report = PropertyReport(
            user_id=user_id,
            address=payload.address,
            property_type=payload.property_type,
            land_area=payload.land_area,
            usable_area=payload.usable_area,
            bedrooms=payload.bedrooms,
            bathrooms=payload.bathrooms,
            floors=payload.floors,
            direction=payload.direction,
            legal_status=payload.legal_status,
            furniture=payload.furniture,
            width=payload.width,
            length=payload.length,
            overall_condition=payload.overall_condition,
            cleanliness=payload.cleanliness,
            maintenance_status=payload.maintenance_status,
            major_issues=payload.major_issues,
            overall_description=payload.overall_description,
            ai_analysis_raw=payload.ai_analysis_raw
        )
        
        # Add images
        if payload.images:
            for img_data in payload.images:
                if isinstance(img_data, dict):
                    filename = img_data.get('filename', '')
                    url = img_data.get('url', '')
                    key = img_data.get('key', '')
                else:
                    filename = img_data.filename if hasattr(img_data, 'filename') else ''
                    url = img_data.url if hasattr(img_data, 'url') else ''
                    key = img_data.key if hasattr(img_data, 'key') else ''
                
                property_image = PropertyImage(
                    report=report,
                    s3_url=url,
                    s3_key=key,
                    original_filename=filename
                )
                db.add(property_image)
        
        db.add(report)
        db.commit()
        db.refresh(report)
        
        return {
            "success": True,
            "report_id": report.id,
            "created_at": report.created_at
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Create report error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/reports")
async def list_reports(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20,
    offset: int = 0
):
    """List user's property reports"""
    try:
        user_id = int(current_user["user_id"])
        
        reports = db.query(PropertyReport).filter(
            PropertyReport.user_id == user_id
        ).order_by(PropertyReport.created_at.desc()).offset(offset).limit(limit).all()
        
        return {
            "success": True,
            "reports": [
                {
                    "id": r.id,
                    "address": r.address,
                    "property_type": r.property_type,
                    "created_at": r.created_at,
                    "overall_condition": r.overall_condition,
                    "images_count": len(r.images)
                }
                for r in reports
            ]
        }
    except Exception as e:
        logger.error(f"List reports error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/reports/{report_id}")
async def get_report(
    report_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed report"""
    user_id = int(current_user["user_id"])
    
    report = db.query(PropertyReport).filter(
        PropertyReport.id == report_id,
        PropertyReport.user_id == user_id
    ).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return {
        "success": True,
        "report": {
            "id": report.id,
            "address": report.address,
            "property_type": report.property_type,
            "land_area": report.land_area,
            "usable_area": report.usable_area,
            "bedrooms": report.bedrooms,
            "bathrooms": report.bathrooms,
            "floors": report.floors,
            "direction": report.direction,
            "legal_status": report.legal_status,
            "furniture": report.furniture,
            "width": report.width,
            "length": report.length,
            "overall_condition": report.overall_condition,
            "cleanliness": report.cleanliness,
            "maintenance_status": report.maintenance_status,
            "major_issues": report.major_issues,
            "overall_description": report.overall_description,
            "images": [
                {
                    "id": img.id,
                    "url": img.s3_url,
                    "filename": img.original_filename,
                    "uploaded_at": img.uploaded_at
                }
                for img in report.images
            ],
            "created_at": report.created_at,
            "updated_at": report.updated_at
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
