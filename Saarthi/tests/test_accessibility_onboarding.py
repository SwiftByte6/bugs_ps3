import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.profile import apply_onboarding_presets, calculate_profile_completeness

client = TestClient(app)


def test_onboarding_presets_blind():
    presets = apply_onboarding_presets(["Blind"])
    assert presets["text_to_speech"] is True
    assert presets["speech_to_text"] is True
    assert presets["voice_navigation"] is True
    assert presets["keyboard_navigation"] is True
    assert presets["screen_reader"] is True
    assert presets["head_gestures"] is True


def test_onboarding_presets_low_vision():
    presets = apply_onboarding_presets(["Low vision"])
    assert presets["large_text"] is True
    assert presets["high_contrast"] is True
    assert presets["text_to_speech"] is True


def test_onboarding_presets_motor():
    presets = apply_onboarding_presets(["Motor disability"])
    assert presets["head_gestures"] is True
    assert presets["hand_gestures"] is True
    assert presets["voice_navigation"] is True
    assert presets["keyboard_navigation"] is True


def test_onboarding_presets_dyslexia():
    presets = apply_onboarding_presets(["Dyslexia"])
    assert presets["dyslexia_mode"] is True
    assert presets["simplified_language"] is True
    assert presets["large_text"] is True
    assert presets["text_to_speech"] is True
    assert presets["focus_mode"] is True


def test_onboarding_api_endpoint():
    res = client.post("/api/profile/onboarding", json={
        "declared_needs": ["Dyslexia", "Motor disability"],
        "additional_requirements": "Extra time needed"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["accessibility"]["dyslexia_mode"] is True
    assert data["accessibility"]["head_gestures"] is True


def test_profile_completeness_calculation():
    sample_profile = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "location": "Bengaluru",
        "education": [{"degree": "B.Tech"}],
        "skills": {"all_skills": ["Python", "SQL"]},
        "experience": [{"role": "Analyst"}],
        "projects": [{"title": "Dashboard"}],
        "certifications": ["AWS Certified"],
        "linkedin": "linkedin.com/in/janedoe"
    }
    result = calculate_profile_completeness(sample_profile)
    assert result["score"] >= 70
    assert result["completed_count"] >= 7
    assert any(c["key"] == "name" and c["present"] for c in result["checklist"])


def test_profile_builder_endpoint():
    res = client.post("/api/profile/builder", json={
        "name": "Alex Smith",
        "email": "alex@example.com",
        "phone": "+91 9123456789",
        "location": "Hyderabad",
        "roles_interested_in": ["Data Analyst", "Business Analyst"],
        "skills": {
            "technical_skills": ["Python", "SQL", "Tableau"],
            "soft_skills": ["Problem Solving", "Communication"]
        }
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["resume_profile"]["name"] == "Alex Smith"
    assert "Python" in data["resume_profile"]["skills"]["all_skills"]
