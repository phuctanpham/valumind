#!/bin/bash

# Stop all node services
lsof -i :3000 | awk 'NR>1 {print $2}' | xargs kill -9
lsof -i :3001 | awk 'NR>1 {print $2}' | xargs kill -9
lsof -i :3002 | awk 'NR>1 {print $2}' | xargs kill -9
lsof -i :3003 | awk 'NR>1 {print $2}' | xargs kill -9
lsof -i :5173 | awk 'NR>1 {print $2}' | xargs kill -9
lsof -i :5174 | awk 'NR>1 {print $2}' | xargs kill -9
lsof -i :8000 | awk 'NR>1 {print $2}' | xargs kill -9
lsof -i :8001 | awk 'NR>1 {print $2}' | xargs kill -9
