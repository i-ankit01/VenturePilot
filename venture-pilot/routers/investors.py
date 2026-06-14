from fastapi import APIRouter, HTTPException

from services import investor_service
from pydantic import BaseModel


class ScheduleMeetingRequest(BaseModel):
    start_time: str   # ISO 8601 with timezone offset
    end_time: str
    timezone: str = "Asia/Kolkata"


class SendReplyRequest(BaseModel):
    body: str | None = None

router = APIRouter(prefix="/api/investors", tags=["investors"])


@router.post("/{project_id}/search")
async def search_investors(project_id: str):
    try:
        investors = await investor_service.find_investors(project_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"investors": investors}


@router.get("/{project_id}")
async def list_investors(project_id: str):
    investors = investor_service.get_investors(project_id)
    return {"investors": investors}


@router.post("/{project_id}/generate-emails")
async def generate_emails(project_id: str):
    try:
        investors = await investor_service.generate_emails(project_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"investors": investors}

@router.post("/{project_id}/{investor_id}/send-email")
async def send_email(project_id: str, investor_id: str):
    try:
        return await investor_service.send_investor_email(project_id, investor_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{project_id}/check-replies")
async def check_replies(project_id: str):
    try:
        updated = await investor_service.check_replies(project_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"updated": updated}


@router.post("/{project_id}/{investor_id}/generate-reply")
async def generate_reply(project_id: str, investor_id: str):
    try:
        return await investor_service.generate_reply(project_id, investor_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{project_id}/{investor_id}/send-reply")
async def send_reply(project_id: str, investor_id: str, payload: SendReplyRequest):
    try:
        return await investor_service.send_investor_reply(project_id, investor_id, payload.body)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{project_id}/{investor_id}/schedule-meeting")
async def schedule_meeting(project_id: str, investor_id: str, payload: ScheduleMeetingRequest):
    try:
        return await investor_service.schedule_meeting(
            project_id, investor_id, payload.start_time, payload.end_time, payload.timezone,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))