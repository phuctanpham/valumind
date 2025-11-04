import base64
import logging
from PIL import Image
from io import BytesIO

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def preprocess_image(image_base64: str, max_size: int = 2048) -> str:
    """
    Preprocess image for OCR
    - Resize if too large
    - Normalize orientation
    - Optimize quality
    
    Args:
        image_base64: Base64-encoded image
        max_size: Maximum dimension size
        
    Returns:
        Preprocessed base64-encoded image
    """
    try:
        # Decode base64
        image_data = base64.b64decode(image_base64)
        image = Image.open(BytesIO(image_data))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize if too large
        width, height = image.size
        if width > max_size or height > max_size:
            if width > height:
                new_width = max_size
                new_height = int(height * (max_size / width))
            else:
                new_height = max_size
                new_width = int(width * (max_size / height))
            
            image = image.resize((new_width, new_height), Image.LANCZOS)
            logger.info(f'Resized image from {width}x{height} to {new_width}x{new_height}')
        
        # Save to bytes
        buffer = BytesIO()
        image.save(buffer, format='JPEG', quality=85, optimize=True)
        
        # Encode to base64
        processed_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return processed_base64
        
    except Exception as e:
        logger.error(f'Image preprocessing error: {str(e)}', exc_info=True)
        # Return original if preprocessing fails
        return image_base64