from clerk_backend_api import AuthenticateRequestOptions, authenticate_request
from fastapi import HTTPException, Request

from .config import get_settings


def get_current_user_id(request: Request) -> str:
    settings = get_settings()
    state = authenticate_request(
        request,
        AuthenticateRequestOptions(
            secret_key=settings.clerk_secret_key,
            authorized_parties=settings.clerk_authorized_parties,
            accepts_token=["session_token"],
        ),
    )
    if not state.is_signed_in:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return state.payload["sub"]
