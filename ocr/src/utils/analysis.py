import logging
import sys
import os
from typing import List, Dict, Any
from .preprocessing import preprocess_image

# Add src directory to path
src_path = os.path.join(os.path.dirname(__file__), '..')
if src_path not in sys.path:
    sys.path.insert(0, src_path)

# Import from 3rd directory using importlib
import importlib.util

# Import openai module
openai_path = os.path.join(src_path, '3rd', 'openai.py')
spec = importlib.util.spec_from_file_location("openai_module", openai_path)
openai_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(openai_module)
analyze_with_gpt4v = openai_module.analyze_with_gpt4v

# Import r2 module
r2_path = os.path.join(src_path, '3rd', 'r2.py')
spec = importlib.util.spec_from_file_location("r2_module", r2_path)
r2_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(r2_module)
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
        
        # Analyze with GPT-4 (external service)
        logger.info('Starting OCR analysis with GPT-4...')
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