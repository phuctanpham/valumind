from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from typing import Dict, List, Optional
from pydantic import BaseModel
import os
from sqlalchemy import create_engine, Column, String, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime

# NeonDB Database Configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
)

# Create SQLAlchemy engine with NeonDB optimizations
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_recycle=3600,
    connect_args={
        "sslmode": "require",
        "connect_timeout": 10,
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    schedule = Column(String, nullable=False)
    enabled = Column(Boolean, default=True)
    last_run = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize FastAPI app
app = FastAPI(
    title="Cron API",
    description="FastAPI application for scheduled tasks on AWS Lambda",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure based on your needs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class HealthResponse(BaseModel):
    status: str
    message: str
    environment: str

class TaskRequest(BaseModel):
    name: str
    schedule: str
    enabled: bool = True

class TaskResponse(BaseModel):
    id: str
    name: str
    schedule: str
    enabled: bool
    last_run: Optional[str] = None

# Root endpoint
@app.get("/")
async def root() -> Dict[str, str]:
    """Root endpoint"""
    return {
        "message": "Cron API is running",
        "version": "1.0.0",
        "docs": "/docs"
    }

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        message="Service is running",
        environment=os.getenv("ENVIRONMENT", "production")
    )

# Task endpoints
@app.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(db: Session = Depends(get_db)) -> List[TaskResponse]:
    """Get all scheduled tasks"""
    tasks = db.query(Task).all()
    return [
        TaskResponse(
            id=task.id,
            name=task.name,
            schedule=task.schedule,
            enabled=task.enabled,
            last_run=task.last_run.isoformat() if task.last_run else None
        )
        for task in tasks
    ]

@app.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str, db: Session = Depends(get_db)) -> TaskResponse:
    """Get a specific task by ID"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return TaskResponse(
        id=task.id,
        name=task.name,
        schedule=task.schedule,
        enabled=task.enabled,
        last_run=task.last_run.isoformat() if task.last_run else None
    )

@app.post("/tasks", response_model=TaskResponse, status_code=201)
async def create_task(task_data: TaskRequest, db: Session = Depends(get_db)) -> TaskResponse:
    """Create a new scheduled task"""
    import uuid
    
    task = Task(
        id=str(uuid.uuid4()),
        name=task_data.name,
        schedule=task_data.schedule,
        enabled=task_data.enabled
    )
    
    db.add(task)
    db.commit()
    db.refresh(task)
    
    return TaskResponse(
        id=task.id,
        name=task.name,
        schedule=task.schedule,
        enabled=task.enabled,
        last_run=None
    )

@app.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_data: TaskRequest,
    db: Session = Depends(get_db)
) -> TaskResponse:
    """Update an existing task"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.name = task_data.name
    task.schedule = task_data.schedule
    task.enabled = task_data.enabled
    task.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(task)
    
    return TaskResponse(
        id=task.id,
        name=task.name,
        schedule=task.schedule,
        enabled=task.enabled,
        last_run=task.last_run.isoformat() if task.last_run else None
    )

@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str, db: Session = Depends(get_db)) -> Dict[str, str]:
    """Delete a task"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task)
    db.commit()
    
    return {"message": f"Task {task_id} deleted successfully"}

@app.post("/tasks/{task_id}/execute")
async def execute_task(task_id: str, db: Session = Depends(get_db)) -> Dict[str, str]:
    """Manually execute a task"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update last_run timestamp
    task.last_run = datetime.utcnow()
    db.commit()
    
    # TODO: Implement actual task execution logic here
    
    return {
        "message": f"Task {task_id} execution started",
        "status": "running"
    }

# Lambda handler
handler = Mangum(app, lifespan="off")