import os
from datetime import datetime, timezone

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request as GoogleAuthRequest
import secrets

from services.supabase_client import get_supabase

SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/calendar.events",
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
]

_CLIENT_CONFIG = {
    "web": {
        "client_id": os.environ["GOOGLE_CLIENT_ID"],
        "client_secret": os.environ["GOOGLE_CLIENT_SECRET"],
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": [os.environ["GOOGLE_REDIRECT_URI"]],
    }
}


def generate_code_verifier() -> str:
    """PKCE code_verifier - must persist between /login and /callback."""
    return secrets.token_urlsafe(64)[:128]


# def build_auth_url(state: str) -> str:
#     flow = Flow.from_client_config(_CLIENT_CONFIG, scopes=SCOPES, state=state)
#     flow.redirect_uri = os.environ["GOOGLE_REDIRECT_URI"]
#     auth_url, _ = flow.authorization_url(
#         access_type="offline",
#         include_granted_scopes="true",
#         prompt="consent",  # forces a refresh_token on every connect
#     )
#     return auth_url

def build_auth_url(state: str, code_verifier: str) -> str:
    flow = Flow.from_client_config(_CLIENT_CONFIG, scopes=SCOPES, state=state)
    flow.redirect_uri = os.environ["GOOGLE_REDIRECT_URI"]
    flow.code_verifier = code_verifier
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    return auth_url


# def exchange_code(code: str) -> Credentials:
#     flow = Flow.from_client_config(_CLIENT_CONFIG, scopes=SCOPES)
#     flow.redirect_uri = os.environ["GOOGLE_REDIRECT_URI"]
#     flow.fetch_token(code=code)
#     return flow.credentials

def exchange_code(code: str, code_verifier: str) -> Credentials:
    flow = Flow.from_client_config(_CLIENT_CONFIG, scopes=SCOPES)
    flow.redirect_uri = os.environ["GOOGLE_REDIRECT_URI"]
    flow.code_verifier = code_verifier
    flow.fetch_token(code=code)
    return flow.credentials



def save_credentials(user_id: str, creds: Credentials):
    supabase = get_supabase()
    payload = {
        "user_id": user_id,
        "access_token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_expiry": creds.expiry.replace(tzinfo=timezone.utc).isoformat() if creds.expiry else None,
        "scopes": list(creds.scopes) if creds.scopes else SCOPES,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    supabase.table("google_credentials").upsert(payload, on_conflict="user_id").execute()


def get_credentials_for_user(user_id: str) -> Credentials:
    supabase = get_supabase()
    result = (
        supabase.table("google_credentials")
        .select("*")
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not result.data:
        raise ValueError("User has not connected Gmail/Calendar")

    row = result.data
    creds = Credentials(
        token=row["access_token"],
        refresh_token=row["refresh_token"],
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ["GOOGLE_CLIENT_ID"],
        client_secret=os.environ["GOOGLE_CLIENT_SECRET"],
        scopes=row["scopes"],
    )

    if creds.expired and creds.refresh_token:
        creds.refresh(GoogleAuthRequest())
        save_credentials(user_id, creds)

    return creds


def has_connection(user_id: str) -> bool:
    try:
        get_credentials_for_user(user_id)
        return True
    except ValueError:
        return False