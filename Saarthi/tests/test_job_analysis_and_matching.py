import json
import pytest
from pathlib import Path
from app.services.jobs import parse_job_description, simplify_job_description
from app.services.matcher import job_matcher
from app.llm.client import LLMClient


def test_job_description_parsing():
    jd_path = Path("data/demo/sample_job_description.txt")
    text = jd_path.read_text(encoding="utf-8")
    parsed = parse_job_description(text)

    assert "Data Analyst" in parsed["title"]
    assert "CogniCorp" in parsed["company"]
    assert "Hybrid" in parsed["work_mode"]
    assert "Python" in parsed["required_skills"]
    assert "SQL" in parsed["required_skills"]
    assert "Machine Learning" in parsed["required_skills"]
    assert "Power BI" in parsed["required_skills"]
    assert len(parsed["responsibilities"]) >= 3


import asyncio

def test_job_simplification_sections():
    async def _run():
        jd_path = Path("data/demo/sample_job_description.txt")
        text = jd_path.read_text(encoding="utf-8")
        llm = LLMClient()
        result = await simplify_job_description(text, llm_client=llm)

        assert "title" in result
        assert "simplified_text" in result
        simplified = (result.get("simplified_text") or "").upper()

        if simplified:
            required_sections = [
                "JOB OVERVIEW", "WHAT YOU WILL DO", "REQUIRED SKILLS",
                "EXPERIENCE", "EDUCATION", "WORK MODE", "IMPORTANT REQUIREMENTS"
            ]
            for sec in required_sections:
                assert sec in simplified, f"Section '{sec}' missing in simplified JD output"
    asyncio.run(_run())


def test_semantic_job_matching():
    with open("data/demo/sample_job.json", encoding="utf-8") as f:
        job = json.load(f)

    candidate_profile = {
        "name": "Test User",
        "skills": {
            "all_skills": ["Python", "SQL", "Machine Learning", "Power BI", "FastAPI", "Git"]
        },
        "experience": [{"role": "Data Analyst Intern"}],
        "projects": [{"title": "Data Analytics Dashboard"}],
        "work_mode_preference": "Hybrid"
    }

    match = job_matcher.calculate_match(candidate_profile, job)
    assert 0 <= match["overall_match_score"] <= 100
    assert match["overall_match_score"] >= 75.0, "Expected strong match score > 75%"

    # Check matched vs missing skills
    assert "Python" in match["matched_skills"]
    assert "SQL" in match["matched_skills"]
    assert "Power BI" in match["matched_skills"]
    assert "Tableau" in match["missing_skills"]
    assert "why_this_job_matches" in match
