import os
import socket
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


def is_port_available(port: int, host: str = "127.0.0.1") -> bool:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.5)
            s.bind((host, port))
            return True
    except OSError:
        return False


def get_default_port(preferred: int = 8000, host: str = "127.0.0.1") -> int:
    env_port = os.getenv("PORT")
    if env_port:
        try:
            return int(env_port)
        except ValueError:
            pass
    if is_port_available(preferred, host):
        return preferred
    for fallback in [8000, 8765, 9000, 8080]:
        if is_port_available(fallback, host):
            return fallback
    return preferred


class Settings(BaseSettings):
    app_name: str = "Accessible Job Application Assistant"
    app_version: str = "0.1.0"

    host: str = "127.0.0.1"
    port: int = get_default_port(8000)

    openrouter_api_key: str = ""
    openrouter_model: str = "qwen/qwen3.8-27b:free"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    # Faster-Whisper CPU Speech-to-Text configuration
    whisper_model_size: str = "tiny.en"
    whisper_device: str = "cpu"
    whisper_compute_type: str = "int8"
    whisper_language: str = "en"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()