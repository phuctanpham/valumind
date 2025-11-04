import logging
from typing import List, Dict, Any
import importlib
from .preprocessing import preprocess_image
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Dynamically import from '3rd' directory
openai_module = importlib.import_module('..3rd.openai', __package__)
analyze_with_gpt4v = openai_module.analyze_with_gpt4v
r2_module = importlib.import_module('..3rd.r2', __package__)
upload_image_to_r2 = r2_module.upload_image_to_r2


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def analyze_images(images_base64: List[str]) -> Dict[str, Any]:
    """
    Main OCR analysis function
    
    Args:
        images_base64: List of base64-encoded images
        
    Returns:
        Dictionary with analysis results
    """
    try:
        # Preprocess images
        logger.info('Preprocessing images...')
        preprocessed_images = []
        uploaded_urls = []
        
        for idx, img_b64 in enumerate(images_base64):
            # Preprocess (local processing)
            processed_b64 = preprocess_image(img_b64)
            preprocessed_images.append(processed_b64)
            
            # Upload to R2 (external service)
            try:
                url = upload_image_to_r2(processed_b64, f'image_{idx}')
                uploaded_urls.append({
                    'index': idx,
                    'url': url
                })
            except Exception as e:
                logger.warning(f'Failed to upload image {idx}: {e}')
        
        # Analyze with GPT-4V (external service)
        logger.info('Starting OCR analysis with GPT-4V...')
        analysis_result = analyze_with_gpt4v(preprocessed_images)
        
        if not analysis_result.get('success'):
            return {
                'success': False,
                'error': analysis_result.get('error', 'Analysis failed')
            }
        
        # Combine results
        return {
            'success': True,
            'data': analysis_result.get('data'),
            'images': uploaded_urls,
            'usage': analysis_result.get('usage'),
            'metadata': {
                'images_count': len(images_base64)
            }
        }
        
    except Exception as e:
        logger.error(f'Analysis error: {str(e)}', exc_info=True)
        return {
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        }