import pytest
import re
from fastapi.testclient import TestClient
from app.main import app
from app.services.voice import parse_voice_command
from app.services.agent_graph import voice_command_graph, smart_apply_graph, job_search_graph

client = TestClient(app)

def test_step14_test1_wake_phrase():
    """TEST 1 — Wake phrase activation."""
    res = client.post("/api/voice/command", json={"transcript": "Please guide me"})
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["action"] == "GUIDANCE_MODE"
    assert data["speech_announcement"] == "Yes, how can I help you?"
    assert data["response_text"] == "Yes, how can I help you?"

def test_step14_test2_job_search():
    """TEST 2 — Job search routing via agent."""
    res = client.post("/api/voice/command", json={"transcript": "Find frontend jobs suitable for my profile."})
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["action"] == "NAVIGATE_JOBSEARCH"
    assert "Frontend" in data["speech_announcement"] or "jobs" in data["speech_announcement"].lower()

def test_step14_test3_job_explanation():
    """TEST 3 — Job explanation routing via agent."""
    res = client.post("/api/voice/command", json={"transcript": "Explain this job requirement."})
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["action"] == "EXPLAIN_JOB"
    assert "Job Explanation" in data["speech_announcement"]

def test_step14_test4_smart_apply_safety():
    """TEST 4 — Smart Apply flow with explicit human confirmation safeguard."""
    res = client.post("/api/voice/command", json={"transcript": "Help me apply for this job."})
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["action"] == "SMART_APPLY_INITIATED"
    assert data["requires_confirmation"] is True
    assert "confirmation is required" in data["speech_announcement"].lower()

def test_step14_test5_normal_speech_rejection():
    """TEST 5 — Normal speech without exact wake phrase does not trigger guidance activation."""
    parsed = parse_voice_command("I need guidance regarding this job.")
    assert parsed["intent"] != "WAKE_WORD"
    
    res = client.post("/api/voice/command", json={"transcript": "I need guidance regarding this job."})
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["action"] != "GUIDANCE_MODE"

def test_step14_test6_repeated_wake_phrase():
    """TEST 6 — Repeated wake phrase handles single activation cleanly."""
    res1 = client.post("/api/voice/command", json={"transcript": "Please guide me"})
    assert res1.json()["data"]["action"] == "GUIDANCE_MODE"
    
    res2 = client.post("/api/voice/command", json={"transcript": "Please guide me."})
    assert res2.json()["data"]["action"] == "GUIDANCE_MODE"

def test_step14_test7_return_to_listening():
    """TEST 7 — Agent command execution returns clean payload for UI state reset."""
    res = client.post("/api/voice/command", json={"transcript": "Find frontend jobs"})
    assert res.status_code == 200
    assert res.json()["status"] == "success"
