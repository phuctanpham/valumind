# image_analysis_service.py - Enhanced Multi-Pass OCR Strategy
import base64
import json
import os
import logging
from io import BytesIO
from typing import List, Dict, Any
from PIL import Image, ImageEnhance, ImageFilter
from openai import OpenAI
from dotenv import load_dotenv
import cv2
import numpy as np

load_dotenv()

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
logger = logging.getLogger(__name__)


def preprocess_image_for_ocr(image_bytes: bytes) -> bytes:
    """
    Pre-process ảnh để tăng độ chính xác OCR:
    1. Tăng contrast
    2. Sharpen
    3. Denoise
    4. Tăng kích thước nếu quá nhỏ
    """
    try:
        img = Image.open(BytesIO(image_bytes))
        
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize nếu quá nhỏ
        width, height = img.size
        if width < 1200:
            scale = 1200 / width
            new_size = (int(width * scale), int(height * scale))
            img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        # Tăng contrast
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.5)
        
        # Tăng sharpness
        enhancer = ImageEnhance.Sharpness(img)
        img = enhancer.enhance(2.0)
        
        # Convert to numpy for OpenCV
        img_array = np.array(img)
        
        # Denoise
        img_array = cv2.fastNlMeansDenoisingColored(img_array, None, 10, 10, 7, 21)
        
        # Convert back to PIL
        img = Image.fromarray(img_array)
        
        # Save to bytes
        buffered = BytesIO()
        img.save(buffered, format="JPEG", quality=95)
        return buffered.getvalue()
        
    except Exception as e:
        logger.warning(f"Preprocess error: {e}, using original")
        return image_bytes


def encode_image_to_base64(image_file) -> str:
    """Convert image file to base64"""
    image_file.seek(0)
    return base64.b64encode(image_file.read()).decode('utf-8')


def compress_image_if_needed(content: bytes, max_size_mb: float = 20) -> bytes:
    """Compress image nếu vượt quá giới hạn"""
    if len(content) / (1024 * 1024) > max_size_mb:
        img = Image.open(BytesIO(content))
        img.thumbnail((1920, 1440))
        buffered = BytesIO()
        img.save(buffered, format="JPEG", quality=85, optimize=True)
        return buffered.getvalue()
    return content


def convert_bytes_to_base64_for_analysis(content: bytes, preprocess: bool = True) -> str:
    """Convert bytes thành base64 cho AI analysis"""
    if preprocess:
        content = preprocess_image_for_ocr(content)
    
    img = Image.open(BytesIO(content))
    buffered = BytesIO()
    img.save(buffered, format="JPEG", quality=95)
    return base64.b64encode(buffered.getvalue()).decode()


class ImageToFormAnalyzer:
    """Xử lý chuyển đổi ảnh bất động sản thành form/dữ liệu với multi-pass strategy"""
    
    # Critical fields that must not be missed
    CRITICAL_FIELDS = [
        "usable_area_m2", "bedrooms", "bathrooms", "floors", 
        "direction", "legal_status", "furniture_status", 
        "width_m", "length_m"
    ]
    
    @staticmethod
    def analyze_images_to_form(images_base64: List[str]) -> Dict[str, Any]:
        """
        Multi-pass OCR strategy:
        PASS 1: Comprehensive extraction with focused prompt
        PASS 2: Targeted retry for any missed critical fields
        """
        try:
            # PASS 1: First comprehensive extraction
            logger.info("🔍 Starting PASS 1: Comprehensive extraction")
            first_result = ImageToFormAnalyzer._first_pass_extraction(images_base64)
            
            if not first_result['success']:
                return first_result
            
            # Validate critical fields
            missing_fields = ImageToFormAnalyzer._validate_critical_fields(
                first_result['data']
            )
            
            # If all fields present, return immediately
            if not missing_fields:
                logger.info("✅ All critical fields extracted successfully")
                return first_result
            
            # PASS 2: Targeted retry for missed fields
            logger.warning(f"⚠️ Missing fields: {', '.join(missing_fields)}")
            logger.info("🔄 Starting PASS 2: Targeted retry")
            
            second_result = ImageToFormAnalyzer._targeted_retry(
                images_base64, 
                missing_fields,
                first_result['data']
            )
            
            return second_result
            
        except Exception as e:
            logger.error(f"Analysis error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "error_type": type(e).__name__
            }
    
    @staticmethod
    def _first_pass_extraction(images_base64: List[str]) -> Dict[str, Any]:
        """PASS 1: Focused extraction with emphasis on critical fields"""
        
        system_prompt = """Bạn là chuyên gia OCR bất động sản Việt Nam, chuyên đọc chính xác mọi thông tin từ ảnh.

NHIỆM VỤ: Quét TOÀN BỘ ảnh từ trên xuống dưới, trái sang phải, đọc TẤT CẢ chữ, số, icon mà KHÔNG giả định cấu trúc (không phân biệt cột, phần, hay vị trí). Tổng hợp thông tin từ TẤT CẢ ảnh nếu có nhiều.

KỸ NĂNG QUAN TRỌNG:
- Đọc kỹ mọi dòng chữ, icon, và giá trị đi kèm, dù ở bất kỳ vị trí nào.
- Xử lý tiếng Việt có dấu, sửa lỗi đọc nếu cần (ví dụ: "Coban" có thể là "Cơ bản").
- Chuyển số có dấu phẩy thành dấu chấm: "95,25" → 95.25.
- Nếu không tìm thấy rõ ràng → null (không đoán).
- Trả về JSON thuần, không markdown."""

        user_prompt = """BƯỚC 1: Quét và liệt kê TẤT CẢ text/icon visible trong toàn bộ ảnh (không bỏ sót bất kỳ dòng nào, kể cả tiêu đề, mô tả, hoặc nhãn nhỏ). Ví dụ output phần này: {"all_visible_text": "Danh sách tất cả text: Nhà mặt tiền... Diện tích: 95,25 m²... Nội thất: Cơ bản..."}

BƯỚC 2: Từ text quét được, trích xuất CHÍNH XÁC và ĐẦY ĐỦ các trường sau. Ưu tiên TUYỆT ĐỐI các trường quan trọng (tìm kỹ ở mọi vị trí, icon, hoặc gần nhãn).

⚠️ CÁC TRƯỜNG QUAN TRỌNG NHẤT (tuyệt đối không bỏ sót, tìm ở bất kỳ đâu):

📏 DIỆN TÍCH (usable_area_m2):
- Tìm bất kỳ: "Diện tích", "Diện tích sử dụng", "DT", "m²", "m2", hoặc số + "m²" ở bất kỳ vị trí.
- VD: "Diện tích: 95,25 m²" → 95.25
- VD: "91 m²" → 91
- VD: "95.25 m2" gần icon □ → 95.25
- Nếu có nhiều, lấy giá trị chính (thường là sử dụng).

🪑 NỘI THẤT (furniture_status):
- Tìm bất kỳ: "Nội thất", "Nội thất:", icon 🪑, hoặc giá trị như "Cơ bản", "Đầy đủ", "Cao cấp" ở bất kỳ vị trí.
- VD: "Nội thất: Cơ bản" → "Cơ bản"
- VD: "Nội thất: Đầy đủ" → "Đầy đủ"
- VD: "Coban" gần nhãn Nội thất → "Cơ bản" (sửa nếu lỗi đọc)
- BỎ QUA placeholder như "VD: Đầy đủ, Cơ bản" hoặc "VD:". Chỉ lấy giá trị thực (sau dấu ":" hoặc icon).
- Nếu chỉ thấy placeholder hoặc không rõ → null.

CÁC TRƯỜNG KHÁC (tìm tương tự, ở bất kỳ vị trí):
+ property_type: Loại BDS (nhà/căn hộ/đất, ví dụ: "house" nếu là nhà phố).
+ address: Địa chỉ đầy đủ (từ mô tả hoặc nhãn).
+ bedrooms: Số phòng ngủ (tìm "Phòng ngủ", "Số phòng ngủ", hoặc số gần icon).
+ bathrooms: Số phòng tắm/vệ sinh (tìm "Phòng tắm", "WC", hoặc số).
+ floors: Số tầng (tìm "Số tầng", "Tầng", hoặc số).
+ direction: Hướng nhà (tìm "Hướng nhà", "Hướng", ví dụ: "Tây - Bắc").
+ balcony_direction: Hướng ban công (nếu có).
+ width_m: Mặt tiền/Chiều rộng/Ngang (ví dụ: "4,3 m" → 4.3).
+ length_m: Đường vào/Chiều dài/Sâu.
+ legal_status: Pháp lý/Sổ đỏ/Sổ hồng/Giấy tờ.
+ land_area_m2: Diện tích đất (nếu khác usable_area).
+ price_per_m2_vnd: Giá/m² (nếu có).

ĐỊNH DẠNG OUTPUT (JSON):
{
  "all_visible_text": "Tóm tắt tất cả text quét được",
  "property_info": {
    "address": "string hoặc null",
    "property_type": "house/apartment/land hoặc null",
    "usable_area_m2": số hoặc null,
    "bedrooms": số nguyên hoặc null,
    "bathrooms": số nguyên hoặc null,
    "floors": số nguyên hoặc null,
    "direction": "string hoặc null",
    "balcony_direction": "string hoặc null",
    "width_m": số hoặc null,
    "length_m": số hoặc null,
    "legal_status": "string hoặc null",
    "furniture_status": "string hoặc null",
    "land_area_m2": số hoặc null,
    "price_per_m2_vnd": số hoặc null
  },
  "condition_assessment": {
    "overall_condition": "string hoặc null",
    "cleanliness": "string hoặc null",
    "maintenance_status": "string hoặc null",
    "major_issues": [],
    "overall_description": "string hoặc null"
  }
}

⚠️ QUÉT KỸ TOÀN BỘ! Không bỏ sót diện tích và nội thất dù ở vị trí nào."""

        try:
            # Build content with all images
            content = [{"type": "text", "text": user_prompt}]
            for img_b64 in images_base64:
                content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{img_b64}",
                        "detail": "high"
                    }
                })
            
            # Call GPT-4V
            response = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": content}
                ],
                max_tokens=3000,
                temperature=0
            )
            
            # Parse response
            response_text = response.choices[0].message.content.strip()
            raw_text = response.choices[0].message.content.strip()
            print("\n" + "="*60)
            print("RAW RESPONSE TỪ GPT (PASS 1)")
            print("="*60)
            print(raw_text)
            print("="*60 + "\n")
            # Clean markdown
            if response_text.startswith("```json"):
                response_text = response_text.replace("```json", "").replace("```", "").strip()
            elif response_text.startswith("```"):
                response_text = response_text.replace("```", "").strip()
            
            # Parse JSON
            try:
                result = json.loads(response_text)
            except json.JSONDecodeError:
                json_match = response_text.find('{')
                json_end = response_text.rfind('}') + 1
                if json_match >= 0 and json_end > json_match:
                    result = json.loads(response_text[json_match:json_end])
                else:
                    raise ValueError(f"Invalid JSON: {response_text[:300]}")
            
            logger.info(f"✅ PASS 1 completed. Tokens: {response.usage.prompt_tokens}/{response.usage.completion_tokens}")
            
            return {
                "success": True,
                "data": result,
                "raw_response": response_text,
                "usage": {
                    "input_tokens": response.usage.prompt_tokens,
                    "output_tokens": response.usage.completion_tokens
                }
            }
            
        except Exception as e:
            logger.error(f"PASS 1 error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "error_type": type(e).__name__
            }

    @staticmethod
    def _validate_critical_fields(data: Dict[str, Any]) -> List[str]:
        """Check for missing critical fields"""
        missing = []
        property_info = data.get("property_info", {})
        
        field_mapping = {
            "usable_area_m2": "Diện tích sử dụng",
            "bedrooms": "Số phòng ngủ",
            "bathrooms": "Số phòng tắm",
            "floors": "Số tầng",
            "direction": "Hướng nhà",
            "legal_status": "Pháp lý",
            "furniture_status": "Nội thất",
            "width_m": "Mặt tiền",
            "length_m": "Đường vào"
        }
        
        for field, display_name in field_mapping.items():
            value = property_info.get(field)
            if value is None or value == "" or value == 0:
                missing.append(field)
                logger.debug(f"❌ Missing: {display_name} ({field})")
        
        return missing
    
    @staticmethod
    def _targeted_retry(
        images_base64: List[str], 
        missing_fields: List[str],
        previous_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """PASS 2: Laser-focused retry for critical missed fields"""
        print(f"\nPASS 2: Đang tìm lại {missing_fields} vì GPT bỏ sót!")
        # Enhanced field labels with more search hints
        field_labels = {
            "usable_area_m2": "Diện tích / Diện tích sử dụng / DT / bất kỳ số + m² / m2 ở mọi vị trí",
            "bedrooms": "Số phòng ngủ / Phòng ngủ / số gần icon phòng",
            "bathrooms": "Số phòng tắm / Phòng tắm, vệ sinh / WC / số",
            "floors": "Số tầng / Tầng / số",
            "direction": "Hướng nhà / Hướng / Hướng chính / Tây - Bắc v.v.",
            "legal_status": "Pháp lý / Giấy tờ / Sổ đỏ / Sổ hồng / Sổ",
            "furniture_status": "Nội thất / Tình trạng nội thất / icon 🪑 / Cơ bản / Đầy đủ (sửa lỗi như Coban → Cơ bản)",
            "width_m": "Mặt tiền / Chiều rộng / Ngang / số + m",
            "length_m": "Đường vào / Chiều dài / Sâu / số + m"
        }
        
        missing_labels = [field_labels.get(f, f) for f in missing_fields]
        
        # Ultra-focused retry prompt
        retry_prompt = f"""⚠️ QUÉT LẠI TOÀN BỘ ẢNH ĐỂ TÌM CÁC TRƯỜNG BỊ BỎ SÓT:

{chr(10).join(f'{i+1}. {label}' for i, label in enumerate(missing_labels))}

HƯỚNG DẪN:
- Quét TỪ TRÊN XUỐNG DƯỚI, TRÁI SANG PHẢI, đọc MỌI CHỮ/SỐ/ICON.
- Tìm ở BẤT KỲ VỊ TRÍ, không giả định cấu trúc.
- Đặc biệt chú ý:
  * Số + "m²" hoặc gần "Diện tích" → usable_area_m2
  * "Nội thất" + giá trị (Cơ bản/Đầy đủ) hoặc icon → furniture_status
  * Sửa lỗi đọc nếu cần (Coban → Cơ bản)

VÍ DỤ:
✅ "95,25 m²" → usable_area_m2: 95.25
✅ "Nội thất: Cơ bản" → furniture_status: "Cơ bản"
✅ "Coban" → furniture_status: "Cơ bản"

OUTPUT (chỉ các trường tìm được):
{{
  {', '.join(f'"{f}": value' for f in missing_fields)}
}}

⚠️ TÌM KỸ! Thông tin chắc chắn có trong ảnh!"""

        try:
            content = [{"type": "text", "text": retry_prompt}]
            for img_b64 in images_base64:
                content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{img_b64}",
                        "detail": "high"
                    }
                })
            
            logger.info(f"🎯 PASS 2: Laser-targeting {len(missing_fields)} fields")
            response = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system", 
                        "content": "Bạn là chuyên gia OCR. QUÉT TOÀN BỘ ảnh và tìm CHÍNH XÁC các trường bị thiếu. Không được bỏ sót!"
                    },
                    {"role": "user", "content": content}
                ],
                max_tokens=1000,
                temperature=0
            )
            
            retry_text = response.choices[0].message.content.strip()
            
            # Clean and parse
            if retry_text.startswith("```"):
                retry_text = retry_text.replace("```json", "").replace("```", "").strip()
            
            retry_result = json.loads(retry_text)
            
            # Merge with previous data
            property_info = previous_data.get("property_info", {})
            recovered_fields = []
            for field, value in retry_result.items():
                if value is not None and value != "":
                    property_info[field] = value
                    recovered_fields.append(field)
                    logger.info(f"✅ Recovered: {field} = {value}")
            
            previous_data["property_info"] = property_info
            
            logger.info(f"✅ PASS 2 completed. Tokens: {response.usage.prompt_tokens}/{response.usage.completion_tokens}")
            logger.info(f"📊 Recovery rate: {len(recovered_fields)}/{len(missing_fields)} fields")
            
            return {
                "success": True,
                "data": previous_data,
                "usage": {
                    "input_tokens": response.usage.prompt_tokens,
                    "output_tokens": response.usage.completion_tokens
                },
                "retry_info": {
                    "attempted_fields": missing_fields,
                    "recovered_fields": recovered_fields,
                    "recovery_rate": f"{len(recovered_fields)}/{len(missing_fields)}"
                }
            }
            
        except Exception as e:
            logger.error(f"PASS 2 error: {str(e)}")
            # Return original data if retry fails
            return {
                "success": True,
                "data": previous_data,
                "warning": f"Retry failed: {str(e)}"
            }
    
    @staticmethod
    def extract_property_info(ai_result: Dict[str, Any]) -> Dict[str, Any]:
        try:
            return ai_result.get("data", {}).get("property_info", {})
        except:
            return {}
    
    @staticmethod
    def extract_condition_assessment(ai_result: Dict[str, Any]) -> Dict[str, Any]:
        try:
            return ai_result.get("data", {}).get("condition_assessment", {})
        except:
            return {}


# Export functions
def analyze_images_to_property_form(images_base64: List[str]) -> Dict[str, Any]:
    return ImageToFormAnalyzer.analyze_images_to_form(images_base64)

def get_property_info_from_analysis(ai_result: Dict[str, Any]) -> Dict[str, Any]:
    return ImageToFormAnalyzer.extract_property_info(ai_result)

def get_condition_assessment_from_analysis(ai_result: Dict[str, Any]) -> Dict[str, Any]:
    return ImageToFormAnalyzer.extract_condition_assessment(ai_result)