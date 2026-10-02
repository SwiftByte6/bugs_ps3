from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
from typing import Dict, Any
from app.services.resume import process_resume
from app.services.profile import user_profile_service
from app.llm.client import LLMClient

router = APIRouter(prefix="/api/resume", tags=["Resume"])
llm_client = LLMClient()


@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded PDF file is empty.")
        profile = await process_resume(content, llm_client=llm_client)
        user_profile_service.update_resume_profile(profile)
        return {
            "status": "success",
            "message": "Resume successfully processed and extracted.",
            "profile": profile
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process resume: {str(e)}")


@router.get("/demo")
async def load_demo_resume():
    demo_path = Path("data/demo/sample_resume.pdf")
    if not demo_path.exists():
        raise HTTPException(status_code=404, detail="Demo resume not found.")
    profile = await process_resume(str(demo_path), llm_client=llm_client)
    user_profile_service.update_resume_profile(profile)
    return {
        "status": "success",
        "source": "data/demo/sample_resume.pdf",
        "profile": profile
    }
