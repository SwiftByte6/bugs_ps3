from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from app.services.profile import user_profile_service, apply_onboarding_presets

router = APIRouter(prefix="/api/profile", tags=["Profile & Accessibility"])


class AccessibilityUpdate(BaseModel):
    declared_needs: Optional[List[str]] = None
    additional_requirements: Optional[str] = None
    screen_reader: Optional[bool] = None
    voice_navigation: Optional[bool] = None
    keyboard_navigation: Optional[bool] = None
    captions: Optional[bool] = None
    text_first: Optional[bool] = None
    text_to_speech: Optional[bool] = None
    speech_to_text: Optional[bool] = None
    large_text: Optional[bool] = None
    high_contrast: Optional[bool] = None
    reduced_motion: Optional[bool] = None
    dyslexia_mode: Optional[bool] = None
    simplified_language: Optional[bool] = None
    eye_control: Optional[bool] = None
    blink_control: Optional[bool] = None
    head_gestures: Optional[bool] = None
    hand_gestures: Optional[bool] = None
    focus_mode: Optional[bool] = None
    preferred_language: Optional[str] = None
    accommodation_disclosure: Optional[str] = None


class OnboardingRequest(BaseModel):
    declared_needs: List[str] = Field(default_factory=list)
    additional_requirements: Optional[str] = ""


class ProfileBuilderRequest(BaseModel):
    name: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    location: Optional[str] = ""
    education: Optional[List[Dict[str, Any]]] = None
    roles_interested_in: Optional[List[str]] = None
    preferred_location: Optional[str] = ""
    work_mode: Optional[str] = "Hybrid"
    experience_level: Optional[str] = ""
    skills: Optional[Dict[str, Any]] = None
    experience: Optional[List[Dict[str, Any]]] = None
    internships: Optional[List[Dict[str, Any]]] = None
    projects: Optional[List[Dict[str, Any]]] = None
    certifications: Optional[List[str]] = None
    achievements: Optional[List[str]] = None
    linkedin: Optional[str] = ""
    github: Optional[str] = ""
    portfolio: Optional[str] = ""
    kaggle: Optional[str] = ""
    other_proof_of_work: Optional[str] = ""


@router.get("")
def get_user_profile():
    return user_profile_service.get_data()


@router.post("/onboarding")
def handle_accessibility_onboarding(req: OnboardingRequest):
    """
    Apply declared accessibility preferences without inferring or diagnosing disability.
    Automatically assigns sensible defaults according to user selections.
    """
    presets = apply_onboarding_presets(req.declared_needs, req.additional_requirements or "")
    updated = user_profile_service.update_accessibility(presets)
    return {
        "status": "success",
        "message": "Accessibility profile initialized with declared preferences.",
        "accessibility": updated
    }


@router.get("/completeness")
def get_profile_completeness():
    """Returns profile completeness checklist, progress percentage, and missing fields."""
    return {
        "status": "success",
        "completeness": user_profile_service.get_completeness()
    }


@router.post("/accessibility")
def update_accessibility_preferences(update: AccessibilityUpdate):
    filtered = {k: v for k, v in update.model_dump().items() if v is not None}
    updated = user_profile_service.update_accessibility(filtered)
    return {
        "status": "success",
        "accessibility": updated
    }


@router.post("/resume")
def update_resume_profile(profile_data: Dict[str, Any]):
    updated = user_profile_service.update_resume_profile(profile_data)
    return {
        "status": "success",
        "resume_profile": updated
    }


@router.post("/builder")
def build_profile_manually(req: ProfileBuilderRequest):
    """Save profile created via accessible step-by-step profile builder."""
    payload = {k: v for k, v in req.model_dump().items() if v is not None and v != ""}
    # Normalize skills
    if "skills" in payload and isinstance(payload["skills"], dict):
        all_skills = payload["skills"].get("all_skills", [])
        if not all_skills:
            all_skills = (
                payload["skills"].get("technical_skills", []) +
                payload["skills"].get("soft_skills", [])
            )
            payload["skills"]["all_skills"] = all_skills

    updated = user_profile_service.update_resume_profile(payload)
    completeness = user_profile_service.get_completeness()
    return {
        "status": "success",
        "message": "Profile saved via builder.",
        "resume_profile": updated,
        "completeness": completeness
    }

