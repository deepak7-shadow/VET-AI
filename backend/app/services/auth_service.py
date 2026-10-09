import logging
import httpx
from typing import Optional, Dict, Any
from fastapi import Header, HTTPException, status
from app.config import settings

logger = logging.getLogger("vet_ai.auth")

# Cache to avoid repeatedly hitting Supabase Auth for valid active tokens
_user_token_cache: Dict[str, Dict[str, Any]] = {}

async def verify_supabase_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verifies a Supabase Auth JWT token by calling Supabase's /auth/v1/user endpoint.
    Returns user payload if valid, None if invalid.
    """
    if token in _user_token_cache:
        return _user_token_cache[token]

    try:
        url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/user"
        headers = {
            "Authorization": f"Bearer {token}",
            "apikey": settings.SUPABASE_PUBLISHABLE_KEY
        }
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                user_data = resp.json()
                _user_token_cache[token] = user_data
                return user_data
            else:
                logger.warning(f"Supabase auth check failed with status {resp.status_code}")
                return None
    except Exception as e:
        logger.error(f"Error validating Supabase auth token: {e}")
        return None

async def get_current_user_optional(authorization: Optional[str] = Header(None)) -> Optional[Dict[str, Any]]:
    """
    Optional authentication: returns the user dict if authenticated, or None.
    If in DEMO_MODE and no token provided, returns a demo user object.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ")[1].strip()
        user = await verify_supabase_token(token)
        if user:
            return user

    if settings.DEMO_MODE:
        return {
            "id": None,
            "email": "demo.farmer@greenvalley.farm",
            "user_metadata": {
                "full_name": "John Miller",
                "farm_name": "Green Valley Dairy"
            },
            "is_demo": True
        }

    return None

async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Strict authentication requirement. Raises 401 if unauthenticated.
    """
    user = await get_current_user_optional(authorization)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in as an authorized farmer.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
