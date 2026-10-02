import pytest
from app.config import settings
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def test_config_model_is_qwen():
    assert settings.openrouter_model == "qwen/qwen3.8-27b:free", (
        f"Expected model qwen/qwen3.8-27b:free but found {settings.openrouter_model}"
    )


def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["model"] == "qwen/qwen3.8-27b:free"
    assert data["primary_model_verified"] is True


def test_root_serves_html():
    res = client.get("/")
    assert res.status_code == 200
    assert "Saarthi" in res.text or res.headers.get("content-type", "").startswith("text/html")
