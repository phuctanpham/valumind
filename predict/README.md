# 🏡 Real Estate Price Prediction Service (AWS Lambda)

Machine Learning service for real estate valuation using LightGBM and SHAP analysis.

## Architecture

- **Runtime**: AWS Lambda (Python 3.11)
- **Model**: LightGBM
- **Explainability**: SHAP
- **Database**: NeonDB (PostgreSQL)

## Project Structure
```
predict/
├── src/
│   ├── main.py          # Lambda handler
│   └── schemas.py       # Data models
├── alembic/             # DB migrations
├── requirements.txt     # Dependencies
└── swagger.yaml         # API documentation
```

## Deployment

Deployed automatically via GitHub Actions when changes are pushed to `main` branch.

### Environment Variables

Required in Lambda:
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `DATABASE_URL` (optional)

## API Usage

### Request Format
```json
{
  "size": 90,
  "living_size": 270,
  "width": 4,
  "length": 22,
  "rooms": 5,
  "toilets": 5,
  "floors": 4,
  "longitude": 106.65461,
  "latitude": 10.864375,
  "category": "Nhà riêng",
  "region": "TP.HCM",
  "area": "Quận 12"
}
```

### Response Format
```json
{
  "estimated_price_vnd": 6150450123,
  "analysis": {
    "base_price_vnd": 3517112269,
    "factors": [
      {
        "feature": "area",
        "value": "Quận 12",
        "shap_value": 1800500000
      }
    ]
  }
}
```

## Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Test locally
python -c "from src.main import handler; print(handler({'size': 90, ...}, None))"
```