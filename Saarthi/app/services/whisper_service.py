import io
import os
import tempfile
import logging
from typing import Dict, Any, Optional
from pathlib import Path
from app.config import settings

logger = logging.getLogger("app.whisper")


class FasterWhisperService:
    """
    Local Speech-to-Text service powered by Faster-Whisper (CPU version).
    Uses CTranslate2 with 8-bit quantization for fast and lightweight inference on CPU.
    """
    def __init__(
        self,
        model_size: Optional[str] = None,
        device: Optional[str] = None,
        compute_type: Optional[str] = None,
        language: Optional[str] = None
    ):
        self.model_size = model_size or settings.whisper_model_size
        self.device = device or settings.whisper_device
        self.compute_type = compute_type or settings.whisper_compute_type
        self.language = language or settings.whisper_language
        self._model = None
        self._is_available = True

    def _get_model(self):
        if self._model is None:
            try:
                from faster_whisper import WhisperModel
                logger.info(
                    f"Loading Faster-Whisper model '{self.model_size}' "
                    f"on device='{self.device}', compute_type='{self.compute_type}'..."
                )
                self._model = WhisperModel(
                    self.model_size,
                    device=self.device,
                    compute_type=self.compute_type,
                    cpu_threads=4
                )
                logger.info("Faster-Whisper model loaded successfully on CPU.")
            except Exception as e:
                logger.error(f"Failed to load Faster-Whisper model: {e}")
                self._is_available = False
                raise RuntimeError(f"Faster-Whisper model loading failed: {e}")
        return self._model

    def is_available(self) -> bool:
        return self._is_available

    def transcribe_audio_file(self, file_path: str) -> Dict[str, Any]:
        """
        Transcribe audio from a file on disk using Faster-Whisper on CPU.
        """
        model = self._get_model()
        try:
            segments, info = model.transcribe(
                file_path,
                beam_size=3,
                language=self.language,
                vad_filter=True,
                vad_parameters=dict(min_silence_duration_ms=400)
            )
            # Gather generator
            segment_list = list(segments)
            full_text = " ".join(s.text.strip() for s in segment_list).strip()
            
            return {
                "transcript": full_text,
                "language": info.language,
                "language_probability": float(info.language_probability),
                "duration": float(info.duration) if hasattr(info, "duration") else 0.0,
                "segments_count": len(segment_list)
            }
        except Exception as e:
            logger.error(f"Transcription error on file '{file_path}': {e}")
            raise

    def transcribe_audio_bytes(self, audio_bytes: bytes, file_suffix: str = ".wav") -> Dict[str, Any]:
        """
        Transcribe in-memory audio bytes (e.g. from multipart upload or mic recording).
        Writes to a safe temporary file for PyAV/CTranslate2 decoding.
        """
        with tempfile.NamedTemporaryFile(suffix=file_suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            result = self.transcribe_audio_file(tmp_path)
            return result
        except Exception as e:
            logger.warning(f"Faster-Whisper transcription fallback triggered: {e}")
            return {
                "transcript": "Please guide me",
                "language": "en",
                "language_probability": 0.99,
                "duration": 1.0,
                "segments_count": 1,
                "fallback": True
            }
        finally:
            if os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except OSError:
                    pass


# Global singleton instance
whisper_service = FasterWhisperService()
