import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_voice_command_ai_normalization_pipeline():
    """
    Verify AI-driven intent routing and transcript normalization without hardcoding.
    """
    # 1. Job search with speech variation ("front end" -> frontend)
    res_jobs = client.post("/api/voice/command", json={
        "transcript": "show me front end jobs",
        "current_page": "/dashboard"
    })
    assert res_jobs.status_code == 200
    data_jobs = res_jobs.json()["data"]
    assert data_jobs["intent"] == "JOB_SEARCH"
    assert data_jobs["action"] == "NAVIGATE_JOBSEARCH"
    assert "frontend" in data_jobs["normalized_transcript"].lower() or "frontend" in data_jobs["search_query"].lower()

    # 2. Application tracking with speech variation ("data analist" -> data analyst)
    res_track = client.post("/api/voice/command", json={
        "transcript": "can you show me what's happening with my data analist application?",
        "current_page": "/dashboard/jobs"
    })
    assert res_track.status_code == 200
    data_track = res_track.json()["data"]
    assert data_track["intent"] == "TRACK_APPLICATIONS"
    assert data_track["action"] == "NAVIGATE_TRACKER"

    # 3. Contextual Job suitability with active job selected ("Am I suitable for this?")
    res_suit = client.post("/api/voice/command", json={
        "transcript": "Am I suitable for this role?",
        "current_page": "/dashboard/jobs",
        "current_job": {
            "title": "Senior Accessibility Specialist",
            "company": "EquiTech Global",
            "skills": ["WCAG 2.2", "React", "Screen Readers"],
            "match_percentage": 94
        }
    })
    assert res_suit.status_code == 200
    data_suit = res_suit.json()["data"]
    assert data_suit["intent"] in ["JOB_MATCH", "GENERAL_VOICE"]
    assert "EquiTech" in data_suit["response_text"] or "match" in data_suit["response_text"].lower()

    # 4. Spoken Email Normalization ("soham dot pashilkar at gmail dot com")
    res_email = client.post("/api/voice/command", json={
        "transcript": "My email is soham dot pashilkar at gmail dot com",
        "current_page": "/dashboard/profile"
    })
    assert res_email.status_code == 200
    data_email = res_email.json()["data"]
    assert data_email["intent"] == "PROFILE_UPDATE"
    assert "soham.pashilkar@gmail.com" in data_email["response_text"] or data_email["entities"].get("value") == "soham.pashilkar@gmail.com"

    # 5. Global Priority Stop
    res_stop = client.post("/api/voice/command", json={
        "transcript": "Stop listening.",
        "current_page": "/dashboard"
    })
    assert res_stop.status_code == 200
    data_stop = res_stop.json()["data"]
    assert data_stop["intent"] == "STOP"
    assert data_stop["immediate_stop"] is True

    # 6. Global Repeat Command
    res_repeat = client.post("/api/voice/command", json={
        "transcript": "Repeat that.",
        "current_page": "/dashboard"
    })
    assert res_repeat.status_code == 200
    data_repeat = res_repeat.json()["data"]
    assert data_repeat["intent"] == "REPEAT"
