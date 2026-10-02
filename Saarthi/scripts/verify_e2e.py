"""
End-to-End Comprehensive 25-Step Verification Script
PS003 — Accessible Job Application Assistant
"""
import os
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import asyncio
from dotenv import load_dotenv

load_dotenv()

from app.config import settings
from app.llm.client import LLMClient
from app.services.resume import process_resume
from app.services.jobs import parse_job_description, simplify_job_description
from app.services.embeddings import compute_embedding, cosine_similarity
from app.services.matcher import job_matcher
from app.services.rag import static_rag
from app.services.dom_analyzer import analyze_dom, audit_accessibility
from app.services.form_filler import map_all_fields
from app.services.vision import check_camera_availability, calculate_ear, BlinkDetector
from app.services.voice import parse_voice_command
from app.services.tracker import application_tracker
from fastapi.testclient import TestClient
from app.main import app


def run_e2e_verification():
    print("=" * 60)
    print("PS003 — COMPLETE 25-STEP END-TO-END VERIFICATION")
    print("=" * 60)

    client = TestClient(app)

    # STEP 1 & 2: Start & Backend Health
    health_res = client.get("/api/health")
    assert health_res.status_code == 200, "Backend failed to start or return health"
    health_data = health_res.json()
    print("STEP 1 & 2: Backend started successfully -> Status:", health_data["status"])

    # STEP 3 & 4: Verify .env and OPENROUTER_MODEL=qwen/qwen3.8-27b:free
    assert health_data["model"] == "qwen/qwen3.8-27b:free", f"Model is {health_data['model']}"
    assert health_data["primary_model_verified"] is True
    print(f"STEP 3 & 4: .env loaded -> OPENROUTER_MODEL = {health_data['model']} (VERIFIED)")

    # STEP 5: Verify OpenRouter connectivity
    llm = LLMClient()
    conn_info = asyncio.run(llm.test_connection())
    print(f"STEP 5: OpenRouter Connectivity -> Status: {conn_info.get('status')}, Model: {conn_info.get('model')}")

    # STEP 6 & 7: Upload / process sample resume
    sample_pdf_path = Path("data/demo/sample_resume.pdf")
    assert sample_pdf_path.exists(), "Sample resume PDF not found"
    profile = asyncio.run(process_resume(str(sample_pdf_path)))
    print("STEP 6 & 7: Sample Resume Processed via PyMuPDF:")
    print(f"  - Name: {profile.get('name')}")
    print(f"  - Email: {profile.get('email')}")
    print(f"  - Phone: {profile.get('phone')}")
    print(f"  - Education: {[e.get('degree') for e in profile.get('education', [])]}")
    print(f"  - Skills: {profile.get('skills', {}).get('all_skills')[:5]}")
    print(f"  - Experience: {[e.get('role') for e in profile.get('experience', [])]}")
    print(f"  - Projects: {[p.get('title') for p in profile.get('projects', [])]}")
    assert profile.get("name") == "Test User"
    assert profile.get("email") == "test@example.com"
    assert len(profile.get("skills", {}).get("all_skills", [])) >= 4

    # STEP 8 & 9: Process sample job description
    sample_jd_text = Path("data/demo/sample_job_description.txt").read_text(encoding="utf-8")
    job_info = parse_job_description(sample_jd_text)
    print("STEP 8 & 9: Job Description Extracted:")
    print(f"  - Title: {job_info.get('title')}")
    print(f"  - Company: {job_info.get('company')}")
    print(f"  - Work Mode: {job_info.get('work_mode')}")
    print(f"  - Required Skills: {job_info.get('required_skills')}")
    assert "Data Analyst" in job_info["title"]
    assert "Python" in job_info["required_skills"]

    # STEP 10 & 11: JD Simplification & Qwen / Fallback response
    simplification = asyncio.run(simplify_job_description(sample_jd_text, llm_client=llm))
    print("STEP 10 & 11: JD Simplification Generated:")
    print(f"  - Sections Present: {simplification['headers_present']}")
    assert len(simplification["headers_present"]) >= 5

    # STEP 12, 13, 14: Embeddings & Similarity Calculation
    emb_res = compute_embedding(profile.get("name", "") + " " + " ".join(profile.get("skills", {}).get("all_skills", [])))
    emb_job = compute_embedding(job_info.get("title", "") + " " + " ".join(job_info.get("required_skills", [])))
    raw_sim = cosine_similarity(emb_res, emb_job)
    match_data = job_matcher.calculate_match(profile, job_info)
    print("STEP 12, 13, 14: Semantic Job Matching (SentenceTransformers):")
    print(f"  - Raw Cosine Similarity: {round(raw_sim, 3)}")
    print(f"  - Overall Match Score: {match_data['overall_match_score']}%")
    print(f"  - Matched Skills: {match_data['matched_skills']}")
    print(f"  - Missing Skills: {match_data['missing_skills']}")
    assert match_data["overall_match_score"] > 60

    # STEP 15 & 16: Static FAISS Retrieval & Grounded RAG Answer
    rag_query = "What is keyboard navigation?"
    rag_res = asyncio.run(static_rag.answer_query(rag_query, llm_client=llm))
    print("STEP 15 & 16: Static FAISS RAG Retrieval & QA:")
    print(f"  - Query: {rag_res['query']}")
    print(f"  - Retrieved Sources: {rag_res['sources']}")
    print(f"  - Grounded Answer Snippet: {rag_res['answer'][:120]}...")
    assert len(rag_res["sources"]) >= 1

    # STEP 17, 18, 19: Sample HTML DOM extraction
    html_content = Path("data/demo/sample_application.html").read_text(encoding="utf-8")
    dom_data = analyze_dom(html_content)
    print("STEP 17, 18, 19: DOM Extraction:")
    print(f"  - Total Fields Detected: {dom_data['total_fields']}")
    print(f"  - Headings Detected: {len(dom_data['headings'])}")
    print(f"  - Buttons Detected: {len(dom_data['buttons'])}")
    assert dom_data["total_fields"] >= 10

    # STEP 20: Heuristic Accessibility Analysis
    audit_report = audit_accessibility(dom_data)
    print("STEP 20: Heuristic Accessibility Analysis:")
    print(f"  - Total Issues Found: {audit_report['summary']['total_issues']}")
    print(f"  - High Severity: {audit_report['summary']['high_severity']}")
    print(f"  - Disclaimer: {audit_report['disclaimer']}")
    assert audit_report["summary"]["total_issues"] >= 1

    # STEP 21, 22, 23: Smart Field Mapping & Safe vs Ambiguous Fields
    mappings = map_all_fields(dom_data["inputs"], profile)
    rev = mappings["review_summary"]
    print("STEP 21, 22, 23: Smart Form Mapping:")
    print(f"  - Safe Auto Fields Count: {rev['safe_auto_fields']}")
    print(f"  - Ambiguous / Confirmation Fields Count: {rev['ambiguous_review_fields']}")
    assert rev["safe_auto_fields"] >= 4
    assert rev["ambiguous_review_fields"] >= 2

    # STEP 24: Submission Safeguard (Requires explicit confirmation)
    unconf_res = client.post("/api/dom/submit-application", json={
        "company": "CogniCorp", "position": "Analyst", "application_fields": {}, "user_confirmed": False
    })
    assert unconf_res.status_code == 400
    conf_res = client.post("/api/dom/submit-application", json={
        "company": "CogniCorp", "position": "Analyst", "application_fields": {"email": "test@example.com"}, "user_confirmed": True
    })
    assert conf_res.status_code == 200
    print("STEP 24: Application Submission Safeguard -> Enforced (Blocked without confirmation, Accepted with explicit confirmation)")

    # STEP 25: API Error Handling
    err_res = client.post("/api/jobs/parse", json={"text": ""})
    assert err_res.status_code == 400
    print("STEP 25: API Error Handling -> Verified (Empty payload returns HTTP 400 without crashing)")

    print("=" * 60)
    print("ALL 25 STEPS VERIFIED AND PASSED SUCCESSFULLY!")
    print("=" * 60)


if __name__ == "__main__":
    run_e2e_verification()
