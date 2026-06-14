import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from itsdangerous import URLSafeSerializer, BadSignature

from integrations import google_auth

router = APIRouter(prefix="/api/auth/google", tags=["auth"])

_serializer = URLSafeSerializer(os.environ["SECRET_KEY"], salt="google-oauth-state")


# @router.get("/login")
# async def login(user_id: str, project_id: str):
#     """Frontend does a full-page redirect here, not a fetch call."""
#     state = _serializer.dumps({"user_id": user_id, "project_id": project_id})
#     return RedirectResponse(google_auth.build_auth_url(state=state))


# @router.get("/callback")
# async def callback(code: str, state: str):
#     try:
#         payload = _serializer.loads(state)
#     except BadSignature:
#         raise HTTPException(status_code=400, detail="Invalid OAuth state")

#     creds = google_auth.exchange_code(code)
#     google_auth.save_credentials(payload["user_id"], creds)

#     frontend_url = os.environ["FRONTEND_URL"]
#     project_id = payload["project_id"]
#     return RedirectResponse(f"{frontend_url}/investors/{project_id}?gmail_connected=true")

@router.get("/login")
async def login(user_id: str, project_id: str):
    code_verifier = google_auth.generate_code_verifier()
    state = _serializer.dumps({
        "user_id": user_id,
        "project_id": project_id,
        "code_verifier": code_verifier,
    })
    return RedirectResponse(google_auth.build_auth_url(state=state, code_verifier=code_verifier))


@router.get("/callback")
async def callback(code: str, state: str):
    try:
        payload = _serializer.loads(state)
    except BadSignature:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")

    creds = google_auth.exchange_code(code, payload["code_verifier"])
    google_auth.save_credentials(payload["user_id"], creds)

    frontend_url = os.environ["FRONTEND_URL"]
    project_id = payload["project_id"]
    return RedirectResponse(f"{frontend_url}/investors/{project_id}?gmail_connected=true")


@router.get("/status")
async def status(user_id: str):
    return {"connected": google_auth.has_connection(user_id)}