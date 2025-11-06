from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, JSON, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from datetime import datetime
import os

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ai_asset_valuation.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# =====================================================
# MODELS
# =====================================================

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String)
    phone = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    verification_token_expires = Column(DateTime, nullable=True)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    reports = relationship("PropertyReport", back_populates="user", cascade="all, delete-orphan")


class PropertyReport(Base):
    __tablename__ = "property_reports"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    address = Column(String, index=True)
    property_type = Column(String)  # Căn hộ, Nhà phố, etc.
    land_area = Column(Float, nullable=True)
    usable_area = Column(Float)
    bedrooms = Column(Integer)
    bathrooms = Column(Integer)
    floors = Column(Integer)
    direction = Column(String)  # Đông, Nam, etc.
    legal_status = Column(String)
    furniture = Column(String)
    width = Column(Float, nullable=True)
    length = Column(Float, nullable=True)
    
    # Condition assessment
    overall_condition = Column(String)  # Mới, Cũ, Xuống cấp, etc.
    cleanliness = Column(String)  # Sạch, Bẩn, etc.
    maintenance_status = Column(String)
    major_issues = Column(JSON, nullable=True)  # List of issues
    overall_description = Column(Text)
    
    # AI Analysis Raw
    ai_analysis_raw = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="reports")
    images = relationship("PropertyImage", back_populates="report", cascade="all, delete-orphan")


class PropertyImage(Base):
    __tablename__ = "property_images"
    
    id = Column(Integer, primary_key=True)
    report_id = Column(Integer, ForeignKey("property_reports.id"), index=True)
    s3_url = Column(String)
    s3_key = Column(String)
    original_filename = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    report = relationship("PropertyReport", back_populates="images")


# Create tables
Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()