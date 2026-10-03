import json
import logging
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from app.services.jobs import (
    parse_job_description,
    simplify_job_description,
    explain_term,
    simplify_application_question,
    job_search_agent,
    handle_career_assistant_query
)
from app.services.matcher import job_matcher
from app.services.profile import user_profile_service
from app.llm.client import LLMClient

logger = logging.getLogger("app.jobs.ingestion")
router = APIRouter(prefix="/api/jobs", tags=["Jobs"])
llm_client = LLMClient()


class ExtensionJobItem(BaseModel):
    job_id: Optional[str] = Field(default="", alias="id")
    title: str = ""
    company: str = ""
    location: Optional[str] = ""
    employment_type: Optional[str] = Field(default="", alias="employmentType")
    experience: Optional[str] = ""
    skills: List[str] = Field(default_factory=list)
    description: Optional[str] = ""
    job_url: Optional[str] = Field(default="", alias="url")
    source: Optional[str] = "test_job_portal"
    scraped_at: Optional[str] = ""

    class Config:
        populate_by_name = True
        extra = "allow"


class ExtensionIngestRequest(BaseModel):
    source: Optional[str] = Field(default="test_job_portal", alias="portal")
    page_url: Optional[str] = Field(default="", alias="url")
    jobs: List[ExtensionJobItem] = Field(default_factory=list)

    class Config:
        populate_by_name = True
        extra = "allow"


class JobTextRequest(BaseModel):
    text: str


class ExplainTermRequest(BaseModel):
    term: str
    context: Optional[str] = ""


class SimplifyQuestionRequest(BaseModel):
    question: str


class JobSearchRequest(BaseModel):
    query: Optional[str] = ""
    preferred_work_mode: Optional[str] = None


class CareerQueryRequest(BaseModel):
    query: str
    job_id: Optional[str] = None
    job_context: Optional[Dict[str, Any]] = None


class MatchJobRequest(BaseModel):
    job: Optional[Dict[str, Any]] = None
    job_text: Optional[str] = None


@router.post("/parse")
def parse_job(req: JobTextRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Job description text cannot be empty.")
    return {
        "status": "success",
        "parsed_job": parse_job_description(req.text)
    }


@router.post("/simplify")
async def simplify_job(req: JobTextRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Job description text cannot be empty.")
    result = await simplify_job_description(req.text, llm_client=llm_client)
    return {
        "status": "success",
        "data": result
    }


@router.post("/explain-term")
async def explain_job_term(req: ExplainTermRequest):
    result = await explain_term(req.term, req.context or "", llm_client=llm_client)
    return {
        "status": "success",
        "data": result
    }


@router.post("/simplify-question")
async def simplify_app_question(req: SimplifyQuestionRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    result = await simplify_application_question(req.question, llm_client=llm_client)
    return {
        "status": "success",
        "data": result
    }


@router.post("/search")
def search_jobs(req: JobSearchRequest):
    profile_data = user_profile_service.get_data().get("resume_profile", {})
    user_skills = profile_data.get("skills", {}).get("all_skills", []) if isinstance(profile_data.get("skills"), dict) else []
    results = job_search_agent.search(
        query=req.query or "",
        user_skills=user_skills,
        preferred_work_mode=req.preferred_work_mode
    )
    return {
        "status": "success",
        "data": results
    }


@router.get("/catalog")
def get_jobs_catalog():
    return {
        "status": "success",
        "jobs": job_search_agent.get_catalog()
    }


@router.post("/assistant-query")
async def query_career_assistant(req: CareerQueryRequest):
    profile_data = user_profile_service.get_data().get("resume_profile", {})
    job_context = req.job_context
    if not job_context and req.job_id:
        catalog = job_search_agent.get_catalog()
        job_context = next((j for j in catalog if j.get("id") == req.job_id), None)
    
    result = await handle_career_assistant_query(
        query=req.query,
        job_context=job_context,
        profile_context=profile_data,
        llm_client=llm_client
    )
    return {
        "status": "success",
        "data": result
    }


@router.post("/match")
def match_job_with_candidate(req: MatchJobRequest):
    profile_data = user_profile_service.get_data().get("resume_profile", {})
    if not profile_data:
        raise HTTPException(status_code=400, detail="No candidate profile found. Please upload or load resume first.")

    job_data = req.job
    if not job_data and req.job_text:
        job_data = parse_job_description(req.job_text)
    elif not job_data:
        # Default to demo job
        demo_file = Path("data/demo/sample_job.json")
        if demo_file.exists():
            job_data = json.loads(demo_file.read_text(encoding="utf-8"))
        else:
            raise HTTPException(status_code=400, detail="No job data provided.")

    match_result = job_matcher.calculate_match(profile_data, job_data)
    return {
        "status": "success",
        "job_title": job_data.get("title", "Position"),
        "company": job_data.get("company", "Company"),
        "match": match_result
    }


@router.get("/demo")
def get_demo_job():
    demo_file = Path("data/demo/sample_job.json")
    demo_txt = Path("data/demo/sample_job_description.txt")
    if not demo_file.exists() or not demo_txt.exists():
        raise HTTPException(status_code=404, detail="Demo job files not found.")
    return {
        "status": "success",
        "job_json": json.loads(demo_file.read_text(encoding="utf-8")),
        "raw_text": demo_txt.read_text(encoding="utf-8")
    }


SCRAPED_JOBS_FILE = Path("data/scraped_jobs.json")

def load_scraped_jobs() -> List[Dict[str, Any]]:
    if SCRAPED_JOBS_FILE.exists():
        try:
            return json.loads(SCRAPED_JOBS_FILE.read_text(encoding="utf-8"))
        except Exception:
            return []
    return []

def save_scraped_jobs(jobs_list: List[Dict[str, Any]]) -> None:
    try:
        SCRAPED_JOBS_FILE.parent.mkdir(parents=True, exist_ok=True)
        SCRAPED_JOBS_FILE.write_text(json.dumps(jobs_list, indent=2), encoding="utf-8")
    except Exception as e:
        logger.error(f"Failed to persist scraped jobs: {e}")

# Storage for scraped jobs from extension (persisted to data/scraped_jobs.json)
SCRAPED_JOBS_STORE: List[Dict[str, Any]] = load_scraped_jobs()


@router.post("/extension-ingest")
def ingest_extension_jobs(req: ExtensionIngestRequest):
    """
    Ingest structured jobs scraped by the Saarthi Chrome Extension.
    Performs validation, structured logging, and returns confirmation.
    """
    received_count = len(req.jobs)
    
    # Structured console logging matching specification
    log_lines = [
        "\n[Saarthi Job Ingestion]",
        f"Source: {req.source}",
        f"Page URL: {req.page_url}",
        f"Jobs received: {received_count}"
    ]
    for idx, job in enumerate(req.jobs, start=1):
        log_lines.append(f"{idx}. {job.title} — {job.company} ({job.job_id})")
    
    logger.info("\n".join(log_lines))
    print("\n".join(log_lines))

    # Update scraped jobs store (avoiding duplicates by job_id/title+company)
    current_jobs = load_scraped_jobs()
    for j in req.jobs:
        job_dict = {
            "id": j.job_id,
            "job_id": j.job_id,
            "title": j.title,
            "company": j.company,
            "location": j.location,
            "work_mode": "Remote" if "remote" in (j.location or "").lower() else "Full-time",
            "type": j.employment_type or "Full-time",
            "employment_type": j.employment_type or "Full-time",
            "experience": j.experience,
            "skills": j.skills,
            "description": j.description,
            "job_url": j.job_url,
            "source": req.source or "test_job_portal",
            "scraped_at": j.scraped_at,
            "match_percentage": 90,
            "matched_skills": j.skills[:3],
            "missing_skills": []
        }
        # Deduplicate
        existing_idx = next((i for i, ej in enumerate(current_jobs) if ej.get("job_id") == j.job_id or (ej.get("title") == j.title and ej.get("company") == j.company)), None)
        if existing_idx is not None:
            current_jobs[existing_idx] = job_dict
        else:
            current_jobs.insert(0, job_dict)

    save_scraped_jobs(current_jobs)
    global SCRAPED_JOBS_STORE
    SCRAPED_JOBS_STORE = current_jobs

    return {
        "status": "success",
        "success": True,
        "source": req.source,
        "page_url": req.page_url,
        "received": received_count,
        "jobs_received": received_count,
        "jobs": [
            {
                "job_id": j.job_id,
                "title": j.title,
                "company": j.company,
                "location": j.location,
                "employment_type": j.employment_type,
                "experience": j.experience,
                "skills": j.skills,
                "job_url": j.job_url
            }
            for j in req.jobs
        ]
    }


@router.get("/scraped")
def get_scraped_jobs():
    """Retrieve recently scraped jobs from the Chrome Extension."""
    jobs = load_scraped_jobs()
    return {
        "status": "success",
        "count": len(jobs),
        "jobs": jobs
    }


