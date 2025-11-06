#!/bin/bash

# Stop all services
lsof -i :8789 | awk 'NR>1 {print $2}' | xargs kill -9 2>/dev/null
lsof -i :8000 | awk 'NR>1 {print $2}' | xargs kill -9 2>/dev/null
lsof -i :3002 | awk 'NR>1 {print $2}' | xargs kill -9 2>/dev/null
lsof -i :3001 | awk 'NR>1 {print $2}' | xargs kill -9 2>/dev/null
lsof -i :3003 | awk 'NR>1 {print $2}' | xargs kill -9 2>/dev/null
lsof -i :3004 | awk 'NR>1 {print $2}' | xargs kill -9 2>/dev/null
lsof -i :3005 | awk 'NR>1 {print $2}' | xargs kill -9 2>/dev/null

# Start ocr service
cd ocr
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
nohup uvicorn src.main:app --host 0.0.0.0 --port 8789 &
cd ..

# Start hieu-app backend service
cd hieu-app/backend
python3 -m venv ../../venv
source ../../venv/bin/activate
pip install -r requirements.txt
nohup uvicorn main:app --host 0.0.0.0 --port 8000 &
cd ../..

# Start hieu-app frontend service
cd hieu-app/my-react-app
npm install
npm start &
cd ../..

# Start auth service
cd auth
npm install
npm run dev &
cd ..

# Start warp service
cd warp
npm install
npm run dev &
cd ..

# Start api service
cd api
npm install
npm run dev &
cd ..

# Start app service
cd app
npm install
npm run dev &
cd ..

sleep 10

if ! lsof -i :8789; then
  echo "OCR service failed to start on port 8789"
  exit 1
fi

if ! lsof -i :8000; then
  echo "Hieu-app backend service failed to start on port 8000"
  exit 1
fi

if ! lsof -i :3002; then
  echo "Hieu-app frontend service failed to start on port 3002"
  exit 1
fi

if ! lsof -i :3001; then
  echo "Auth service failed to start on port 3001"
  exit 1
fi

if ! lsof -i :3003; then
  echo "Warp service failed to start on port 3003"
  exit 1
fi

if ! lsof -i :3004; then
  echo "Api service failed to start on port 3004"
  exit 1
fi

if ! lsof -i :3005; then
  echo "App service failed to start on port 3005"
  exit 1
fi

echo "OCR service started successfully on port 8789"
echo "Hieu-app backend service started successfully on port 8000"
echo "Hieu-app frontend service started successfully on port 3002"
echo "Auth service started successfully on port 3001"
echo "Warp service started successfully on port 3003"
echo "Api service started successfully on port 3004"
echo "App service started successfully on port 3005"
