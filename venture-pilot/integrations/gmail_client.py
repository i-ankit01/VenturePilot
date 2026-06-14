import base64
from email.mime.text import MIMEText

from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials


def _service(creds: Credentials):
    return build("gmail", "v1", credentials=creds)


def get_profile_email(creds: Credentials) -> str:
    profile = _service(creds).users().getProfile(userId="me").execute()
    return profile.get("emailAddress", "")


def send_email(
    creds: Credentials,
    to: str,
    subject: str,
    body: str,
    thread_id: str | None = None,
    in_reply_to_message_id: str | None = None,
) -> dict:
    message = MIMEText(body)
    message["to"] = to
    message["subject"] = subject
    if in_reply_to_message_id:
        message["In-Reply-To"] = in_reply_to_message_id
        message["References"] = in_reply_to_message_id

    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    payload = {"raw": raw}
    if thread_id:
        payload["threadId"] = thread_id

    return _service(creds).users().messages().send(userId="me", body=payload).execute()


def get_thread_messages(creds: Credentials, thread_id: str) -> list[dict]:
    thread = _service(creds).users().threads().get(userId="me", id=thread_id, format="full").execute()
    return thread.get("messages", [])


def get_header(message: dict, name: str) -> str:
    for header in message.get("payload", {}).get("headers", []):
        if header["name"].lower() == name.lower():
            return header["value"]
    return ""


def extract_message_text(message: dict) -> str:
    payload = message.get("payload", {})

    def _walk(part):
        if part.get("mimeType") == "text/plain" and "data" in part.get("body", {}):
            return base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8", errors="replace")
        for sub in part.get("parts", []):
            found = _walk(sub)
            if found:
                return found
        return None

    return _walk(payload) or ""