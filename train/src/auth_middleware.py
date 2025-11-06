import os
import httpx
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()
AUTH_API_URL = os.getenv("AUTH_API_URL", "http://auth.vpbank.workers.dev")

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Validate token with auth service"""
    token = credentials.credentials
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{AUTH_API_URL}/api/auth/validate",
                headers={"Authorization": f"Bearer {token}"},
                timeout=5.0
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication credentials"
                )
            
            data = response.json()
            return {
                "user_id": data["userId"],
                "email": data["email"]
            }
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )