import uuid
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials


def _service(creds: Credentials):
    return build("calendar", "v3", credentials=creds)


def create_meeting(
    creds: Credentials,
    summary: str,
    description: str,
    start_time: str,   # ISO 8601, e.g. "2026-06-20T15:00:00+05:30"
    end_time: str,
    attendee_email: str,
    timezone_str: str = "Asia/Kolkata",
) -> dict:
    event = {
        "summary": summary,
        "description": description,
        "start": {"dateTime": start_time, "timeZone": timezone_str},
        "end": {"dateTime": end_time, "timeZone": timezone_str},
        "attendees": [{"email": attendee_email}],
        "conferenceData": {
            "createRequest": {
                "requestId": str(uuid.uuid4()),
                "conferenceSolutionKey": {"type": "hangoutsMeet"},
            }
        },
    }

    created = _service(creds).events().insert(
        calendarId="primary",
        body=event,
        conferenceDataVersion=1,
        sendUpdates="all",
    ).execute()

    return {
        "meet_link": created.get("hangoutLink"),
        "event_id": created.get("id"),
        "html_link": created.get("htmlLink"),
    }