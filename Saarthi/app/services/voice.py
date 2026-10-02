import re
from typing import Dict, Any, Optional

COMMAND_PATTERNS = [
    (r"\b(stop|halt)\b", "STOP", "Immediately stop active speech and automated actions."),
    (r"\b(cancel( application)?)\b", "CANCEL", "Cancel current action or application flow."),
    (r"\b(yes|approve|agree|proceed)\b", "APPROVE", "Confirm and approve current action."),
    (r"\b(no|deny|reject)\b", "DENY", "Reject or deny current action."),
    (r"\b(find|search( for)?)\s+(.+)", "SEARCH_JOBS", "Search for matching job opportunities."),
    (r"\bread (this )?page\b", "READ_PAGE", "Read the main content and structure of current screen."),
    (r"\bexplain (this )?job\b", "EXPLAIN_JOB", "Explain the active job description and required qualifications."),
    (r"\b(go to )?next (field|input)\b", "NEXT_FIELD", "Move keyboard focus to the next form field."),
    (r"\b(go to )?previous (field|input)\b", "PREV_FIELD", "Move keyboard focus to the previous form field."),
    (r"\bnext (job|opening)\b", "NEXT_JOB", "Navigate to the next job opening."),
    (r"\bprevious (job|opening)\b", "PREV_JOB", "Navigate to the previous job opening."),
    (r"\bfill (my )?email\b", "FILL_EMAIL", "Populate the email field from user profile."),
    (r"\bfill (my )?phone\b", "FILL_PHONE", "Populate the phone field from user profile."),
    (r"\bfill (my )?name\b", "FILL_NAME", "Populate the name field from user profile."),
    (r"\bfill safe fields?\b", "FILL_SAFE_FIELDS", "Automatically populate all verified, safe fields."),
    (r"\bexplain (this )?(question|field)\b", "EXPLAIN_QUESTION", "Provide clear explanation of active question."),
    (r"\bread (the )?error\b", "READ_ERROR", "Read aloud active form validation warnings."),
    (r"\bshow unanswered (fields?)?\b", "SHOW_UNANSWERED", "Highlight remaining mandatory empty fields."),
    (r"\bsimplify\b", "SIMPLIFY_JD", "Simplify the active job posting into plain language bullet points."),
    (r"\bsubmit application\b", "PROMPT_SUBMIT_CONFIRM", "Prompt for explicit confirmation before submitting application.")
]


def parse_voice_command(transcript: str) -> Dict[str, Any]:
    """Parse spoken voice transcript into structured intent without invoking LLM."""
    clean_text = transcript.strip().lower()

    if not clean_text:
        return {
            "intent": "UNKNOWN",
            "action": None,
            "transcript": transcript,
            "description": "No speech detected."
        }

    for pattern, intent, desc in COMMAND_PATTERNS:
        match = re.search(pattern, clean_text, re.I)
        if match:
            search_query = ""
            if intent == "SEARCH_JOBS" and match.groups():
                search_query = match.groups()[-1].strip()
            return {
                "intent": intent,
                "action": intent.lower(),
                "transcript": transcript,
                "search_query": search_query,
                "description": desc,
                "immediate_stop": intent == "STOP"
            }

    return {
        "intent": "GENERAL_QUERY",
        "action": "ask_ai",
        "transcript": transcript,
        "description": "General query or ambiguous command. Routed to AI assistant."
    }
