import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from app.services.auth_service import get_current_user, get_current_user_optional, verify_supabase_token
from app.database import supabase_client
from app.models.schemas import UserProfile, UserProfileUpdate, AuthStatusResponse
from app.config import settings

logger = logging.getLogger("vet_ai.api.auth")
router = APIRouter(prefix="/auth", tags=["Authentication & Farmer Profiles"])

@router.get("/me", response_model=AuthStatusResponse)
async def get_current_farmer_profile(current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    """
    Get the authenticated farmer's identity and profile information.
    Works seamlessly with Supabase Auth JWT tokens and includes demo mode fallback.
    """
    if not current_user:
        return AuthStatusResponse(
            authenticated=False,
            is_demo=False,
            user=None,
            message="No active session found"
        )

    user_id = current_user.get("id")
    is_demo = current_user.get("is_demo", False)

    if is_demo or not user_id:
        return AuthStatusResponse(
            authenticated=True,
            is_demo=True,
            user=UserProfile(
                id="demo-farmer-uuid",
                email="demo.farmer@greenvalley.farm",
                full_name="John Miller (Demo)",
                farm_name="Green Valley Dairy",
                phone="+1 (555) 234-5678",
                role="farmer"
            ),
            message="Operating in authenticated Demo Sandbox mode"
        )

    # Fetch from public.profiles table
    profile = None
    try:
        profile = supabase_client.get_user_profile(user_id)
    except Exception as e:
        logger.warning(f"Could not load profile from database for user {user_id}: {e}")

    meta = current_user.get("user_metadata", {})
    email = current_user.get("email", "")

    if profile:
        user_profile = UserProfile(
            id=str(profile.get("id", user_id)),
            email=profile.get("email") or email,
            full_name=profile.get("full_name") or meta.get("full_name", "Farmer"),
            farm_name=profile.get("farm_name") or meta.get("farm_name", "Green Valley Farm"),
            phone=profile.get("phone") or meta.get("phone"),
            role=profile.get("role", "farmer"),
            created_at=profile.get("created_at"),
            updated_at=profile.get("updated_at")
        )
    else:
        user_profile = UserProfile(
            id=str(user_id),
            email=email,
            full_name=meta.get("full_name", "Farmer"),
            farm_name=meta.get("farm_name", "Green Valley Farm"),
            phone=meta.get("phone"),
            role="farmer"
        )

    return AuthStatusResponse(
        authenticated=True,
        is_demo=False,
        user=user_profile,
        message="User authenticated successfully"
    )

@router.put("/profile", response_model=UserProfile)
async def update_farmer_profile(
    profile_data: UserProfileUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Update profile details for the authenticated farmer.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update profile in demo sandbox mode. Please sign in with a registered account."
        )

    update_payload = {k: v for k, v in profile_data.model_dump().items() if v is not None}
    if not update_payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields provided for update.")

    # Preserve current email
    update_payload["email"] = current_user.get("email")

    try:
        updated = supabase_client.upsert_user_profile(user_id, update_payload)
        return UserProfile(
            id=str(updated.get("id", user_id)),
            email=updated.get("email"),
            full_name=updated.get("full_name"),
            farm_name=updated.get("farm_name"),
            phone=updated.get("phone"),
            role=updated.get("role", "farmer"),
            created_at=updated.get("created_at"),
            updated_at=updated.get("updated_at")
        )
    except Exception as e:
        logger.error(f"Failed to update profile: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database update failed: {str(e)}")

@router.get("/verify")
async def verify_token_endpoint(authorization: Optional[str] = Header(None)):
    """
    Quick verification endpoint to check if an Authorization Bearer token is valid.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization Bearer header"
        )

    token = authorization.split("Bearer ")[1].strip()
    user = await verify_supabase_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Supabase Auth token"
        )

    return {
        "valid": True,
        "user_id": user.get("id"),
        "email": user.get("email"),
        "confirmed_at": user.get("email_confirmed_at")
    }
