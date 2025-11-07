# predict/src/main.py
import json
import lightgbm as lgb
import pandas as pd
import shap
import os
from typing import Dict, Any
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Model paths
MODEL_PATH = os.getenv('MODEL_PATH', '/tmp/lightgbm_model.txt')
EXPLAINER = None
MODEL = None

def load_model():
    """Load model and explainer on cold start"""
    global MODEL, EXPLAINER
    
    try:
        MODEL = lgb.Booster(model_file=MODEL_PATH)
        EXPLAINER = shap.TreeExplainer(MODEL)
        logger.info("✅ Model and SHAP explainer loaded successfully")
    except Exception as e:
        logger.error(f"❌ Failed to load model: {e}")
        raise

def validate_input(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and clean input data"""
    required_fields = ['size', 'longitude', 'latitude', 'category', 'region', 'area']
    
    for field in required_fields:
        if field not in data:
            raise ValueError(f"Missing required field: {field}")
    
    return data

def predict_price(features: Dict[str, Any]) -> Dict[str, Any]:
    """
    Predict real estate price and provide SHAP analysis
    """
    if not MODEL or not EXPLAINER:
        load_model()
    
    # Convert to DataFrame
    input_df = pd.DataFrame([features])
    
    # Convert categorical columns
    for col in ['category', 'region', 'area']:
        if col in input_df.columns:
            input_df[col] = input_df[col].astype('category')
    
    # Predict
    prediction = MODEL.predict(input_df)
    estimated_price = float(prediction[0])
    
    # SHAP analysis
    shap_values_array = EXPLAINER.shap_values(input_df)
    base_value = EXPLAINER.expected_value
    feature_names = MODEL.feature_name()
    
    # Build SHAP factors
    shap_dict = dict(zip(feature_names, shap_values_array[0]))
    sorted_shap = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)
    
    factors = [
        {
            "feature": name,
            "value": features.get(name),
            "shap_value": float(val)
        }
        for name, val in sorted_shap if abs(val) > 1
    ]
    
    return {
        "estimated_price_vnd": estimated_price,
        "analysis": {
            "base_price_vnd": float(base_value),
            "factors": factors
        }
    }

def handler(event, context):
    """
    AWS Lambda handler for price prediction
    
    Expected event format:
    {
        "body": "{...json...}" or
        "size": 90,
        "longitude": 106.65,
        ...
    }
    """
    try:
        # Parse input
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event
        
        # Validate input
        features = validate_input(body)
        
        # Predict
        result = predict_price(features)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result)
        }
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }
    
    except Exception as e:
        logger.error(f"Prediction error: {e}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error'})
        }