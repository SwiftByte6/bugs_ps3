import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional

logger = logging.getLogger("app.profile")

PROFILE_STORE_FILE = Path("data/user_profile.json")

DEFAULT_ACCESSIBILITY_PROFILE = {
    "declared_needs": [],
    "additional_requirements": "",
    "screen_reader": False,
    "voice_navigation": False,
    "keyboard_navigation": True,
    "captions": True,
    "text_first": True,
    "text_to_speech": False,
    "speech_to_text": False,
    "large_text": False,
    "high_contrast": False,
    "reduced_motion": False,
    "dyslexia_mode": False,
    "simplified_language": True,
    "eye_control": False,
    "blink_control": False,
    "head_gestures": False,
    "hand_gestures": False,
    "focus_mode": False,
    "preferred_language": "English",
    "accommodation_disclosure": "ask_every_time"  # "never", "ask_every_time", "allow_selected"
}


def apply_onboarding_presets(declared_needs: List[str], additional_requirements: str = "") -> Dict[str, Any]:
    """
    Generate sensible, accessible default settings based on user-declared needs.
    Never infers disability; respects declared user selections.
    """
    preset = dict(DEFAULT_ACCESSIBILITY_PROFILE)
    preset["declared_needs"] = declared_needs
    preset["additional_requirements"] = additional_requirements

    needs_lower = [n.lower() for n in declared_needs]

    if any("blind" in n for n in needs_lower):
        preset["text_to_speech"] = True
        preset["speech_to_text"] = True
        preset["voice_navigation"] = True
        preset["keyboard_navigation"] = True
        preset["screen_reader"] = True
        preset["head_gestures"] = True

    if any("low vision" in n for n in needs_lower):
        preset["large_text"] = True
        preset["high_contrast"] = True
        preset["text_to_speech"] = True
        preset["keyboard_navigation"] = True
        preset["screen_reader"] = True

    if any("motor" in n for n in needs_lower):
        preset["head_gestures"] = True
        preset["hand_gestures"] = True
        preset["voice_navigation"] = True
        preset["keyboard_navigation"] = True
        preset["speech_to_text"] = True

    if any("dyslexia" in n for n in needs_lower):
        preset["dyslexia_mode"] = True
        preset["simplified_language"] = True
        preset["large_text"] = True
        preset["text_to_speech"] = True
        preset["focus_mode"] = True

    if any("hearing" in n for n in needs_lower):
        preset["captions"] = True
        preset["text_first"] = True

    if any("speech" in n for n in needs_lower):
        preset["text_first"] = True
        preset["head_gestures"] = True
        preset["hand_gestures"] = True
        preset["keyboard_navigation"] = True

    if any("multiple" in n for n in needs_lower):
        preset["text_to_speech"] = True
        preset["speech_to_text"] = True
        preset["keyboard_navigation"] = True
        preset["head_gestures"] = True
        preset["simplified_language"] = True

    return preset


def calculate_profile_completeness(resume_profile: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate profile completeness checklist and missing items."""
    checks = [
        ("name", "Name", bool(resume_profile.get("name"))),
        ("location", "Location", bool(resume_profile.get("location"))),
        ("email", "Email", bool(resume_profile.get("email"))),
        ("phone", "Phone", bool(resume_profile.get("phone"))),
        ("education", "Education", bool(resume_profile.get("education"))),
        ("skills", "Skills", bool(resume_profile.get("skills", {}).get("all_skills") if isinstance(resume_profile.get("skills"), dict) else resume_profile.get("skills"))),
        ("experience", "Work Experience", bool(resume_profile.get("experience"))),
        ("projects", "Projects", bool(resume_profile.get("projects"))),
        ("certifications", "Certifications", bool(resume_profile.get("certifications"))),
        ("linkedin", "LinkedIn", bool(resume_profile.get("linkedin"))),
        ("github", "GitHub / Portfolio", bool(resume_profile.get("github") or resume_profile.get("portfolio"))),
    ]

    total = len(checks)
    completed = sum(1 for _, _, present in checks if present)
    pct = round((completed / total) * 100)

    checklist = [
        {"key": key, "label": label, "present": present}
        for key, label, present in checks
    ]
    missing = [label for _, label, present in checks if not present]

    return {
        "score": pct,
        "completed_count": completed,
        "total_count": total,
        "checklist": checklist,
        "missing_items": missing,
        "status_message": f"Profile completeness is {pct}%. {len(missing)} optional/recommended fields can be added."
    }


class UserProfileService:
    def __init__(self, file_path: Path = PROFILE_STORE_FILE):
        self.file_path = file_path
        self._ensure_storage()

    def _ensure_storage(self):
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.file_path.exists():
            default_data = {
                "accessibility": DEFAULT_ACCESSIBILITY_PROFILE,
                "resume_profile": {}
            }
            self.file_path.write_text(json.dumps(default_data, indent=2), encoding="utf-8")

    def get_data(self) -> Dict[str, Any]:
        try:
            return json.loads(self.file_path.read_text(encoding="utf-8"))
        except Exception:
            return {
                "accessibility": DEFAULT_ACCESSIBILITY_PROFILE,
                "resume_profile": {}
            }

    def get_profile(self) -> Dict[str, Any]:
        return self.get_data()

    def get_resume_profile(self) -> Dict[str, Any]:
        data = self.get_data()
        return data.get("resume_profile", {})

    def update_accessibility(self, settings: Dict[str, Any]) -> Dict[str, Any]:
        data = self.get_data()
        data["accessibility"].update(settings)
        self.file_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
        return data["accessibility"]

    def update_resume_profile(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        data = self.get_data()
        data["resume_profile"].update(profile)
        self.file_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
        return data["resume_profile"]

    def get_completeness(self) -> Dict[str, Any]:
        data = self.get_data()
        return calculate_profile_completeness(data.get("resume_profile", {}))


# Global singleton instance
user_profile_service = UserProfileService()
