import json
from typing import Dict, Any

def success_response(data: Dict[str, Any], status_code: int = 200) -> Dict[str, Any]:
    """Create successful Lambda response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        'body': json.dumps(data)
    }

def error_response(message: str, status_code: int = 500) -> Dict[str, Any]:
    """Create error Lambda response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        'body': json.dumps({
            'error': message,
            'success': False
        })
    }