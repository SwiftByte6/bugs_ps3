import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any

from app.services.voice import parse_voice_command
from app.services.whisper_service import whisper_service
from app.services.agent_graph import voice_command_graph

logger = logging.getLogger("app.voice")
router = APIRouter(prefix="/api/voice", tags=["Voice Navigation & STT"])


class VoiceCommandRequest(BaseModel):
    transcript: str
    current_page: Optional[str] = None
    current_job: Optional[Dict[str, Any]] = None


@router.post("/intent")
def interpret_voice_command(req: VoiceCommandRequest):
    """Legacy/direct rule-based intent parsing (preserved for backward compatibility)."""
    result = parse_voice_command(req.transcript)
    return {
        "status": "success",
        "data": result
    }


@router.post("/transcribe")
async def transcribe_audio_file(file: UploadFile = File(...)):
    """
    Transcribe audio blob captured from browser microphone using local Faster-Whisper (CPU INT8).
    """
    if not file:
        raise HTTPException(status_code=400, detail="No audio file provided.")

    try:
        audio_bytes = await file.read()
        suffix = ".webm" if "webm" in (file.content_type or "") else ".wav"
        result = whisper_service.transcribe_audio_bytes(audio_bytes, file_suffix=suffix)
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        logger.error(f"Faster-Whisper transcription failed: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription error: {str(e)}")


@router.post("/command")
async def process_voice_command(req: VoiceCommandRequest):
    """
    Full LangGraph Voice Command Assistant workflow.
    Takes transcript, passes through LangGraph, executes routing, and produces speech announcement.
    """
    transcript = req.transcript.strip()
    if not transcript:
        raise HTTPException(status_code=400, detail="Transcript cannot be empty.")

    try:
        # Run through LangGraph Voice Command Assistant graph
        graph_input = {
            "transcript": transcript,
            "current_page": req.current_page,
            "current_job": req.current_job
        }
        graph_output = voice_command_graph.invoke(graph_input)

        return {
            "status": "success",
            "data": {
                "transcript": transcript,
                "intent": graph_output.get("intent"),
                "action": graph_output.get("action"),
                "target": graph_output.get("target"),
                "response_text": graph_output.get("response_text"),
                "speech_announcement": graph_output.get("speech_announcement"),
                "immediate_stop": graph_output.get("immediate_stop", False),
                "requires_confirmation": graph_output.get("requires_confirmation", False)
            }
        }
    except Exception as e:
        logger.error(f"LangGraph voice command execution failed: {e}")
        raise HTTPException(status_code=500, detail=f"Voice command error: {str(e)}")
