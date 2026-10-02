import pytest
from pathlib import Path
from app.services.dom_analyzer import analyze_dom, audit_accessibility
from app.services.form_filler import map_all_fields
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def test_dom_parsing_and_accessibility_audit():
    html_path = Path("data/demo/sample_application.html")
    html = html_path.read_text(encoding="utf-8")

    # 1. Structural DOM Extraction
    dom = analyze_dom(html)
    assert dom["total_fields"] >= 10
    assert len(dom["headings"]) >= 1
    assert len(dom["buttons"]) >= 1

    # 2. Heuristic Accessibility Audit
    audit = audit_accessibility(dom)
    assert "automated heuristic audit" in audit["disclaimer"].lower()
    assert audit["summary"]["total_issues"] >= 1
    # Check that unlabeled input was caught
    issue_types = [i["type"] for i in audit["issues"]]
    assert "missing_labels" in issue_types


def test_smart_form_mapping_safe_vs_ambiguous():
    html_path = Path("data/demo/sample_application.html")
    html = html_path.read_text(encoding="utf-8")
    dom = analyze_dom(html)

    profile = {
        "name": "Test User",
        "email": "test@example.com",
        "phone": "+91 9000000000",
        "location": "Pune, India",
        "experience": [{"role": "Intern"}]
    }

    result = map_all_fields(dom["inputs"], profile)
    rev = result["review_summary"]

    assert rev["safe_auto_fields"] >= 3
    assert rev["ambiguous_review_fields"] >= 2
    assert rev["submission_requires_user_confirmation"] is True

    # Safe fields must contain name and email
    safe_names = [f["field_name"] for f in rev["safe_fields"]]
    assert "name" in safe_names
    assert "email" in safe_names

    # Ambiguous fields must contain salary and referral code
    amb_names = [f["field_name"] for f in rev["ambiguous_fields"]]
    assert "salary_expectation" in amb_names


def test_application_submission_safeguard():
    # Attempt submission without confirmation should fail (400)
    res_fail = client.post("/api/dom/submit-application", json={
        "company": "CogniCorp",
        "position": "Analyst",
        "application_fields": {},
        "user_confirmed": False
    })
    assert res_fail.status_code == 400
    assert "explicit user confirmation" in res_fail.json()["detail"].lower()

    # Submission with explicit confirmation succeeds (200)
    res_ok = client.post("/api/dom/submit-application", json={
        "company": "CogniCorp",
        "position": "Analyst",
        "application_fields": {"name": "Test User"},
        "user_confirmed": True
    })
    assert res_ok.status_code == 200
    assert res_ok.json()["status"] == "success"
