import os
import logging
import base64
from typing import List, Dict, Any
from openai import OpenAI

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def analyze_with_gpt4v(images_base64: List[str]) -> Dict[str, Any]:
    """
    Analyze images using GPT-4V
    
    Args:
        images_base64: List of base64-encoded images
        
    Returns:
        Dictionary with analysis results
    """
    try:
        # Prepare messages with images
        content = [
            {
                "type": "text",
                "text": """Analyze these images and extract all text content. 
                Provide structured output with:
                - Extracted text
                - Document type (if identifiable)
                - Key information fields
                - Confidence level
                Format the response as JSON."""
            }
        ]
        
        # Add images to content
        for img_b64 in images_base64:
            content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{img_b64}"
                }
            })
        
        # Call GPT-4V
        response = client.chat.completions.create(
            model="gpt-4-vision-preview",
            messages=[{
                "role": "user",
                "content": content
            }],
            max_tokens=4096
        )
        
        # Parse response
        result_text = response.choices[0].message.content
        
        return {
            'success': True,
            'data': {
                'text': result_text,
                'raw_response': result_text
            },
            'usage': {
                'prompt_tokens': response.usage.prompt_tokens,
                'completion_tokens': response.usage.completion_tokens,
                'total_tokens': response.usage.total_tokens
            }
        }
        
    except Exception as e:
        logger.error(f'GPT-4V analysis error: {str(e)}', exc_info=True)
        return {
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        }