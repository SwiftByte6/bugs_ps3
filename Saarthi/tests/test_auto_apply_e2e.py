import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_auto_apply_and_dashboard_flow():
    """
    Test Complete Flow:
    1. Scraped jobs ingestion from extension (POST /api/jobs/extension-ingest)
    2. Verification in Scraped Jobs endpoint (GET /api/jobs/scraped)
    3. DOM Form Mapping with safe vs ambiguous fields (POST /api/dom/map-fields)
    4. Explicit Confirmation Safeguard Check (POST /api/dom/submit-application)
    5. Confirmed Submission (user_confirmed: True)
    6. Application Tracker verification (GET /api/tracker/applications)
    """
    scraped_payload = {
        "portal": "TestJobPortal",
        "url": "http://localhost:3000/test-jobs",
        "jobs": [
            {
                "id": "e2e-job-01",
                "title": "Senior Accessibility Specialist",
                "company": "EquiTech Global",
                "location": "Remote / Bengaluru",
                "experience": "3+ years",
                "employmentType": "Full-time",
                "skills": ["WCAG 2.2", "React", "Screen Readers"],
                "description": "Lead web accessibility audits and assistive tech integrations.",
                "url": "http://localhost:3000/test-jobs/job-001"
            }
        ]
    }

    # 1. Extension sends scraped jobs to backend
    ingest_res = client.post("/api/jobs/extension-ingest", json=scraped_payload)
    assert ingest_res.status_code == 200
    ingest_data = ingest_res.json()
    assert ingest_data["status"] == "success"
    assert ingest_data["jobs_received"] == 1

    # 2. Verify scraped jobs endpoint for dashboard
    scraped_res = client.get("/api/jobs/scraped")
    assert scraped_res.status_code == 200
    scraped_data = scraped_res.json()
    scraped_list = scraped_data.get("jobs", [])
    assert any(j["id"] == "e2e-job-01" for j in scraped_list)

    # 3. Simulate extension extracting DOM form fields from portal
    dom_payload = {
        "fields": [
            {"id": "applicant_name", "name": "applicant_name", "type": "text", "label": "Full Name"},
            {"id": "applicant_email", "name": "applicant_email", "type": "email", "label": "Email Address"},
            {"id": "applicant_phone", "name": "applicant_phone", "type": "tel", "label": "Phone Number"},
            {"id": "applicant_location", "name": "applicant_location", "type": "text", "label": "Location"},
            {"id": "applicant_linkedin", "name": "applicant_linkedin", "type": "url", "label": "LinkedIn Profile"},
            {"id": "applicant_education", "name": "applicant_education", "type": "text", "label": "Highest Education"},
            {"id": "applicant_skills", "name": "applicant_skills", "type": "text", "label": "Key Skills"},
            {"id": "expected_salary", "name": "expected_salary", "type": "text", "label": "Expected CTC / Salary"},
            {"id": "accommodation_request", "name": "accommodation_request", "type": "textarea", "label": "Workplace Accommodations Needed"}
        ]
    }

    map_res = client.post("/api/dom/map-fields", json=dom_payload)
    assert map_res.status_code == 200
    map_data = map_res.json()["data"]

    # Verify Safe fields are populated and ambiguous/sensitive fields are flagged
    review_summary = map_data["review_summary"]
    safe_fields = review_summary["safe_fields"]
    ambiguous_fields = review_summary["ambiguous_fields"]

    filled_field_ids = {f["field_id"] for f in safe_fields}
    assert "applicant_name" in filled_field_ids
    assert "applicant_email" in filled_field_ids
    assert "applicant_phone" in filled_field_ids
    assert "applicant_location" in filled_field_ids
    assert "applicant_linkedin" in filled_field_ids

    # Expected salary & accommodations must require confirmation
    assert len(ambiguous_fields) >= 2
    manual_ids = {f["field_id"] for f in ambiguous_fields}
    assert "expected_salary" in manual_ids
    assert "accommodation_request" in manual_ids

    # 4. Safeguard: Attempting submission without user_confirmed must be rejected (400)
    unconfirmed_sub = {
        "job_id": "e2e-job-01",
        "job_title": "Senior Accessibility Specialist",
        "company": "EquiTech Global",
        "portal": "TestJobPortal",
        "application_url": "http://localhost:3000/test-jobs/job-001",
        "filled_fields": {f["field_id"]: f["suggested_value"] for f in safe_fields},
        "user_confirmed": False
    }
    rejected_res = client.post("/api/dom/submit-application", json=unconfirmed_sub)
    assert rejected_res.status_code == 400
    assert "safeguard" in rejected_res.json()["detail"].lower()

    # 5. Confirmed Submission (user_confirmed: True)
    confirmed_sub = {
        "job_id": "e2e-job-01",
        "job_title": "Senior Accessibility Specialist",
        "company": "EquiTech Global",
        "portal": "TestJobPortal",
        "application_url": "http://localhost:3000/test-jobs/job-001",
        "filled_fields": {f["field_id"]: f["suggested_value"] for f in safe_fields},
        "user_confirmed": True
    }
    submit_res = client.post("/api/dom/submit-application", json=confirmed_sub)
    assert submit_res.status_code == 200
    submit_data = submit_res.json()
    assert submit_data["status"] == "success"
    assert submit_data["application"] is not None

    # 6. Verify Dashboard Application Tracker has recorded the submission
    tracker_res = client.get("/api/tracker")
    assert tracker_res.status_code == 200
    applications = tracker_res.json().get("applications", [])
    matched_app = next((a for a in applications if a.get("job_id") == "e2e-job-01"), None)
    assert matched_app is not None
    assert matched_app["job_title"] == "Senior Accessibility Specialist"
    assert matched_app["company"] == "EquiTech Global"
    assert matched_app["status"] == "Applied"
    assert matched_app["application_url"] == "http://localhost:3000/test-jobs/job-001"
