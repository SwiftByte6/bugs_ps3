import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger("app.tracker")

TRACKER_FILE = Path("data/applications.json")

VALID_STATUSES = [
    "Saved", "Reviewing", "Ready to Apply", "Waiting for Approval",
    "Applied", "Assessment", "Interview", "Offer", "Rejected", "Withdrawn"
]


def normalize_status(status_str: str) -> str:
    cleaned = status_str.strip().lower()
    mapping = {
        "saved": "Saved",
        "reviewing": "Reviewing",
        "ready to apply": "Ready to Apply",
        "ready_to_apply": "Ready to Apply",
        "waiting for approval": "Waiting for Approval",
        "waiting_for_approval": "Waiting for Approval",
        "applied": "Applied",
        "assessment": "Assessment",
        "interview": "Interview",
        "offer": "Offer",
        "rejected": "Rejected",
        "withdrawn": "Withdrawn"
    }
    return mapping.get(cleaned, "Applied")


class ApplicationTracker:
    def __init__(self, file_path: Path = TRACKER_FILE):
        self.file_path = file_path
        self._ensure_storage()

    def _ensure_storage(self):
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.file_path.exists():
            # Seed with one demo record
            demo_record = [{
                "id": "app_001",
                "company": "CogniCorp Technologies",
                "position": "Junior Data Analyst / ML Associate",
                "date_applied": datetime.now().strftime("%Y-%m-%d"),
                "status": "Applied",
                "interview_date": None,
                "notes": "Submitted with requested screen reader and captioning accommodations.",
                "follow_up_date": None,
                "accessibility_info": "Requested screen reader friendly tests."
            }]
            self.file_path.write_text(json.dumps(demo_record, indent=2), encoding="utf-8")

    def get_all(self) -> List[Dict[str, Any]]:
        try:
            return json.loads(self.file_path.read_text(encoding="utf-8"))
        except Exception as e:
            logger.error(f"Error reading applications: {e}")
            return []

    def add(self, app_data: Dict[str, Any]) -> Dict[str, Any]:
        records = self.get_all()
        new_id = f"app_{len(records) + 1:03d}"
        raw_status = app_data.get("status", "Applied")
        status = normalize_status(raw_status)

        new_record = {
            "id": new_id,
            "company": app_data.get("company", "Unknown"),
            "position": app_data.get("position", "Applicant"),
            "date_applied": app_data.get("date_applied") or datetime.now().strftime("%Y-%m-%d"),
            "status": status,
            "interview_date": app_data.get("interview_date"),
            "notes": app_data.get("notes", ""),
            "follow_up_date": app_data.get("follow_up_date"),
            "accessibility_info": app_data.get("accessibility_info", "")
        }
        records.append(new_record)
        self.file_path.write_text(json.dumps(records, indent=2), encoding="utf-8")
        return new_record

    def update_status(self, app_id: str, new_status: str, notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
        norm_status = normalize_status(new_status)
        if norm_status not in VALID_STATUSES:
            raise ValueError(f"Invalid status. Must be one of {VALID_STATUSES}")
        records = self.get_all()
        target = None
        for r in records:
            if r["id"] == app_id:
                r["status"] = norm_status
                if notes:
                    r["notes"] = notes
                target = r
                break
        if target:
            self.file_path.write_text(json.dumps(records, indent=2), encoding="utf-8")
        return target


application_tracker = ApplicationTracker()
