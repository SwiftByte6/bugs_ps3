from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Tuple, Dict, Any
from app.services.vision import (
    check_camera_availability,
    calculate_ear,
    BlinkDetector,
    head_gesture_detector,
    hand_gesture_detector,
    gesture_command_manager
)

router = APIRouter(prefix="/api/vision", tags=["Vision & Eye Control"])
blink_detector = BlinkDetector()


class EARRequest(BaseModel):
    ear: float
    timestamp: Optional[float] = None


class LandmarkEARRequest(BaseModel):
    landmarks: List[Tuple[float, float]]


class HeadPoseRequest(BaseModel):
    pitch: float
    yaw: float
    roll: Optional[float] = 0.0
    timestamp: Optional[float] = None


class HandLandmarksRequest(BaseModel):
    landmarks: List[Dict[str, float]]
    timestamp: Optional[float] = None


class DirectCommandRequest(BaseModel):
    command: str  # YES, NO, STOP, CONFIRM, NEXT, PREVIOUS, HELP, SELECT
    context: Optional[str] = ""


@router.get("/status")
def get_camera_status():
    status = check_camera_availability()
    return {
        "status": "success",
        "camera": status,
        "privacy_notice": (
            "Local Vision Processing Active. Camera streams are NEVER transmitted, "
            "recorded, or stored on servers. Only interaction events (e.g. nods, hands, blinks) are recognized. "
            "Note: MediaPipe is used strictly as an interaction control mechanism, not for disability diagnosis or sign language translation."
        )
    }


@router.post("/process-ear")
def process_ear_event(req: EARRequest):
    event = blink_detector.process_ear(req.ear, req.timestamp)
    return {
        "status": "success",
        "ear": req.ear,
        "event_detected": event is not None,
        "event": event
    }


@router.post("/calculate-ear")
def compute_ear_from_landmarks(req: LandmarkEARRequest):
    ear_val = calculate_ear(req.landmarks)
    event = blink_detector.process_ear(ear_val)
    return {
        "status": "success",
        "ear": round(ear_val, 4),
        "event": event
    }


@router.post("/head-gesture")
def process_head_pose(req: HeadPoseRequest):
    """
    Process head pitch & yaw angles through smoothing and debounce to recognize head gestures:
    HEAD_NOD (YES), HEAD_SHAKE (NO), TURN_LEFT (PREVIOUS), TURN_RIGHT (NEXT), DOUBLE_NOD (CONFIRM).
    """
    gesture_event = head_gesture_detector.process_angles(
        pitch=req.pitch,
        yaw=req.yaw,
        roll=req.roll or 0.0,
        current_time=req.timestamp
    )

    if gesture_event:
        routed = gesture_command_manager.route_command(gesture_event["command"], gesture_event)
        return {
            "status": "success",
            "gesture_detected": True,
            "gesture": gesture_event,
            "command_route": routed
        }

    return {
        "status": "success",
        "gesture_detected": False,
        "gesture": None
    }


@router.post("/hand-gesture")
def process_hand_landmarks(req: HandLandmarksRequest):
    """
    Process MediaPipe 21 hand landmarks to recognize:
    THUMBS_UP (YES), THUMBS_DOWN (NO/CANCEL), OPEN_PALM (STOP), FIST (CONFIRM),
    ONE_FINGER (NEXT), TWO_FINGERS (PREVIOUS), WAVE (HELP), PINCH (SELECT).
    """
    gesture_event = hand_gesture_detector.process_landmarks(
        landmarks=req.landmarks,
        current_time=req.timestamp
    )

    if gesture_event:
        routed = gesture_command_manager.route_command(gesture_event["command"], gesture_event)
        return {
            "status": "success",
            "gesture_detected": True,
            "gesture": gesture_event,
            "command_route": routed
        }

    return {
        "status": "success",
        "gesture_detected": False,
        "gesture": None
    }


@router.post("/command")
def execute_direct_command(req: DirectCommandRequest):
    """
    Directly execute or test a command through the Command Layer.
    Ensures decoupled architecture: MediaPipe -> Recognition -> Command -> Action.
    """
    routed = gesture_command_manager.route_command(req.command, {"source": "direct_api", "context": req.context})
    return {
        "status": "success",
        "command_route": routed
    }

