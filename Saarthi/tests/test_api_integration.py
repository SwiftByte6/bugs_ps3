import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_api_resume_demo():
    res = client.get("/api/resume/demo")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["profile"]["name"] == "Test User"


def test_api_jobs_endpoints():
    demo_res = client.get("/api/jobs/demo")
    assert demo_res.status_code == 200

    parse_res = client.post("/api/jobs/parse", json={"text": demo_res.json()["raw_text"]})
    assert parse_res.status_code == 200

    match_res = client.post("/api/jobs/match", json={"job": demo_res.json()["job_json"]})
    assert match_res.status_code == 200
    assert match_res.json()["match"]["overall_match_score"] > 50


def test_api_rag_query():
    res = client.post("/api/rag/query", json={"query": "What is keyboard navigation?"})
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data["sources"]) >= 1


def test_api_tracker_endpoints():
    get_res = client.get("/api/tracker")
    assert get_res.status_code == 200

    post_res = client.post("/api/tracker", json={
        "company": "Test Company",
        "position": "Data Scientist",
        "status": "Applied"
    })
    assert post_res.status_code == 200
    assert post_res.json()["application"]["company"] == "Test Company"


def test_api_vision_endpoints():
    res = client.get("/api/vision/status")
    assert res.status_code == 200
    assert "privacy_notice" in res.json()


def test_api_voice_endpoints():
    res = client.post("/api/voice/intent", json={"transcript": "stop"})
    assert res.status_code == 200
    assert res.json()["data"]["intent"] == "STOP"
