#!/bin/bash

# Save your Warp URL (replace with actual)
WARP_URL="https://warp.vpbank.workers.dev"
AUTH_URL="https://auth.vpbank.workers.dev"


echo "=== Testing Warp Health ==="
curl $WARP_URL/health
echo -e "\n"

echo "=== Testing OCR Health ==="
curl $WARP_URL/api/ocr/health
echo -e "\n"

echo "=== Getting Token ==="
TOKEN=$(curl -s -X POST $AUTH_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"prod@example.com","password":"password123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Token: $TOKEN"
echo ""

echo "=== Testing Authenticated OCR ==="
curl -X POST $WARP_URL/api/ocr/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "images": ["iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="]
  }'
echo -e "\n"