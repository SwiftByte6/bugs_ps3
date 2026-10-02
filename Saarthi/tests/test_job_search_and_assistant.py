import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.jobs import job_search_agent

client = TestClient(app)


def test_job_search_catalog():
    results = job_search_agent.search("Data Analyst")
    assert results["total_found"] >= 1
    assert len(results["related_roles"]) >= 1
    # Check that each related role has an explanation
    for rel in results["related_roles"]:
        assert "role" in rel
        assert "reason" in rel
        assert len(rel["reason"]) > 10


def test_job_search_api_endpoint():
    res = client.post("/api/jobs/search", json={"query": "remote data analyst"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "jobs" in data["data"]
    assert "related_roles" in data["data"]


def test_simplify_question_endpoint():
    complex_q = (
        "Please provide a comprehensive overview of your professional experience "
        "and how it aligns with the strategic requirements of this role."
    )
    res = client.post("/api/jobs/simplify-question", json={"question": complex_q})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "simplified_question" in data["data"]
    assert "what_to_include" in data["data"]
    assert len(data["data"]["what_to_include"]) >= 2


def test_explain_difficult_word_endpoint():
    res = client.post("/api/jobs/explain-term", json={"term": "stakeholder"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "person or group" in data["data"]["explanation"].lower() or "stakeholder" in data["data"]["explanation"].lower()


def test_career_assistant_query():
    res = client.post("/api/jobs/assistant-query", json={"query": "Explain this job."})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert len(data["data"]["answer"]) > 15
