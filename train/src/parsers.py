# parsers.py
import re
import json

def simple_parse_text_to_fields(text: str) -> dict:
    """Simple rule-based parser (fallback)"""
    t = text.lower()
    
    # Extract area
    m_area = re.search(r'(\d{1,4}(?:[.,]\d+)?)\s*(m2|m²|sqm|m )', t)
    area = float(m_area.group(1).replace(',', '.')) if m_area else None

    # Extract price
    m_price = re.search(r'(\d{1,3}(?:[\.,]\d{3})*(?:[,\.\d]*)?)\s*(vnđ|vnd|đ|dong|usd)', t)
    price = None
    if m_price:
        s = m_price.group(1)
        s = re.sub(r'[^\d]', '', s)
        if s:
            price = int(s)

    # Extract bedrooms
    m_bed = re.search(r'(\d)\s*(pn|phòng ngủ|bedroom|phòng)', t)
    beds = int(m_bed.group(1)) if m_bed else None

    # Extract floor
    m_floor = re.search(r'tầng\s*(\d{1,2})|floor\s*(\d{1,2})', t)
    floor = None
    if m_floor:
        floor = int(m_floor.group(1) or m_floor.group(2))

    # Extract year built
    m_year = re.search(r'(năm|built)\s*(\d{4})', t)
    year = int(m_year.group(2)) if m_year else None

    # Detect property type
    prop_type = 'apartment'
    if 'chung cư' in t or 'apartment' in t or 'apt' in t:
        prop_type = 'apartment'
    elif 'đất' in t or 'lot' in t or 'land' in t:
        prop_type = 'land'
    elif 'nhà' in t or 'house' in t or 'home' in t:
        prop_type = 'house'

    # Detect condition
    condition = None
    if 'mới' in t or 'new' in t:
        condition = 'Mới'
    elif 'tốt' in t or 'good' in t:
        condition = 'Tốt'
    elif 'khá' in t or 'fair' in t:
        condition = 'Khá'
    elif 'cũ' in t or 'old' in t:
        condition = 'Cũ'

    return {
        "property_type": prop_type,
        "address": None,
        "city": None,
        "area_m2": area,
        "bedrooms": beds,
        "floor": floor,
        "year_built": year,
        "condition": condition,
        "price_est_input": price,
        "notes": text[:500]
    }

def parse_with_openai(text: str, api_key: str) -> dict:
    """Parse using OpenAI GPT - requires openai library"""
    try:
        import openai
    except ImportError:
        raise RuntimeError("OpenAI library not installed. Install with: pip install openai")
    
    openai.api_key = api_key
    
    prompt = f"""
Extract property information from the text below and return ONLY valid JSON.
No explanation, no markdown, just raw JSON.

Fields to extract:
- property_type: string (apartment, house, land)
- address: string or null
- city: string or null
- area_m2: number
- bedrooms: integer or null
- floor: integer or null
- year_built: integer or null
- condition: string or null (Mới, Tốt, Khá, Cũ, etc.)
- price_est_input: number or null
- notes: string or null

Text to parse:
\"\"\"{text}\"\"\"

Return only JSON, no other text:
"""
    
    try:
        resp = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )
        content = resp['choices'][0]['message']['content'].strip()
        
        # Try to parse JSON directly
        try:
            data = json.loads(content)
        except json.JSONDecodeError:
            # Try to extract JSON from markdown code blocks
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group(1))
            else:
                # Try to find JSON object in text
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    data = json.loads(json_match.group(0))
                else:
                    raise json.JSONDecodeError("No JSON found", content, 0)
        
        return data
    except Exception as e:
        raise RuntimeError(f"OpenAI parsing failed: {str(e)}")