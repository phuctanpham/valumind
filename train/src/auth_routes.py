# auth_routes.py - Email authentication routes
from fastapi import APIRouter, HTTPException, Depends, status, Query
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from .models import User, get_db
from .auth import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    create_verification_token,
    is_valid_email,
    get_current_user,
    validate_password  
)
from .email_service import send_verification_email, send_password_reset_email
import os

router = APIRouter(prefix="/api/auth", tags=["authentication"])

AUTH_GUI_URL = os.getenv("AUTH_GUI_URL", "http://localhost:3001")
AUTH_API_URL = os.getenv("AUTH_API_URL", "http://localhost:8000")

# =====================================================
# REQUEST/RESPONSE SCHEMAS
# =====================================================

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# =====================================================
# ROUTES
# =====================================================

@router.post("/register")
async def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """Register new user with email"""
    try:
        # Check if user exists
        existing_user = db.query(User).filter(User.email == data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email đã được đăng ký"
            )
        
        # Validate password
        if len(data.password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mật khẩu phải có ít nhất 6 ký tự"
            )
        
        # Create verification token
        verification_token = create_verification_token()
        verification_expires = datetime.utcnow() + timedelta(hours=24)
        
        # Create user
        user = User(
            email=data.email,
            password_hash=get_password_hash(data.password),
            name=data.name,
            is_verified=False,
            verification_token=verification_token,
            verification_token_expires=verification_expires
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Send verification email
        try:
            await send_verification_email(data.email, verification_token, AUTH_API_URL)
        except Exception as e:
            print(f"Failed to send verification email: {str(e)}")
            # Don't fail registration if email fails
        
        return {
            "success": True,
            "message": "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi đăng ký: {str(e)}"
        )


@router.get("/verify-email")
async def verify_email(token: str = Query(...), db: Session = Depends(get_db)):
    """Verify user email"""
    user = db.query(User).filter(User.verification_token == token).first()
    
    if not user:
        return RedirectResponse(
            url=f"{AUTH_GUI_URL}?error=invalid_token&message=Link xác thực không hợp lệ"
        )
    
    # Check if token expired
    if user.verification_token_expires < datetime.utcnow():
        return RedirectResponse(
            url=f"{AUTH_GUI_URL}?error=expired_token&message=Link xác thực đã hết hạn"
        )
    
    # Verify user
    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    db.commit()
    
    return RedirectResponse(
        url=f"{AUTH_GUI_URL}?verified=true&message=Xác thực thành công! Bạn có thể đăng nhập ngay."
    )


@router.post("/login")
async def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password"""
    # Find user
    user = db.query(User).filter(User.email == data.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không đúng"
        )
    
    # Verify password
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không đúng"
        )
    
    # Check if verified
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vui lòng xác thực email trước khi đăng nhập"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    
    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "phone": user.phone
        }
    }


@router.post("/resend-verification")
async def resend_verification(email: EmailStr, db: Session = Depends(get_db)):
    """Resend verification email"""
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email không tồn tại"
        )
    
    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email đã được xác thực"
        )
    
    # Create new token
    verification_token = create_verification_token()
    verification_expires = datetime.utcnow() + timedelta(hours=24)
    
    user.verification_token = verification_token
    user.verification_token_expires = verification_expires
    db.commit()
    
    # Send email
    try:
        await send_verification_email(email, verification_token, AUTH_API_URL)
        return {
            "success": True,
            "message": "Email xác thực đã được gửi lại"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Không thể gửi email: {str(e)}"
        )


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Request password reset"""
    user = db.query(User).filter(User.email == data.email).first()
    
    if not user:
        # Don't reveal if email exists
        return {
            "success": True,
            "message": "Nếu email tồn tại, link đặt lại mật khẩu sẽ được gửi đến"
        }
    
    # Create reset token
    reset_token = create_verification_token()
    reset_expires = datetime.utcnow() + timedelta(hours=1)
    
    user.reset_token = reset_token
    user.reset_token_expires = reset_expires
    db.commit()
    
    # Send email
    try:
        await send_password_reset_email(data.email, reset_token, AUTH_GUI_URL)
    except Exception as e:
        print(f"Failed to send reset email: {str(e)}")
    
    return {
        "success": True,
        "message": "Nếu email tồn tại, link đặt lại mật khẩu sẽ được gửi đến"
    }


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password with token"""
    user = db.query(User).filter(User.reset_token == data.token).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Link đặt lại mật khẩu không hợp lệ"
        )
    
    # Check if token expired
    if user.reset_token_expires < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Link đặt lại mật khẩu đã hết hạn"
        )
    
    # Validate password
    if len(data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu phải có ít nhất 6 ký tự"
        )
    
    # Update password
    user.password_hash = get_password_hash(data.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    
    return {
        "success": True,
        "message": "Đặt lại mật khẩu thành công"
    }


@router.get("/me")
async def get_current_user_info(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user info"""
    user = db.query(User).filter(User.id == int(current_user["user_id"])).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "phone": user.phone,
        "is_verified": user.is_verified,
        "created_at": user.created_at
    }


@router.post("/logout")
async def logout():
    """Logout (client-side token removal)"""
    return {
        "success": True,
        "message": "Đăng xuất thành công"
    }