import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
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

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])
llm_client = LLMClient()


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
