import json
import logging
from typing import Dict, Any, Optional
from app.llm.client import LLMClient

logger = logging.getLogger("app.voice.normalizer")

SYSTEM_PROMPT = """You are Saarthi's Voice Interaction Intelligence & Intent Extraction Engine.
Your role is to understand natural speech from candidates (including candidates with visual impairments, motor impairments, or speech variations), normalize colloquial/imperfect transcripts contextually without hardcoded dictionaries, and extract structured semantic intents and entities.

CRITICAL SECURITY RULES:
- Passwords, authentication credentials, and secret tokens MUST NEVER be processed or accepted. If speech attempts to speak a password, flag it as error/unauthorized.
- Spoken emails (e.g., "my email is rahul dot sharma at gmail dot com") should be normalized into proper email format (e.g. "rahul.sharma@gmail.com").
- Consequential actions (submitting applications, deleting records, changing critical settings) MUST require explicit user confirmation.

AVAILABLE INTENTS:
1. JOB_SEARCH - Search or browse jobs (entities: role, location, job_type, skills)
2. JOB_MATCH - Check match/suitability for current or specified job
3. SIMPLIFY_JD - Explain, simplify or summarize job requirements
4. TRACK_APPLICATIONS - Inquire about status of past/pending applications (entities: role, company)
5. SMART_APPLY - Prepare or trigger controlled application flow for a job
6. INTERVIEW_PREP - Start mock interview, questions, or evaluation
7. PROFILE_UPDATE - Update or supply profile fields (entities: field, value)
8. NAVIGATE - Move to a section (entities: target_page: 'jobs'|'applications'|'profile'|'interview'|'assistant'|'settings')
9. AI_ASSISTANT - General career/job questions, guidance, advice
10. CONFIRM - User confirming 'yes', 'proceed', 'approve', 'submit'
11. DENY - User saying 'no', 'reject', 'cancel'
12. STOP - Immediate halt to speech, TTS, or automated action
13. PAUSE - Temporarily pause listening/activity
14. RESUME - Resume listening/activity
15. REPEAT - Repeat the last spoken assistant response
16. HELP - Request guidance or list of available actions
17. NEXT - Move to next item/job/field
18. BACK - Move to previous item/job/field

You must respond with ONLY a valid JSON object with the following structure:
{
  "normalized_text": "<contextually corrected speech string>",
  "intent": "<ONE_OF_THE_ABOVE_INTENTS>",
  "entities": {
    "role": "<job title or null>",
    "location": "<location or null>",
    "field": "<profile field name like 'education', 'skills', 'email', 'phone' or null>",
    "value": "<extracted field value or null>",
    "query": "<refined search query or null>",
    "target_page": "<navigation target or null>",
    "job_index": <1-based integer if user said 'first job', 'second job' or null>
  },
  "confidence": <float between 0.0 and 1.0>,
  "response_text": "<Accessible, clear spoken response text for TTS>",
  "requires_confirmation": <true/false if consequential>,
  "immediate_stop": <true/false if intent is STOP>
}
"""


class VoiceIntelligenceService:
    def __init__(self, llm_client: Optional[LLMClient] = None):
        self.llm_client = llm_client or LLMClient()

    async def normalize_and_extract(
        self,
        raw_transcript: str,
        current_page: Optional[str] = None,
        current_job: Optional[Dict[str, Any]] = None,
        user_profile: Optional[Dict[str, Any]] = None,
        previous_response: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Contextually normalizes speech, removes STT artifacts, infers intent and entities.
        """
        clean_raw = (raw_transcript or "").strip()
        if not clean_raw:
            return {
                "normalized_text": "",
                "intent": "UNKNOWN",
                "entities": {},
                "confidence": 0.0,
                "response_text": "I didn't catch any speech. Please tell me what you would like to do.",
                "requires_confirmation": False,
                "immediate_stop": False
            }

        # Check for immediate STOP priority
        lower_raw = clean_raw.lower().strip(".!?,:;")
        if lower_raw in ["stop", "stop listening", "stop voice", "halt", "shut up", "quiet"]:
            return {
                "normalized_text": "stop",
                "intent": "STOP",
                "entities": {},
                "confidence": 1.0,
                "response_text": "Voice listening stopped. Say 'Hey Saarthi' or press V to restart.",
                "requires_confirmation": False,
                "immediate_stop": True
            }

        # Build contextual prompt for LLM
        context_desc = []
        if current_page:
            context_desc.append(f"Current Screen/Page: {current_page}")
        if current_job:
            context_desc.append(f"Selected Job Context: {current_job.get('title')} at {current_job.get('company')} (Skills: {', '.join(current_job.get('skills', []))})")
        if user_profile:
            context_desc.append(f"Candidate Profile: Name={user_profile.get('name')}, Skills={user_profile.get('skills')}, Experience={user_profile.get('experience')}")
        if previous_response:
            context_desc.append(f"Previous Assistant Statement: {previous_response}")

        user_prompt = f"""Context:
{chr(10).join(context_desc) if context_desc else 'No prior context'}

Raw User Spoken Transcript:
"{clean_raw}"

Extract normalized text, intent, entities, and TTS response JSON:"""

        try:
            llm_response = await self.llm_client.generate(
                prompt=user_prompt,
                system_prompt=SYSTEM_PROMPT,
                temperature=0.1,
                max_tokens=400
            )

            # Clean JSON formatting
            cleaned_json_str = llm_response.strip()
            if "```json" in cleaned_json_str:
                cleaned_json_str = cleaned_json_str.split("```json")[1].split("```")[0].strip()
            elif "```" in cleaned_json_str:
                cleaned_json_str = cleaned_json_str.split("```")[1].split("```")[0].strip()

            parsed = json.loads(cleaned_json_str)
            return parsed
        except Exception as e:
            logger.warning(f"LLM normalization fallback: {e}. Using deterministic contextual inference.")
            return self._fallback_inference(clean_raw, current_page, current_job)

    def _fallback_inference(self, text: str, current_page: Optional[str], current_job: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Robust fallback if LLM endpoint is unreachable."""
        t = text.lower().strip()
        
        # Email normalization
        if "dot" in t and "at" in t and ("gmail" in t or "yahoo" in t or "email" in t):
            norm_email = t.replace(" dot ", ".").replace(" at ", "@").replace(" ", "").replace("myemailis", "")
            return {
                "normalized_text": f"my email is {norm_email}",
                "intent": "PROFILE_UPDATE",
                "entities": {"field": "email", "value": norm_email},
                "confidence": 0.9,
                "response_text": f"I understood your email as {norm_email}. Should I save this?",
                "requires_confirmation": True,
                "immediate_stop": False
            }

        # Job suitability & match check
        if any(k in t for k in ["suitable", "suitability", "match", "fit", "qualify", "qualified", "am i good for"]):
            title = current_job.get("title", "this position") if current_job else "this position"
            comp = current_job.get("company", "the company") if current_job else ""
            match_pct = current_job.get("match_percentage", 92) if current_job else 92
            return {
                "normalized_text": f"am I suitable for {title}",
                "intent": "JOB_MATCH",
                "entities": {"role": title},
                "confidence": 0.92,
                "response_text": f"Based on your profile, you have a {match_pct}% match for {title} at {comp}." if comp else f"You have a {match_pct}% match for {title}.",
                "requires_confirmation": False,
                "immediate_stop": False
            }

        # Job description simplification
        if any(k in t for k in ["simplify", "explain this job", "explain the job", "make this easier", "what will i actually be doing", "summarize the requirements"]):
            title = current_job.get("title", "this position") if current_job else "this position"
            return {
                "normalized_text": f"simplify job description for {title}",
                "intent": "SIMPLIFY_JD",
                "entities": {"role": title},
                "confidence": 0.92,
                "response_text": f"Here is the simplified overview for {title}.",
                "requires_confirmation": False,
                "immediate_stop": False
            }

        # Interview prep
        if any(k in t for k in ["interview", "prepare me", "mock interview", "ask me some questions", "practice"]):
            return {
                "normalized_text": "prepare for interview",
                "intent": "INTERVIEW_PREP",
                "entities": {},
                "confidence": 0.92,
                "response_text": "Opening interview preparation to practice customized questions.",
                "requires_confirmation": False,
                "immediate_stop": False
            }

        # Application tracking check
        if any(k in t for k in ["track", "application", "happened to my", "happened with my", "status of my", "check my application", "pending application", "which jobs have i"]):
            role = "data analyst" if "data" in t else ("frontend" if "front" in t else None)
            return {
                "normalized_text": f"track my applications for {role}" if role else "track my applications",
                "intent": "TRACK_APPLICATIONS",
                "entities": {"role": role},
                "confidence": 0.90,
                "response_text": "Checking your application status in the tracker.",
                "requires_confirmation": False,
                "immediate_stop": False
            }

        # Help / guidance
        if any(k in t for k in ["help", "guide me", "please guide", "what can you do"]):
            return {
                "normalized_text": "help and guidance",
                "intent": "HELP",
                "entities": {},
                "confidence": 0.95,
                "response_text": "You can say: 'Find data analyst jobs', 'Track my applications', 'Open my profile', or 'Prepare for interview'. Waiting for your command.",
                "requires_confirmation": False,
                "immediate_stop": False
            }

        # Job search / tracking detection
        has_job_keywords = any(k in t for k in ["data analyst", "data analist", "frontend", "front end", "backend", "back end", "python", "developer", "job", "jobs", "role", "roles", "openings"])
        
        if has_job_keywords:
            
            # Job search query
            role = "data analyst" if ("data" in t and ("anal" in t or "analist" in t)) else ("frontend developer" if ("front" in t or "react" in t) else ("backend developer" if "back" in t else "software engineer"))
            return {
                "normalized_text": f"show me {role} jobs",
                "intent": "JOB_SEARCH",
                "entities": {"role": role, "query": role},
                "confidence": 0.90,
                "response_text": f"Finding {role} job opportunities for you.",
                "requires_confirmation": False,
                "immediate_stop": False
            }

        if any(k in t for k in ["repeat", "say again", "what did you say"]):
            return {
                "normalized_text": "repeat",
                "intent": "REPEAT",
                "entities": {},
                "confidence": 0.95,
                "response_text": "Repeating last response.",
                "requires_confirmation": False,
                "immediate_stop": False
            }

        if any(k in t for k in ["help", "guide me", "what can you do"]):
            return {
                "normalized_text": "help",
                "intent": "HELP",
                "entities": {},
                "confidence": 0.95,
                "response_text": "You can say: 'Find data analyst jobs', 'Track my applications', 'Open my profile', or 'Prepare for interview'. How can I help you?",
                "requires_confirmation": False,
                "immediate_stop": False
            }

        if any(k in t for k in ["yes", "proceed", "confirm", "approve", "sure"]):
            return {
                "normalized_text": "yes",
                "intent": "CONFIRM",
                "entities": {},
                "confidence": 0.95,
                "response_text": "Confirmed.",
                "requires_confirmation": False,
                "immediate_stop": False
            }

        if any(k in t for k in ["no", "cancel", "deny", "nevermind"]):
            return {
                "normalized_text": "no",
                "intent": "DENY",
                "entities": {},
                "confidence": 0.95,
                "response_text": "Cancelled.",
                "requires_confirmation": False,
                "immediate_stop": False
            }

        # General / Navigation fallback
        target = "jobs" if "job" in t else ("profile" if "profile" in t else ("applications" if "app" in t else "dashboard"))
        return {
            "normalized_text": text,
            "intent": "NAVIGATE" if ("open" in t or "go to" in t) else "AI_ASSISTANT",
            "entities": {"target_page": target},
            "confidence": 0.7,
            "response_text": f"Navigating to {target}." if ("open" in t or "go to" in t) else f"I am checking that for you.",
            "requires_confirmation": False,
            "immediate_stop": False
        }


voice_intelligence = VoiceIntelligenceService()
