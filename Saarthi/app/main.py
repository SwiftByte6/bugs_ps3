import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.llm.client import LLMClient
from app.routes.profile import router as profile_router
from app.routes.resume import router as resume_router
from app.routes.jobs import router as jobs_router
from app.routes.rag import router as rag_router
from app.routes.dom import router as dom_router
from app.routes.vision import router as vision_router
from app.routes.voice import router as voice_router
from app.routes.tracker import router as tracker_router
from app.routes.interview import router as interview_router
from app.services.rag import static_rag

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("app.main")

static_dir = Path("app/static")
llm_client = LLMClient()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"OpenRouter Primary Model: {settings.openrouter_model}")
    try:
        count = static_rag.build_index()
        logger.info(f"Initialized Static RAG index with {count} chunks.")
    except Exception as e:
        logger.warning(f"Could not build static RAG index at startup: {e}")
    yield


app = FastAPI(
    title=settings.app_name,
    description=(
        "AI-powered accessible job application assistant "
        "for candidates with disabilities."
    ),
    version=settings.app_version,
    lifespan=lifespan,
)

# Enable CORS for Chrome Extension and local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Assets
static_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# Include Routers
app.include_router(profile_router)
app.include_router(resume_router)
app.include_router(jobs_router)
app.include_router(rag_router)
app.include_router(dom_router)
app.include_router(vision_router)
app.include_router(voice_router)
app.include_router(tracker_router)
app.include_router(interview_router)


@app.get("/")
def root():
    index_file = static_dir / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {
        "message": settings.app_name,
        "status": "running",
        "docs_url": "/docs"
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
        "openrouter_configured": bool(settings.openrouter_api_key),
        "model": settings.openrouter_model,
        "primary_model_verified": settings.openrouter_model == "qwen/qwen3.8-27b:free"
    }


@app.get("/api/ai/test")
async def ai_test():
    """Verify OpenRouter connection using the primary Qwen model."""
    conn_info = await llm_client.test_connection()
    response = await llm_client.generate(
        "Explain what an accessible job application assistant is "
        "in exactly two sentences."
    )
    return {
        "model": settings.openrouter_model,
        "connection_test": conn_info,
        "response": response,
        "using_fallback": bool(llm_client.last_error),
        "last_error": llm_client.last_error
    }