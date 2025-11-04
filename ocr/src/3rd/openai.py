import os
import openai
import base64
from dotenv import load_dotenv
from pathlib import Path

# Correctly load .env file from the project root
env_path = Path(__file__).resolve().parents[3] / '.env'
load_dotenv(dotenv_path=env_path)

# Get API key from environment
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY is not set in the .env file")

client = openai.OpenAI(api_key=api_key)

def analyze_with_gpt4v(image_base64_list):
    """
    Analyzes a list of base64-encoded images with GPT-4V.
    """
    try:
        response = client.chat.completions.create(
            model="gpt-4-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Analyze this image and extract all text, numbers, and symbols. If the image contains a form, provide the output as a JSON object with keys corresponding to the form's fields.",
                        }
                    ] + [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{img_b64}"
                            }
                        } for img_b64 in image_base64_list
                    ],
                }
            ],
            max_tokens=2000,
        )
        return {
            "success": True,
            "data": response.choices[0].message.content,
            "usage": response.usage
        }
    except Exception as e:
        return {"success": False, "error": str(e)}