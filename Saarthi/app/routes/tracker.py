from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.services.tracker import application_tracker

router = APIRouter(prefix="/api/tracker", tags=["Application Tracker"])


class NewApplicationRequest(BaseModel):
    company: str
    position: str
    status: Optional[str] = "Applied"
    interview_date: Optional[str] = None
    notes: Optional[str] = ""
    follow_up_date: Optional[str] = None
    accessibility_info: Optional[str] = ""


class UpdateStatusRequest(BaseModel):
    status: str
    notes: Optional[str] = None


@router.get("")
def list_applications():
    return {
        "status": "success",
        "applications": application_tracker.get_all()
    }


@router.post("")
def add_application(req: NewApplicationRequest):
    new_app = application_tracker.add(req.model_dump())
    return {
        "status": "success",
        "application": new_app
    }


@router.patch("/{app_id}")
def update_application_status(app_id: str, req: UpdateStatusRequest):
    try:
        updated = application_tracker.update_status(app_id, req.status, req.notes)
        if not updated:
            raise HTTPException(status_code=404, detail=f"Application {app_id} not found.")
        return {
            "status": "success",
            "application": updated
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
