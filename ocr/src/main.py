# ocr/src/main.py
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from .utils.analysis import analyze_images

app = FastAPI()

class ImagePayload(BaseModel):
    images: List[str]

@app.post("/analysis")
def perform_analysis(payload: ImagePayload):
    try:
        result = analyze_images(payload.images)
        if result.get('success'):
            return result
        else:
            raise HTTPException(status_code=500, detail=result.get('error'))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ocr"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8789)