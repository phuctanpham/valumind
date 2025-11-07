# ocr/src/utils/analysis.py
from typing import List, Dict, Any
import base64
import json
from io import BytesIO
from PIL import Image
from openai import OpenAI
import os

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def analyze_images(images_base64: List[str]) -> Dict[str, Any]:
    """
    Unified OCR analysis for both train and predict services
    Returns standardized schema compatible with both
    """
    try:
        # Build GPT-4V prompt
        system_prompt = """Extract real estate property information from images.
Return JSON with ALL fields below. Use null if not found."""

        user_prompt = """Extract and return JSON:
{
  "property_info": {
    "address": "string or null",
    "property_type": "house/apartment/land or null",
    "usable_area_m2": "number or null",
    "land_area_m2": "number or null",
    "bedrooms": "integer or null",
    "bathrooms": "integer or null",
    "floors": "integer or null",
    "direction": "string or null",
    "balcony_direction": "string or null",
    "legal_status": "string or null",
    "furniture_status": "string or null",
    "width_m": "number or null",
    "length_m": "number or null",
    "price_per_m2_vnd": "number or null",
    "longitude": "number or null",
    "latitude": "number or null",
    "region": "string or null",
    "area": "string or null"
  },
  "condition_assessment": {
    "overall_condition": "string or null",
    "cleanliness": "string or null",
    "maintenance_status": "string or null",
    "major_issues": [],
    "overall_description": "string or null"
  }
}"""

        # Build content
        content = [{"type": "text", "text": user_prompt}]
        for img_b64 in images_base64:
            content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{img_b64}",
                    "detail": "high"
                }
            })

        # Call OpenAI
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": content}
            ],
            max_tokens=2000,
            temperature=0
        )

        # Parse response
        response_text = response.choices[0].message.content.strip()
        if response_text.startswith("```json"):
            response_text = response_text.replace("```json", "").replace("```", "").strip()
        
        result = json.loads(response_text)
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }