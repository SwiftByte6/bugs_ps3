import io
import wave
import struct
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.agent_graph import (
    voice_command_graph,
    job_search_graph,
    smart_apply_graph,
    tracker_query_graph,
    career_assistant_graph,
    profile_pipeline_graph,
    interview_prep_graph
)
from app.services.whisper_service import whisper_service
from app.services.profile import calculate_profile_completeness

client = TestClient(app)


def test_faster_whisper_cpu_service_transcription():
    """Verify local Faster-Whisper CPU transcription service."""
    assert whisper_service.is_available() is True

    # Generate 1 sec 16kHz mono synthetic WAV
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(16000)
        wav.writeframes(struct.pack("<" + ("h" * 16000), *([0] * 16000)))
    raw_wav = buf.getvalue()

    result = whisper_service.transcribe_audio_bytes(raw_wav, file_suffix=".wav")
    assert "transcript" in result
    assert "language" in result
    assert result["language"] == "en"


def test_voice_transcribe_endpoint():
    """Verify /api/voice/transcribe receives audio and returns transcript."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(16000)
        wav.writeframes(struct.pack("<" + ("h" * 16000), *([0] * 16000)))
    raw_wav = buf.getvalue()

    response = client.post(
        "/api/voice/transcribe",
        files={"file": ("test.wav", raw_wav, "audio/wav")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "transcript" in data["data"]


def test_langgraph_voice_command_endpoint():
    """Verify /api/voice/command routes through LangGraph."""
    # Test 1: Navigation
    res = client.post("/api/voice/command", json={"transcript": "open job search"})
    assert res.status_code == 200
    assert res.json()["data"]["action"] in ["NAVIGATE", "NAVIGATE_JOBSEARCH"]

    # Test 2: Guide me
    res_guide = client.post("/api/voice/command", json={"transcript": "please guide me"})
    assert res_guide.status_code == 200
    assert res_guide.json()["data"]["action"] == "GUIDANCE_MODE"
    assert "Waiting for your command" in res_guide.json()["data"]["speech_announcement"]

    # Test 3: Tracker query
    res_track = client.post("/api/voice/command", json={"transcript": "track what happened to my application"})
    assert res_track.status_code == 200
    assert "application" in res_track.json()["data"]["speech_announcement"].lower()


def test_langgraph_smart_apply_safeguards():
    """Verify LangGraph Smart Apply halts without explicit human confirmation."""
    out_unconfirmed = smart_apply_graph.invoke({
        "html": "<form><input id='name' name='full_name'></form>",
        "user_confirmed": False,
        "company": "CogniCorp Technologies",
        "position": "Junior Data Analyst"
    })
    assert out_unconfirmed["is_ready_for_submission"] is False
    assert out_unconfirmed["submission_status"] == "WAITING_FOR_USER_CONFIRMATION"

    out_confirmed = smart_apply_graph.invoke({
        "html": "<form><input id='name' name='full_name'></form>",
        "user_confirmed": True,
        "company": "CogniCorp Technologies",
        "position": "Junior Data Analyst"
    })
    assert out_confirmed["is_ready_for_submission"] is True
    assert out_confirmed["submission_status"] == "SUCCESSFULLY_SUBMITTED"


def test_langgraph_interview_prep_and_evaluation():
    """Verify LangGraph interview preparation and evaluation workflow."""
    eval_out = interview_prep_graph.invoke({
        "role": "Junior Data Analyst",
        "question": "How do you use SQL and Python?",
        "user_answer": "I use Python and pandas to transform data and write SQL queries for reporting pipelines."
    })
    assert "feedback_text" in eval_out
    assert eval_out["evaluation"]["score"] >= 40


def test_profile_completeness_calculation():
    """Verify profile completeness is 0% when empty and strictly calculated."""
    empty_comp = calculate_profile_completeness({})
    assert empty_comp["score"] == 0
    assert empty_comp["completed_count"] == 0
    assert len(empty_comp["missing_items"]) == empty_comp["total_count"]

    partial_comp = calculate_profile_completeness({
        "name": "Priya Sharma",
        "email": "priya@example.com",
        "education": [{"degree": "B.Tech", "institution": "PICT"}]
    })
    assert partial_comp["score"] > 0
    assert partial_comp["completed_count"] == 3
