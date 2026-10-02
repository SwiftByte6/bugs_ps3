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


# ============================================================
# 1. VOICE COMMAND ASSISTANT GRAPH
# ============================================================

class VoiceCommandState(TypedDict):
    transcript: str
    current_page: Optional[str]
    current_job: Optional[Dict[str, Any]]
    user_profile: Optional[Dict[str, Any]]
    intent: Optional[str]
    target: Optional[str]
    action: Optional[str]
    speech_announcement: Optional[str]
    response_text: Optional[str]
    requires_confirmation: bool
    immediate_stop: bool
    payload: Optional[Dict[str, Any]]


def voice_classify_intent_node(state: VoiceCommandState) -> Dict[str, Any]:
    transcript = state.get("transcript", "").strip()
    parsed = parse_voice_command(transcript)
    return {
        "intent": parsed.get("intent", "UNKNOWN"),
        "target": parsed.get("target"),
        "immediate_stop": parsed.get("immediate_stop", False),
        "requires_confirmation": parsed.get("requires_confirmation", False),
        "payload": parsed
    }


def voice_context_retrieval_node(state: VoiceCommandState) -> Dict[str, Any]:
    intent = state.get("intent", "")
    profile_data = state.get("user_profile")
    if not profile_data:
        try:
            profile_data = user_profile_service.get_profile()
        except Exception:
            profile_data = {}
    return {"user_profile": profile_data}


def voice_execute_action_node(state: VoiceCommandState) -> Dict[str, Any]:
    intent = state.get("intent", "")
    transcript = state.get("transcript", "")
    payload = state.get("payload", {})
    
    # Priority stop
    if state.get("immediate_stop") or intent == "STOP":
        return {
            "action": "STOP_ALL",
            "response_text": "Stopped.",
            "speech_announcement": "Reading stopped."
        }

    # "Please guide me" interaction
    if "guide me" in transcript.lower():
        return {
            "action": "GUIDANCE_MODE",
            "response_text": "Waiting for your command. You can say 'Find jobs', 'Open profile', or 'Track applications'.",
            "speech_announcement": "Waiting for your command."
        }

    # Application tracking queries
    if intent == "TRACK_APPLICATIONS" or "track" in transcript.lower() or "application" in transcript.lower() and "what happened" in transcript.lower():
        apps = application_tracker.get_all()
        if not apps:
            summary = "You currently have no submitted applications in your tracker."
        else:
            latest = apps[-1]
            summary = f"You have {len(apps)} applications tracked. Your latest application for {latest.get('position')} at {latest.get('company')} is currently {latest.get('status')}."
        return {
            "action": "NAVIGATE_TRACKER",
            "response_text": summary,
            "speech_announcement": summary
        }

    # Search jobs
    if intent == "SEARCH_JOBS":
        query = payload.get("search_query") or transcript.replace("find", "").replace("search", "").strip()
        if not query:
            query = "Data Analyst"
        return {
            "action": "NAVIGATE_JOBSEARCH",
            "target": "js-search",
            "response_text": f"Searching jobs for {query}.",
            "speech_announcement": f"Searching jobs for {query}."
        }

    # Natural language navigation commands
    t_clean = transcript.lower().strip()
    if "open job" in t_clean or ("job" in t_clean and "search" in t_clean and "open" in t_clean):
        return {
            "action": "NAVIGATE",
            "target": "tab-jobsearch",
            "response_text": "Opening Job Search.",
            "speech_announcement": "Opening Job Search."
        }
    if "open ai" in t_clean or ("assistant" in t_clean and "open" in t_clean):
        return {
            "action": "NAVIGATE",
            "target": "tab-ai-assistant",
            "response_text": "Opening AI Assistant.",
            "speech_announcement": "Opening AI Assistant."
        }
    if "open profile" in t_clean or ("profile" in t_clean and "open" in t_clean):
        return {
            "action": "NAVIGATE",
            "target": "tab-profile",
            "response_text": "Opening Profile.",
            "speech_announcement": "Opening Profile."
        }
    if "open interview" in t_clean or ("interview" in t_clean and "open" in t_clean):
        return {
            "action": "NAVIGATE",
            "target": "tab-interview",
            "response_text": "Opening Interview Preparation.",
            "speech_announcement": "Opening Interview Preparation."
        }
    if "open settings" in t_clean or ("settings" in t_clean and "open" in t_clean):
        return {
            "action": "NAVIGATE",
            "target": "tab-settings",
            "response_text": "Opening Settings.",
            "speech_announcement": "Opening Settings."
        }

    # Navigation intents from rule parser
    if intent in ["NAVIGATE_PROFILE", "NAVIGATE_JOBS", "NAVIGATE_ASSISTANT", "NAVIGATE_TRACKER", "NAVIGATE_INTERVIEW", "NAVIGATE_SETTINGS"]:
        nav_map = {
            "NAVIGATE_PROFILE": ("tab-profile", "Opening Profile."),
            "NAVIGATE_JOBS": ("tab-jobsearch", "Opening Job Search."),
            "NAVIGATE_ASSISTANT": ("tab-ai-assistant", "Opening AI Assistant."),
            "NAVIGATE_TRACKER": ("tab-tracker", "Opening Application Tracker."),
            "NAVIGATE_INTERVIEW": ("tab-interview", "Opening Interview Preparation."),
            "NAVIGATE_SETTINGS": ("tab-settings", "Opening Settings.")
        }
        tab_id, announcement = nav_map.get(intent, ("tab-jobsearch", "Navigating."))
        return {
            "action": "NAVIGATE",
            "target": tab_id,
            "response_text": announcement,
            "speech_announcement": announcement
        }

    # Approvals / Confirmations
    if intent == "APPROVE":
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

    # Default fallback
    announcement = f"Command recognized: {transcript}"
    return {
        "action": "GENERAL_VOICE",
        "response_text": announcement,
        "speech_announcement": announcement
    }


def build_voice_command_graph():
    builder = StateGraph(VoiceCommandState)
    builder.add_node("classify", voice_classify_intent_node)
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
