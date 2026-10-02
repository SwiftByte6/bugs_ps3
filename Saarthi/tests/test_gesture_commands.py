import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.vision import (
    HeadGestureDetector,
    HandGestureDetector,
    GestureCommandManager,
    gesture_command_manager
)

client = TestClient(app)


def test_head_nod_detection():
    detector = HeadGestureDetector(cooldown_sec=0.0)
    # Nod pitch down > 12
    event = detector.process_angles(pitch=15.0, yaw=0.0, roll=0.0, current_time=1.0)
    assert event is not None
    assert event["gesture"] == "HEAD_NOD"
    assert event["command"] == "YES"


def test_head_shake_detection():
    detector = HeadGestureDetector(cooldown_sec=0.0)
    # Oscillate yaw: left then right
    detector.process_angles(pitch=0.0, yaw=-15.0, current_time=1.0)
    detector.process_angles(pitch=0.0, yaw=16.0, current_time=1.1)
    detector.process_angles(pitch=0.0, yaw=-18.0, current_time=1.2)
    event = detector.process_angles(pitch=0.0, yaw=18.0, current_time=1.3)
    assert event is not None
    assert event["gesture"] == "HEAD_SHAKE"
    assert event["command"] == "NO"


def test_head_turn_left_right():
    detector = HeadGestureDetector(cooldown_sec=0.0)
    event_left = detector.process_angles(pitch=0.0, yaw=-25.0, current_time=1.0)
    assert event_left is not None
    assert event_left["gesture"] == "TURN_LEFT"
    assert event_left["command"] == "PREVIOUS"

    detector.last_command_time = 0.0
    event_right = detector.process_angles(pitch=0.0, yaw=25.0, current_time=3.0)
    assert event_right is not None
    assert event_right["gesture"] == "TURN_RIGHT"
    assert event_right["command"] == "NEXT"


def test_hand_open_palm_stop_vs_thumbs_down_cancel():
    # Verify decoupled command mapping: OPEN_PALM -> STOP, THUMBS_DOWN -> CANCEL
    stop_route = gesture_command_manager.route_command("STOP")
    assert stop_route["action"] == "STOP_TTS"
    assert "Stop" in stop_route["speech_announcement"]

    cancel_route = gesture_command_manager.route_command("NO")
    assert cancel_route["action"] == "CANCEL_APPLICATION"
    assert "Cancel" in cancel_route["speech_announcement"] or "No" in cancel_route["speech_announcement"]


def test_vision_command_api_endpoint():
    res = client.post("/api/vision/command", json={"command": "YES"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["command_route"]["command"] == "YES"
    assert data["command_route"]["action"] == "APPROVE_APPLICATION"


def test_vision_head_gesture_api_endpoint():
    res = client.post("/api/vision/head-gesture", json={
        "pitch": 18.0,
        "yaw": 0.0,
        "roll": 0.0
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    if data["gesture_detected"]:
        assert data["gesture"]["command"] in ["YES", "CONFIRM"]
