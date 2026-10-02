import time
import math
import logging
from typing import Dict, Any, List, Optional, Tuple
import numpy as np

logger = logging.getLogger("app.vision")

# Eye landmark indices standard for MediaPipe 468-point mesh
LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144]
RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380]


def calculate_ear(eye_landmarks: List[Tuple[float, float]]) -> float:
    """
    Calculate Eye Aspect Ratio (EAR) given 6 (x, y) landmark points.
    Formula: EAR = (|p2 - p6| + |p3 - p5|) / (2 * |p1 - p4|)
    """
    if len(eye_landmarks) < 6:
        return 0.30

    def dist(p1, p2):
        return math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)

    p1, p2, p3, p4, p5, p6 = eye_landmarks[:6]
    vertical_1 = dist(p2, p6)
    vertical_2 = dist(p3, p5)
    horizontal = dist(p1, p4)

    if horizontal == 0:
        return 0.0

    ear = (vertical_1 + vertical_2) / (2.0 * horizontal)
    return float(ear)


class BlinkDetector:
    def __init__(
        self,
        ear_threshold: float = 0.21,
        short_blink_frames: int = 2,
        long_blink_frames: int = 15,
        double_blink_window_sec: float = 0.6
    ):
        self.ear_threshold = ear_threshold
        self.short_blink_frames = short_blink_frames
        self.long_blink_frames = long_blink_frames
        self.double_blink_window_sec = double_blink_window_sec

        self.closed_frame_count = 0
        self.last_blink_time = 0.0
        self.pending_single_blink = False

    def process_ear(self, ear: float, current_time: Optional[float] = None) -> Optional[Dict[str, Any]]:
        """
        Process a single EAR measurement through the blink state machine.
        Returns an event dict if a blink gesture was confirmed, else None.
        """
        if current_time is None:
            current_time = time.time()

        event = None

        if ear < self.ear_threshold:
            self.closed_frame_count += 1
            # Check for long blink while eyes held shut
            if self.closed_frame_count == self.long_blink_frames:
                self.closed_frame_count = 0
                self.pending_single_blink = False
                return {
                    "event": "LONG_BLINK_CONFIRM",
                    "action": "confirm",
                    "ear": round(ear, 3),
                    "timestamp": current_time,
                    "description": "Long blink detected. Confirming action."
                }
        else:
            # Eyes just opened
            if self.closed_frame_count >= self.short_blink_frames:
                if self.pending_single_blink and (current_time - self.last_blink_time <= self.double_blink_window_sec):
                    # Double blink confirmed
                    self.pending_single_blink = False
                    event = {
                        "event": "DOUBLE_BLINK_CLICK",
                        "action": "click",
                        "ear": round(ear, 3),
                        "timestamp": current_time,
                        "description": "Double blink detected. Executing click."
                    }
                else:
                    self.pending_single_blink = True
                    self.last_blink_time = current_time

            self.closed_frame_count = 0

            # Expire pending single blink if window passed
            if self.pending_single_blink and (current_time - self.last_blink_time > self.double_blink_window_sec):
                self.pending_single_blink = False
                event = {
                    "event": "BLINK_SELECT",
                    "action": "select",
                    "ear": round(ear, 3),
                    "timestamp": current_time,
                    "description": "Single blink detected. Selecting item."
                }

        return event


def check_camera_availability() -> Dict[str, Any]:
    """Test physical webcam access safely without hanging or crashing."""
    try:
        import cv2
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            cap.release()
            return {
                "available": False,
                "reason": "Webcam device 0 cannot be opened (no hardware attached or permission denied)."
            }
        ret, frame = cap.read()
        cap.release()
        if ret and frame is not None:
            return {
                "available": True,
                "frame_shape": list(frame.shape),
                "reason": "Camera initialized successfully."
            }
        else:
            return {
                "available": False,
                "reason": "Camera opened but failed to capture frame."
            }
    except Exception as e:
        return {
            "available": False,
            "reason": str(e)
        }


class HeadGestureDetector:
    """
    Robust head gesture detector with temporal smoothing, confidence thresholding,
    debouncing, and cooldown periods.
    """
    def __init__(
        self,
        pitch_nod_threshold: float = 12.0,
        yaw_shake_threshold: float = 14.0,
        yaw_turn_threshold: float = 18.0,
        cooldown_sec: float = 0.8,
        double_nod_window_sec: float = 1.0
    ):
        self.pitch_nod_threshold = pitch_nod_threshold
        self.yaw_shake_threshold = yaw_shake_threshold
        self.yaw_turn_threshold = yaw_turn_threshold
        self.cooldown_sec = cooldown_sec
        self.double_nod_window_sec = double_nod_window_sec

        self.last_command_time = 0.0
        self.last_nod_time = 0.0
        self.pitch_history: List[float] = []
        self.yaw_history: List[float] = []

    def process_angles(
        self,
        pitch: float,
        yaw: float,
        roll: float = 0.0,
        current_time: Optional[float] = None
    ) -> Optional[Dict[str, Any]]:
        if current_time is None:
            current_time = time.time()

        # Update smoothing buffers (last 6 frames)
        self.pitch_history.append(pitch)
        self.yaw_history.append(yaw)
        if len(self.pitch_history) > 6:
            self.pitch_history.pop(0)
        if len(self.yaw_history) > 6:
            self.yaw_history.pop(0)

        smoothed_pitch = sum(self.pitch_history) / len(self.pitch_history)
        smoothed_yaw = sum(self.yaw_history) / len(self.yaw_history)

        # Enforce cooldown period to avoid duplicate triggering
        if current_time - self.last_command_time < self.cooldown_sec:
            return None

        # 1. DOUBLE NOD / SINGLE NOD (Pitch down and return)
        if smoothed_pitch > self.pitch_nod_threshold:
            # Check for double nod
            if self.last_nod_time > 0.0 and (current_time - self.last_nod_time <= self.double_nod_window_sec):
                self.last_nod_time = 0.0
                self.last_command_time = current_time
                self.pitch_history.clear()
                self.yaw_history.clear()
                return {
                    "gesture": "DOUBLE_NOD",
                    "command": "CONFIRM",
                    "confidence": min(0.98, round(smoothed_pitch / (self.pitch_nod_threshold * 1.5), 2)),
                    "timestamp": current_time,
                    "description": "Double nod detected. Executing explicit confirmation."
                }
            else:
                self.last_nod_time = current_time
                self.last_command_time = current_time
                self.pitch_history.clear()
                self.yaw_history.clear()
                return {
                    "gesture": "HEAD_NOD",
                    "command": "YES",
                    "confidence": min(0.95, round(smoothed_pitch / (self.pitch_nod_threshold * 1.3), 2)),
                    "timestamp": current_time,
                    "description": "Head nod detected. Agree/Yes selected."
                }

        # 2. TURN LEFT / TURN RIGHT (Sustained Yaw)
        if smoothed_yaw < -self.yaw_turn_threshold:
            self.last_command_time = current_time
            self.yaw_history.clear()
            return {
                "gesture": "TURN_LEFT",
                "command": "PREVIOUS",
                "confidence": min(0.95, round(abs(smoothed_yaw) / (self.yaw_turn_threshold * 1.3), 2)),
                "timestamp": current_time,
                "description": "Head turned left. Navigating to previous."
            }
        elif smoothed_yaw > self.yaw_turn_threshold:
            self.last_command_time = current_time
            self.yaw_history.clear()
            return {
                "gesture": "TURN_RIGHT",
                "command": "NEXT",
                "confidence": min(0.95, round(smoothed_yaw / (self.yaw_turn_threshold * 1.3), 2)),
                "timestamp": current_time,
                "description": "Head turned right. Navigating to next."
            }

        # 3. HEAD SHAKE (Oscillation in yaw)
        if len(self.yaw_history) >= 4:
            yaw_diff = max(self.yaw_history) - min(self.yaw_history)
            if yaw_diff > (self.yaw_shake_threshold * 1.5):
                self.last_command_time = current_time
                self.yaw_history.clear()
                return {
                    "gesture": "HEAD_SHAKE",
                    "command": "NO",
                    "confidence": min(0.94, round(yaw_diff / (self.yaw_shake_threshold * 2.0), 2)),
                    "timestamp": current_time,
                    "description": "Head shake detected. Deny/No selected."
                }

        return None


class HandGestureDetector:
    """
    MediaPipe 21-landmark hand gesture recognizer.
    Supports: THUMBS_UP, THUMBS_DOWN, OPEN_PALM (STOP), FIST, ONE_FINGER, TWO_FINGERS, WAVE, PINCH.
    """
    def __init__(self, cooldown_sec: float = 0.8):
        self.cooldown_sec = cooldown_sec
        self.last_command_time = 0.0
        self.wrist_history_x: List[float] = []

    def process_landmarks(
        self,
        landmarks: List[Dict[str, float]],
        current_time: Optional[float] = None
    ) -> Optional[Dict[str, Any]]:
        """
        landmarks: List of 21 dicts with keys 'x', 'y', and optionally 'z'
        """
        if current_time is None:
            current_time = time.time()

        if len(landmarks) < 21:
            return None

        wrist = landmarks[0]
        self.wrist_history_x.append(wrist.get("x", 0.5))
        if len(self.wrist_history_x) > 8:
            self.wrist_history_x.pop(0)

        if current_time - self.last_command_time < self.cooldown_sec:
            return None

        # Key finger tips & PIP joints
        thumb_tip = landmarks[4]
        thumb_ip = landmarks[3]
        thumb_mcp = landmarks[2]

        index_tip = landmarks[8]
        index_pip = landmarks[6]

        middle_tip = landmarks[12]
        middle_pip = landmarks[10]

        ring_tip = landmarks[16]
        ring_pip = landmarks[14]

        pinky_tip = landmarks[20]
        pinky_pip = landmarks[18]

        # Finger extended flags (in image coordinates, y is 0 at top, so smaller y is higher)
        index_ext = index_tip["y"] < index_pip["y"] - 0.03
        middle_ext = middle_tip["y"] < middle_pip["y"] - 0.03
        ring_ext = ring_tip["y"] < ring_pip["y"] - 0.03
        pinky_ext = pinky_tip["y"] < pinky_pip["y"] - 0.03
        thumb_up = thumb_tip["y"] < thumb_ip["y"] - 0.04
        thumb_down = thumb_tip["y"] > thumb_ip["y"] + 0.05

        def dist(p1, p2):
            return math.sqrt((p1["x"] - p2["x"])**2 + (p1["y"] - p2["y"])**2)

        pinch_dist = dist(thumb_tip, index_tip)

        event = None

        # 1. PINCH: thumb tip close to index tip, other fingers not closed
        if pinch_dist < 0.06 and not (middle_ext and ring_ext and pinky_ext):
            event = {
                "gesture": "PINCH",
                "command": "SELECT",
                "confidence": 0.90,
                "description": "Pinch detected. Item selected."
            }

        # 2. OPEN PALM (STOP): All 5 fingers extended
        elif index_ext and middle_ext and ring_ext and pinky_ext and (thumb_up or dist(thumb_tip, index_tip) > 0.15):
            # Check wave motion
            if len(self.wrist_history_x) >= 6:
                diff_x = max(self.wrist_history_x) - min(self.wrist_history_x)
                if diff_x > 0.12:
                    event = {
                        "gesture": "WAVE",
                        "command": "HELP",
                        "confidence": 0.88,
                        "description": "Hand wave detected. Opening assistant / help."
                    }
            if not event:
                event = {
                    "gesture": "OPEN_PALM",
                    "command": "STOP",
                    "confidence": 0.96,
                    "description": "Open palm detected. STOP current reading and action immediately."
                }

        # 3. FIST: All 4 fingers curled down
        elif not index_ext and not middle_ext and not ring_ext and not pinky_ext and not thumb_up and not thumb_down:
            event = {
                "gesture": "FIST",
                "command": "CONFIRM",
                "confidence": 0.92,
                "description": "Fist detected. Confirming action."
            }

        # 4. THUMBS UP: Thumb clearly pointed up, fingers curled
        elif thumb_up and not index_ext and not middle_ext and not ring_ext and not pinky_ext:
            event = {
                "gesture": "THUMBS_UP",
                "command": "YES",
                "confidence": 0.94,
                "description": "Thumbs up detected. Agree/Yes approved."
            }

        # 5. THUMBS DOWN: Thumb clearly pointed down, fingers curled
        elif thumb_down and not index_ext and not middle_ext and not ring_ext and not pinky_ext:
            event = {
                "gesture": "THUMBS_DOWN",
                "command": "NO",
                "confidence": 0.94,
                "description": "Thumbs down detected. No / Deny / Cancel."
            }

        # 6. ONE FINGER (Index extended): NEXT
        elif index_ext and not middle_ext and not ring_ext and not pinky_ext:
            event = {
                "gesture": "ONE_FINGER",
                "command": "NEXT",
                "confidence": 0.92,
                "description": "One finger detected. Moving to next."
            }

        # 7. TWO FINGERS (Index and middle extended): PREVIOUS
        elif index_ext and middle_ext and not ring_ext and not pinky_ext:
            event = {
                "gesture": "TWO_FINGERS",
                "command": "PREVIOUS",
                "confidence": 0.92,
                "description": "Two fingers detected. Moving to previous."
            }

        if event:
            self.last_command_time = current_time
            event["timestamp"] = current_time

        return event


class GestureCommandManager:
    """
    Decoupled Command Layer:
    MediaPipe -> Gesture Recognition -> Command -> Command Manager -> Application Action
    Strict separation:
    - OPEN_PALM -> STOP (Stops reading/TTS immediately)
    - THUMBS_DOWN -> CANCEL (Cancels application/modal)
    """
    ACTION_MAP = {
        "YES": {
            "action": "APPROVE_APPLICATION",
            "speech_announcement": "Yes approved. Proceeding with application.",
            "ui_event": "confirm_yes"
        },
        "NO": {
            "action": "CANCEL_APPLICATION",
            "speech_announcement": "No selected. Canceling application flow.",
            "ui_event": "confirm_no"
        },
        "STOP": {
            "action": "STOP_TTS",
            "speech_announcement": "Stopped.",
            "ui_event": "stop_all"
        },
        "CONFIRM": {
            "action": "SUBMIT_APPLICATION",
            "speech_announcement": "Application confirmed. Submitting.",
            "ui_event": "confirm_submit"
        },
        "NEXT": {
            "action": "NEXT_JOB",
            "speech_announcement": "Next job.",
            "ui_event": "navigate_next"
        },
        "PREVIOUS": {
            "action": "PREVIOUS_JOB",
            "speech_announcement": "Previous job.",
            "ui_event": "navigate_prev"
        },
        "HELP": {
            "action": "OPEN_ASSISTANT",
            "speech_announcement": "Opening Saarthi assistant.",
            "ui_event": "open_assistant"
        },
        "SELECT": {
            "action": "SELECT_ITEM",
            "speech_announcement": "Item selected.",
            "ui_event": "select_current"
        }
    }

    def route_command(self, command: str, gesture_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        cmd_upper = command.upper()
        mapping = self.ACTION_MAP.get(cmd_upper, {
            "action": "UNKNOWN_ACTION",
            "speech_announcement": f"Recognized {command}",
            "ui_event": "noop"
        })
        return {
            "command": cmd_upper,
            "action": mapping["action"],
            "speech_announcement": mapping["speech_announcement"],
            "ui_event": mapping["ui_event"],
            "gesture_source": gesture_data or {}
        }


head_gesture_detector = HeadGestureDetector()
hand_gesture_detector = HandGestureDetector()
gesture_command_manager = GestureCommandManager()

