import pytest
from app.services.vision import calculate_ear, BlinkDetector, check_camera_availability
from app.services.voice import parse_voice_command


def test_ear_and_blink_detection():
    # EAR calculation
    open_landmarks = [(0.0, 0.0), (1.0, 1.0), (2.0, 1.0), (3.0, 0.0), (2.0, -1.0), (1.0, -1.0)]
    ear_val = calculate_ear(open_landmarks)
    assert ear_val > 0.40

    detector = BlinkDetector(ear_threshold=0.21, short_blink_frames=2)
    # Simulate single blink
    detector.process_ear(0.10, current_time=1.0)
    detector.process_ear(0.10, current_time=1.05)
    detector.process_ear(0.35, current_time=1.10)
    event = detector.process_ear(0.35, current_time=1.80)
    assert event is not None
    assert event["event"] == "BLINK_SELECT"


def test_camera_hardware_check():
    cam_info = check_camera_availability()
    assert isinstance(cam_info, dict)
    assert "available" in cam_info
    assert "reason" in cam_info


def test_voice_command_parsing():
    # STOP command
    stop_cmd = parse_voice_command("Please stop right now")
    assert stop_cmd["intent"] == "STOP"
    assert stop_cmd["immediate_stop"] is True

    # Read page
    read_cmd = parse_voice_command("Read this page")
    assert read_cmd["intent"] == "READ_PAGE"

    # Fill safe fields
    fill_cmd = parse_voice_command("Fill safe fields")
    assert fill_cmd["intent"] == "FILL_SAFE_FIELDS"

    # Explain job
    job_cmd = parse_voice_command("Explain this job")
    assert job_cmd["intent"] == "EXPLAIN_JOB"
