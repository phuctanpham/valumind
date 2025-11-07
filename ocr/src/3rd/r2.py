import os
import logging
import base64
import boto3
from botocore.exceptions import ClientError
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# R2 Configuration
R2_ACCOUNT_ID = os.getenv('R2_ACCOUNT_ID')
R2_ACCESS_KEY_ID = os.getenv('R2_ACCESS_KEY_ID')
R2_SECRET_ACCESS_KEY = os.getenv('R2_SECRET_ACCESS_KEY')
R2_BUCKET_NAME = os.getenv('R2_BUCKET_NAME')

# Initialize S3 client for R2
s3_client = boto3.client(
    's3',
    endpoint_url=f'https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    region_name='auto'
)

def upload_image_to_r2(image_base64: str, filename: str) -> str:
    """
    Upload base64 image to Cloudflare R2
    
    Args:
        image_base64: Base64-encoded image
        filename: Desired filename
        
    Returns:
        Public URL of uploaded image
    """
    try:
        # Decode base64
        image_data = base64.b64decode(image_base64)
        
        # Generate unique key
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        key = f'ocr/{timestamp}_{filename}.jpg'
        
        # Upload to R2
        s3_client.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=key,
            Body=image_data,
            ContentType='image/jpeg'
        )
        
        # Generate public URL
        url = f'https://{R2_BUCKET_NAME}.{R2_ACCOUNT_ID}.r2.cloudflarestorage.com/{key}'
        
        logger.info(f'Uploaded image to R2: {key}')
        return url
        
    except ClientError as e:
        logger.error(f'R2 upload error: {str(e)}', exc_info=True)
        raise Exception(f'Failed to upload to R2: {str(e)}')
    except Exception as e:
        logger.error(f'Unexpected error in R2 upload: {str(e)}', exc_info=True)
        raise