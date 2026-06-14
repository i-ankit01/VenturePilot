from fastapi import APIRouter, HTTPException

from services import investor_service

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