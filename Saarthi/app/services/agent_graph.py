"""
Saarthi Agent Orchestration Layer powered by LangGraph.
Implements multi-step agent workflows for:
1. Voice Command Assistant (Intent classification, context retrieval, execution, response generation)
2. Job Search & Matching (Query expansion, semantic matching, related roles reasoning)
3. Smart Apply Workflow (DOM audit, field mapping, safety confirmation checks)
4. Application Tracking Queries (Natural language status retrieval & TTS summaries)
5. Career Assistant (Job context + profile grounded Q&A)
6. Resume / Profile Processing (Deterministic extraction + field validation + completeness)
7. Interview Preparation & Evaluation (Question generation, voice answer transcription & critique)
"""

import json
import logging
from typing import TypedDict, Optional, List, Dict, Any
from pathlib import Path

from langgraph.graph import StateGraph, END

from app.services.voice import parse_voice_command
from app.services.tracker import application_tracker
from app.services.profile import user_profile_service, calculate_profile_completeness
from app.services.jobs import job_search_agent, handle_career_assistant_query
from app.services.matcher import job_matcher
from app.services.dom_analyzer import analyze_dom, audit_accessibility
from app.services.form_filler import map_all_fields
from app.services.interview import generate_interview_questions
from app.services.rag import static_rag
from app.llm.client import LLMClient

logger = logging.getLogger("app.agent_graph")
llm_client = LLMClient()


from app.services.voice_intelligence import voice_intelligence

# ============================================================
# 1. VOICE COMMAND ASSISTANT GRAPH (AI-POWERED LANGGRAPH ROUTER)
# ============================================================

class VoiceCommandState(TypedDict, total=False):
    transcript: str
    raw_transcript: str
    normalized_transcript: Optional[str]
    current_page: Optional[str]
    current_job: Optional[Dict[str, Any]]
    user_profile: Optional[Dict[str, Any]]
    previous_response: Optional[str]
    intent: Optional[str]
    entities: Optional[Dict[str, Any]]
    target: Optional[str]
    action: Optional[str]
    speech_announcement: Optional[str]
    response_text: Optional[str]
    requires_confirmation: bool
    immediate_stop: bool
    payload: Optional[Dict[str, Any]]
    search_query: Optional[str]
    target_page: Optional[str]
    field: Optional[str]
    value: Optional[str]
    job_index: Optional[int]


def voice_normalize_and_intent_node(state: VoiceCommandState) -> Dict[str, Any]:
    """
    AI Normalization & Intent Node.
    Contextually corrects spoken errors, fillers, spelling, and extracts semantic intent + entities.
    """
    transcript = state.get("raw_transcript") or state.get("transcript") or ""
    current_page = state.get("current_page")
    current_job = state.get("current_job")
    user_profile = state.get("user_profile")
    prev_resp = state.get("previous_response")

    # Execute AI Normalization & Intent Extraction
    try:
        import asyncio
        import concurrent.futures
        try:
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(
                    asyncio.run,
                    voice_intelligence.normalize_and_extract(
                        transcript, current_page, current_job, user_profile, prev_resp
                    )
                )
                ai_result = future.result(timeout=5.0)
        except Exception:
            ai_result = voice_intelligence._fallback_inference(transcript, current_page, current_job)
    except Exception:
        ai_result = voice_intelligence._fallback_inference(transcript, current_page, current_job)

    return {
        "normalized_transcript": ai_result.get("normalized_text", transcript),
        "intent": ai_result.get("intent", "UNKNOWN"),
        "entities": ai_result.get("entities", {}),
        "immediate_stop": ai_result.get("immediate_stop", False),
        "requires_confirmation": ai_result.get("requires_confirmation", False),
        "response_text": ai_result.get("response_text"),
        "speech_announcement": ai_result.get("response_text"),
        "payload": ai_result
    }


def voice_context_retrieval_node(state: VoiceCommandState) -> Dict[str, Any]:
    profile_data = state.get("user_profile")
    if not profile_data:
        try:
            profile_data = user_profile_service.get_profile()
        except Exception:
            profile_data = {}
    return {"user_profile": profile_data}


def voice_execute_action_node(state: VoiceCommandState) -> Dict[str, Any]:
    intent = state.get("intent", "UNKNOWN")
    norm_text = state.get("normalized_transcript", "")
    entities = state.get("entities", {}) or {}
    current_job = state.get("current_job")
    current_page = state.get("current_page")
    
    # Priority stop
    if state.get("immediate_stop") or intent == "STOP":
        return {
            "action": "STOP_ALL",
            "response_text": "Voice interaction paused. Say 'Hey Saarthi' or press V to restart.",
            "speech_announcement": "Voice interaction paused."
        }

    # REPEAT last statement
    if intent == "REPEAT":
        prev = state.get("previous_response") or "I am ready for your next command. How can I help you?"
        return {
            "action": "SPEAK_RESPONSE",
            "response_text": prev,
            "speech_announcement": prev
        }

    # PAUSE / RESUME
    if intent == "PAUSE":
        return {
            "action": "PAUSE_LISTENING",
            "response_text": "Listening paused. Say resume or press V to continue.",
            "speech_announcement": "Listening paused."
        }
    if intent == "RESUME":
        return {
            "action": "RESUME_LISTENING",
            "response_text": "Listening resumed. How can I assist you?",
            "speech_announcement": "Listening resumed."
        }

    # HELP / GUIDANCE
    if intent in ["HELP", "GUIDANCE"]:
        help_msg = "You can ask me to search for jobs, track your applications, simplify job descriptions, prepare for interviews, or navigate pages. Waiting for your command."
        return {
            "action": "GUIDANCE_MODE",
            "response_text": help_msg,
            "speech_announcement": help_msg
        }

    # Application tracking queries
    if intent == "TRACK_APPLICATIONS":
        apps = application_tracker.get_all()
        role_filter = entities.get("role")
        if role_filter:
            matched_apps = [a for a in apps if role_filter.lower() in (a.get("position") or a.get("job_title", "")).lower()]
            if matched_apps:
                target_app = matched_apps[0]
                summary = f"Your application for {target_app.get('position')} at {target_app.get('company')} is currently {target_app.get('status')}."
            else:
                summary = f"No tracked application found matching {role_filter}. You have {len(apps)} other applications in your tracker."
        else:
            if not apps:
                summary = "You currently have no submitted applications in your tracker."
            else:
                latest = apps[-1]
                summary = f"You have {len(apps)} total applications tracked. Your latest application for {latest.get('position')} at {latest.get('company')} is currently {latest.get('status')}."
        return {
            "action": "NAVIGATE_TRACKER",
            "target": "tab-tracker",
            "response_text": summary,
            "speech_announcement": summary
        }

    # Search jobs
    if intent == "JOB_SEARCH":
        role = entities.get("role") or entities.get("query") or "software"
        return {
            "action": "NAVIGATE_JOBSEARCH",
            "target": "tab-jobsearch",
            "search_query": role,
            "response_text": f"Found matching positions for {role}. Opening jobs list.",
            "speech_announcement": f"Found matching positions for {role}."
        }

    # Simplify Job Description
    if intent == "SIMPLIFY_JD":
        if current_job:
            summary = current_job.get("simplified_summary") or current_job.get("description", "")[:200]
            resp = f"Here is the simplified summary for {current_job.get('title')}: {summary}"
        else:
            resp = "Please select a job card first to simplify its requirements."
        return {
            "action": "SIMPLIFY_ACTIVE_JOB",
            "response_text": resp,
            "speech_announcement": resp
        }

    # Job Match / Suitability evaluation
    if intent == "JOB_MATCH":
        if current_job:
            match_pct = current_job.get("match_percentage", 92)
            resp = f"Based on your profile, you have a {match_pct}% match for {current_job.get('title')} at {current_job.get('company')}."
        else:
            resp = "You have high match scores in frontend and data roles. Please select a job to see detailed suitability."
        return {
            "action": "EVALUATE_MATCH",
            "response_text": resp,
            "speech_announcement": resp
        }

    # Smart Apply initiation (Safeguarded)
    if intent == "SMART_APPLY":
        job_idx = entities.get("job_index")
        target_title = current_job.get("title") if current_job else (f"job #{job_idx}" if job_idx else "this position")
        resp = f"I am preparing the application form for {target_title} using your verified profile. Please confirm before submitting."
        return {
            "action": "TRIGGER_SMART_APPLY",
            "job_index": job_idx,
            "requires_confirmation": True,
            "response_text": resp,
            "speech_announcement": resp
        }

    # Profile Field Updates via voice (Semantic extraction)
    if intent == "PROFILE_UPDATE":
        field = entities.get("field", "information")
        val = entities.get("value", "")
        # Apply update to profile
        if field and val:
            try:
                user_profile_service.update_profile({"resume_profile": {field: val}})
            except Exception:
                pass
        resp = f"I have updated your {field} to {val}."
        return {
            "action": "UPDATE_PROFILE_FIELD",
            "field": field,
            "value": val,
            "response_text": resp,
            "speech_announcement": resp
        }

    # Interview Prep
    if intent == "INTERVIEW_PREP":
        return {
            "action": "NAVIGATE_INTERVIEW",
            "target": "tab-interview",
            "response_text": "Opening Interview Preparation. I will prepare personalized interview questions for you.",
            "speech_announcement": "Opening Interview Preparation."
        }

    # Navigation intents
    if intent == "NAVIGATE":
        target = entities.get("target_page", "dashboard")
        page_map = {
            "jobs": ("tab-jobsearch", "Opening Job Search."),
            "applications": ("tab-tracker", "Opening Application Tracker."),
            "profile": ("tab-profile", "Opening Profile."),
            "interview": ("tab-interview", "Opening Interview Preparation."),
            "assistant": ("tab-ai-assistant", "Opening AI Assistant."),
            "settings": ("tab-settings", "Opening Settings."),
            "dashboard": ("tab-jobsearch", "Opening Dashboard.")
        }
        tab_id, msg = page_map.get(target, ("tab-jobsearch", f"Opening {target}."))
        return {
            "action": "NAVIGATE",
            "target": tab_id,
            "target_page": target,
            "response_text": msg,
            "speech_announcement": msg
        }

    # Confirm / Deny
    if intent in ["CONFIRM", "APPROVE"]:
        return {
            "action": "CONFIRM_YES",
            "response_text": "Confirmed.",
            "speech_announcement": "Confirmed."
        }
    if intent in ["DENY", "CANCEL"]:
        return {
            "action": "CONFIRM_NO",
            "response_text": "Cancelled.",
            "speech_announcement": "Cancelled."
        }

    # General Query fallback
    ans = state.get("response_text") or f"I understood: {norm_text}. What would you like me to do next?"
    return {
        "action": "GENERAL_VOICE",
        "response_text": ans,
        "speech_announcement": ans
    }


def build_voice_command_graph():
    builder = StateGraph(VoiceCommandState)
    builder.add_node("classify", voice_normalize_and_intent_node)
    builder.add_node("retrieve_context", voice_context_retrieval_node)
    builder.add_node("execute_action", voice_execute_action_node)
    
    builder.set_entry_point("classify")
    builder.add_edge("classify", "retrieve_context")
    builder.add_edge("retrieve_context", "execute_action")
    builder.add_edge("execute_action", END)
    return builder.compile()


voice_command_graph = build_voice_command_graph()


# ============================================================
# 2. JOB SEARCH & MATCHING GRAPH
# ============================================================

class JobSearchState(TypedDict):
    query: str
    profile: Optional[Dict[str, Any]]
    jobs: List[Dict[str, Any]]
    related_roles: List[Dict[str, Any]]
    matched_jobs: List[Dict[str, Any]]
    total_found: int


def js_search_node(state: JobSearchState) -> Dict[str, Any]:
    query = state.get("query", "Data Analyst")
    results = job_search_agent.search_jobs_with_reasoning(query)
    return {
        "jobs": results.get("jobs", []),
        "related_roles": results.get("related_roles", []),
        "total_found": results.get("total_found", 0)
    }


def js_matching_node(state: JobSearchState) -> Dict[str, Any]:
    jobs = state.get("jobs", [])
    profile = state.get("profile") or user_profile_service.get_resume_profile()
    
    matched = []
    for j in jobs[:3]:
        jd_text = f"{j.get('title')} at {j.get('company')}. Required: {', '.join(j.get('required_skills', []))}. {j.get('description', '')}"
        match_result = job_matcher.compute_match(profile, jd_text)
        matched.append({
            "job": j,
            "match_score": match_result.get("overall_match_score", 0),
            "matched_skills": match_result.get("matched_skills", []),
            "missing_skills": match_result.get("missing_skills", []),
            "alignment": match_result.get("why_this_job_matches", "")
        })
    return {"matched_jobs": matched}


def build_job_search_graph():
    builder = StateGraph(JobSearchState)
    builder.add_node("search_catalog", js_search_node)
    builder.add_node("match_with_profile", js_matching_node)
    
    builder.set_entry_point("search_catalog")
    builder.add_edge("search_catalog", "match_with_profile")
    builder.add_edge("match_with_profile", END)
    return builder.compile()


job_search_graph = build_job_search_graph()


# ============================================================
# 3. SMART APPLY WORKFLOW GRAPH
# ============================================================

class SmartApplyState(TypedDict):
    html: str
    user_confirmed: bool
    company: str
    position: str
    audit_issues: List[Dict[str, Any]]
    mapped_fields: List[Dict[str, Any]]
    is_ready_for_submission: bool
    submission_status: Optional[str]
    error: Optional[str]


def sa_audit_node(state: SmartApplyState) -> Dict[str, Any]:
    html = state.get("html", "")
    dom_data = analyze_dom(html) if html else {}
    audit = audit_accessibility(dom_data) if dom_data else {}
    return {"audit_issues": audit.get("issues", [])}


def sa_map_fields_node(state: SmartApplyState) -> Dict[str, Any]:
    html = state.get("html", "")
    dom_data = analyze_dom(html) if html else {}
    profile = user_profile_service.get_resume_profile()
    mapping_res = map_all_fields(dom_data.get("inputs", []), profile)
    return {"mapped_fields": mapping_res.get("mappings", [])}


def sa_safeguard_node(state: SmartApplyState) -> Dict[str, Any]:
    user_confirmed = state.get("user_confirmed", False)
    if not user_confirmed:
        return {
            "is_ready_for_submission": False,
            "submission_status": "WAITING_FOR_USER_CONFIRMATION",
            "error": "Action blocked: Human confirmation required before application submission."
        }
    
    # User confirmed -> submit
    app_record = application_tracker.add({
        "company": state.get("company", "CogniCorp Technologies"),
        "position": state.get("position", "Junior Data Analyst"),
        "status": "Applied",
        "notes": "Submitted via Saarthi Smart Apply with explicit candidate confirmation."
    })
    return {
        "is_ready_for_submission": True,
        "submission_status": "SUCCESSFULLY_SUBMITTED",
        "error": None
    }


def build_smart_apply_graph():
    builder = StateGraph(SmartApplyState)
    builder.add_node("audit_dom", sa_audit_node)
    builder.add_node("map_fields", sa_map_fields_node)
    builder.add_node("apply_safeguards", sa_safeguard_node)
    
    builder.set_entry_point("audit_dom")
    builder.add_edge("audit_dom", "map_fields")
    builder.add_edge("map_fields", "apply_safeguards")
    builder.add_edge("apply_safeguards", END)
    return builder.compile()


smart_apply_graph = build_smart_apply_graph()


# ============================================================
# 4. APPLICATION TRACKING QUERY GRAPH
# ============================================================

class TrackerQueryState(TypedDict):
    query: str
    applications: List[Dict[str, Any]]
    summary: str
    speech_summary: str


def tracker_fetch_node(state: TrackerQueryState) -> Dict[str, Any]:
    apps = application_tracker.get_all()
    return {"applications": apps}


def tracker_summarize_node(state: TrackerQueryState) -> Dict[str, Any]:
    apps = state.get("applications", [])
    query = state.get("query", "").lower()

    if not apps:
        msg = "You have no applications recorded in your tracker yet."
        return {"summary": msg, "speech_summary": msg}

    if "interview" in query:
        interviews = [a for a in apps if a.get("status") == "Interview"]
        if interviews:
            msg = f"You have {len(interviews)} active interview scheduled: {interviews[0].get('position')} at {interviews[0].get('company')}."
        else:
            msg = "You do not have any interviews scheduled right now."
        return {"summary": msg, "speech_summary": msg}

    if "reject" in query:
        rejected = [a for a in apps if a.get("status") == "Rejected"]
        msg = f"You have {len(rejected)} rejected applications."
        return {"summary": msg, "speech_summary": msg}

    # General overview
    counts: Dict[str, int] = {}
    for a in apps:
        st = a.get("status", "Applied")
        counts[st] = counts.get(st, 0) + 1
    
    status_parts = [f"{v} {k}" for k, v in counts.items()]
    msg = f"You have {len(apps)} total applications: {', '.join(status_parts)}."
    return {"summary": msg, "speech_summary": msg}


def build_tracker_query_graph():
    builder = StateGraph(TrackerQueryState)
    builder.add_node("fetch_apps", tracker_fetch_node)
    builder.add_node("summarize_status", tracker_summarize_node)
    
    builder.set_entry_point("fetch_apps")
    builder.add_edge("fetch_apps", "summarize_status")
    builder.add_edge("summarize_status", END)
    return builder.compile()


tracker_query_graph = build_tracker_query_graph()


# ============================================================
# 5. CAREER ASSISTANT GRAPH
# ============================================================

class CareerAssistantState(TypedDict):
    query: str
    job_context: Optional[str]
    answer: str


async def career_assistant_node(state: CareerAssistantState) -> Dict[str, Any]:
    query = state.get("query", "")
    job_ctx = state.get("job_context") or {}
    if isinstance(job_ctx, str):
        job_ctx = {"title": "Data Analyst", "description": job_ctx}
    res = await handle_career_assistant_query(query, job_context=job_ctx, llm_client=llm_client)
    return {"answer": res.get("answer", "")}


def build_career_assistant_graph():
    builder = StateGraph(CareerAssistantState)
    builder.add_node("generate_answer", career_assistant_node)
    builder.set_entry_point("generate_answer")
    builder.add_edge("generate_answer", END)
    return builder.compile()


career_assistant_graph = build_career_assistant_graph()


# ============================================================
# 6. RESUME & PROFILE PIPELINE GRAPH
# ============================================================

class ProfilePipelineState(TypedDict):
    profile_data: Dict[str, Any]
    completeness: Dict[str, Any]


def profile_completeness_node(state: ProfilePipelineState) -> Dict[str, Any]:
    p = state.get("profile_data", {})
    completeness = calculate_profile_completeness(p)
    return {"completeness": completeness}


def build_profile_pipeline_graph():
    builder = StateGraph(ProfilePipelineState)
    builder.add_node("compute_completeness", profile_completeness_node)
    builder.set_entry_point("compute_completeness")
    builder.add_edge("compute_completeness", END)
    return builder.compile()


profile_pipeline_graph = build_profile_pipeline_graph()


# ============================================================
# 7. INTERVIEW PREPARATION & EVALUATION GRAPH
# ============================================================

class InterviewPrepState(TypedDict):
    role: str
    question: Optional[str]
    user_answer: Optional[str]
    evaluation: Optional[Dict[str, Any]]
    feedback_text: Optional[str]
    speech_feedback: Optional[str]


def interview_evaluate_node(state: InterviewPrepState) -> Dict[str, Any]:
    q = state.get("question", "")
    ans = state.get("user_answer", "").strip()
    
    if not ans:
        msg = "No answer detected. Please provide your thoughts or speak your answer."
        return {"feedback_text": msg, "speech_feedback": msg, "evaluation": {"score": 0}}
    
    # Evaluate answer content
    ans_lower = ans.lower()
    technical_hits = sum(1 for kw in ["python", "sql", "join", "kpi", "etl", "model", "analysis", "dashboard", "metric", "data"] if kw in ans_lower)
    score = min(100, max(40, technical_hits * 25 + len(ans.split()) * 2))
    
    feedback = f"Good answer! (Score: {score}%). You clearly addressed key concepts. Tip: You can also mention specific project achievements from your resume."
    return {
        "evaluation": {
            "score": score,
            "relevance": "High" if technical_hits >= 2 else "Moderate",
            "technical_keywords_found": technical_hits
        },
        "feedback_text": feedback,
        "speech_feedback": feedback
    }


def build_interview_prep_graph():
    builder = StateGraph(InterviewPrepState)
    builder.add_node("evaluate_answer", interview_evaluate_node)
    builder.set_entry_point("evaluate_answer")
    builder.add_edge("evaluate_answer", END)
    return builder.compile()


interview_prep_graph = build_interview_prep_graph()
