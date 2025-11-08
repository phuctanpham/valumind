from mangum import Mangum
from src.main import app

# Create handler with proper lifespan management
handler = Mangum(app, lifespan="off")

# Optional: Add custom handler wrapper for additional logging/metrics
def lambda_handler(event, context):
    """
    AWS Lambda entry point with custom logging
    """
    import json
    import logging
    
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    # Log incoming request (redact sensitive data)
    safe_event = {
        "httpMethod": event.get("requestContext", {}).get("http", {}).get("method"),
        "path": event.get("requestContext", {}).get("http", {}).get("path"),
        "sourceIp": event.get("requestContext", {}).get("http", {}).get("sourceIp"),
    }
    logger.info(f"Incoming request: {json.dumps(safe_event)}")
    
    try:
        # Call Mangum handler
        response = handler(event, context)
        logger.info(f"Response status: {response.get('statusCode')}")
        return response
    except Exception as e:
        logger.error(f"Lambda execution error: {str(e)}", exc_info=True)
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "Internal server error"}),
            "headers": {
                "Content-Type": "application/json"
            }
        }