from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
from typing import Dict, Any, List, Optional
from app.services.dom_analyzer import analyze_dom, audit_accessibility
from app.services.form_filler import map_all_fields
from app.services.profile import user_profile_service
from app.services.tracker import application_tracker

router = APIRouter(prefix="/api/dom", tags=["DOM & Forms"])


class HTMLPayload(BaseModel):
    html: str


class MapFieldsRequest(BaseModel):
    inputs: Optional[List[Dict[str, Any]]] = None
    html: Optional[str] = None


class SubmitApplicationRequest(BaseModel):
    company: str
    position: str
    application_fields: Dict[str, Any]
    user_confirmed: bool  # Explicit confirmation safeguard


@router.post("/analyze")
def analyze_page_dom(payload: HTMLPayload):
    if not payload.html.strip():
        raise HTTPException(status_code=400, detail="HTML content cannot be empty.")
    dom_data = analyze_dom(payload.html)
    return {
        "status": "success",
        "data": dom_data
    }


@router.post("/audit")
def audit_page_accessibility(payload: HTMLPayload):
    if not payload.html.strip():
        raise HTTPException(status_code=400, detail="HTML content cannot be empty.")
    dom_data = analyze_dom(payload.html)
    audit_report = audit_accessibility(dom_data)
    return {
        "status": "success",
        "report": audit_report
    }


@router.post("/map-fields")
def map_fields(req: MapFieldsRequest):
    inputs = req.inputs
    if not inputs and req.html:
        dom_data = analyze_dom(req.html)
        inputs = dom_data.get("inputs", [])
    if not inputs:
        raise HTTPException(status_code=400, detail="No input fields or HTML provided.")

    profile_data = user_profile_service.get_data()
    resume_profile = profile_data.get("resume_profile", {})
    disclosure_pref = profile_data.get("accessibility", {}).get("accommodation_disclosure", "ask_every_time")

    mapping_result = map_all_fields(inputs, resume_profile, disclosure_preference=disclosure_pref)
    return {
        "status": "success",
        "data": mapping_result
    }


@router.post("/submit-application")
def submit_application(req: SubmitApplicationRequest):
    if not req.user_confirmed:
        raise HTTPException(
            status_code=400,
            detail="Safeguard Violation: Application submission requires explicit user confirmation. Automatically submitting applications is strictly prohibited."
        )

    # Log to tracker
    tracked = application_tracker.add({
        "company": req.company,
        "position": req.position,
        "status": "Applied",
        "notes": f"Submitted via Smart Form Assistant with {len(req.application_fields)} populated fields.",
        "accessibility_info": "User confirmed accessible submission."
    })

    return {
        "status": "success",
        "message": "Application submitted with explicit candidate confirmation and logged in tracker.",
        "application": tracked
    }


@router.get("/demo-html")
def get_demo_html():
    demo_file = Path("data/demo/sample_application.html")
    if not demo_file.exists():
        raise HTTPException(status_code=404, detail="Demo HTML file not found.")
    return {
        "status": "success",
        "html": demo_file.read_text(encoding="utf-8")
    }
