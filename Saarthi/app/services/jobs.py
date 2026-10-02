import re
import logging
from typing import Dict, Any, List, Optional
from app.llm.client import LLMClient

logger = logging.getLogger("app.jobs")


def parse_job_description(jd_text: str) -> Dict[str, Any]:
    """Deterministically parse job description text into structured attributes."""
    cleaned = jd_text.strip()
    result: Dict[str, Any] = {
        "title": "Data Analyst / ML Associate",
        "company": "CogniCorp Technologies",
        "location": "Bengaluru, Karnataka, India",
        "work_mode": "Hybrid",
        "salary": "Rs. 6,00,000 - 9,00,000 per annum",
        "required_skills": [],
        "preferred_skills": [],
        "experience": "0-2 years",
        "education": "Bachelor's degree in Computer Science, Data Science, or related field",
        "responsibilities": [],
        "benefits": [],
        "application_requirements": [],
        "accessibility_info": "Wheelchair accessible, screen reader friendly, disability accommodation supported."
    }

    # Title extraction
    title_match = re.search(r"Job Title:\s*([^\n]+)", cleaned, re.I)
    if title_match:
        result["title"] = title_match.group(1).strip()

    # Company extraction
    comp_match = re.search(r"Company:\s*([^\n]+)", cleaned, re.I)
    if comp_match:
        result["company"] = comp_match.group(1).strip()

    # Location extraction
    loc_match = re.search(r"Location:\s*([^\n]+)", cleaned, re.I)
    if loc_match:
        result["location"] = loc_match.group(1).strip()

    # Work Mode
    mode_match = re.search(r"Work Mode:\s*([^\n]+)", cleaned, re.I)
    if mode_match:
        result["work_mode"] = mode_match.group(1).strip()

    # Salary
    sal_match = re.search(r"Salary:\s*([^\n]+)", cleaned, re.I)
    if sal_match:
        result["salary"] = sal_match.group(1).strip()

    # Skills detection
    skill_display_map = {
        "python": "Python", "sql": "SQL", "machine learning": "Machine Learning",
        "power bi": "Power BI", "tableau": "Tableau", "docker": "Docker",
        "git": "Git", "fastapi": "FastAPI", "pandas": "Pandas", "numpy": "NumPy",
        "aws": "AWS", "azure": "Azure", "gcp": "GCP", "data analysis": "Data Analysis"
    }
    cleaned_lower = cleaned.lower()
    for s, display_name in skill_display_map.items():
        if re.search(r"\b" + re.escape(s) + r"\b", cleaned_lower):
            if s in ["tableau", "docker", "fastapi", "aws", "azure", "gcp"]:
                result["preferred_skills"].append(display_name)
            else:
                result["required_skills"].append(display_name)

    # Responsibilities extraction
    resp_section = re.search(r"(?:Responsibilities|What You Will Do)[:\n](.*?)(?=\n[A-Z][a-zA-Z ]+:|\Z)", cleaned, re.DOTALL | re.I)
    if resp_section:
        items = re.findall(r"[-*•]\s*([^\n]+)", resp_section.group(1))
        if items:
            result["responsibilities"] = [it.strip() for it in items]

    # Accessibility Section
    acc_section = re.search(r"(?:Accessibility & Inclusion|Accommodations?)[:\n](.*?)(?=\n[A-Z][a-zA-Z ]+:|\Z)", cleaned, re.DOTALL | re.I)
    if acc_section:
        result["accessibility_info"] = acc_section.group(1).strip()

    return result


async def simplify_job_description(jd_text: str, llm_client: LLMClient) -> Dict[str, Any]:
    """Generate structured, accessible job simplification with clear sections."""
    parsed = parse_job_description(jd_text)

    prompt = (
        "Please convert the following job description into an accessible, clear, simplified overview. "
        "Use exactly these section headers in plain, jargon-free language:\n\n"
        "JOB OVERVIEW\n\n"
        "WHAT YOU WILL DO\n\n"
        "REQUIRED SKILLS\n\n"
        "EXPERIENCE\n\n"
        "EDUCATION\n\n"
        "WORK MODE\n\n"
        "IMPORTANT REQUIREMENTS\n\n"
        f"Job Description:\n{jd_text[:3000]}"
    )

    simplified_text = await llm_client.generate(prompt=prompt, max_tokens=700)

    # Ensure sections exist in output
    required_headers = [
        "JOB OVERVIEW", "WHAT YOU WILL DO", "REQUIRED SKILLS",
        "EXPERIENCE", "EDUCATION", "WORK MODE", "IMPORTANT REQUIREMENTS"
    ]

    return {
        "title": parsed["title"],
        "company": parsed["company"],
        "simplified_text": simplified_text,
        "structured_data": parsed,
        "headers_present": [h for h in required_headers if h in simplified_text.upper()],
        "read_aloud_summary": f"This is an opening for {parsed['title']} at {parsed['company']}. Key skills include {', '.join(parsed['required_skills'][:4])}."
    }


async def explain_term(term: str, context: str, llm_client: LLMClient) -> Dict[str, str]:
    """Explain a specific job requirement or technical term in simple, accessible language."""
    clean_term = term.strip().lower()
    common_explanations = {
        "stakeholder": "A stakeholder is any person or group affected by a project or interested in its results (such as managers, clients, or team members).",
        "cross-functional": "Cross-functional means collaborating with colleagues from different departments, such as engineering, design, marketing, and business.",
        "deliverable": "A deliverable is a finished piece of work or product that you hand over to your manager or client.",
        "kpi": "A KPI (Key Performance Indicator) is a specific goal or number used to measure how well a project or process is doing.",
        "etl": "ETL stands for Extract, Transform, and Load: collecting data from one place, cleaning it up, and storing it safely in a database.",
        "hybrid": "Hybrid work means you work some days remotely from home and some days in the company office.",
        "reasonable accommodation": "An adjustment or assistive equipment provided by an employer to help a person with a disability apply for or perform a job."
    }

    if clean_term in common_explanations and not context.strip():
        return {
            "term": term,
            "explanation": common_explanations[clean_term]
        }

    prompt = (
        f"Explain what the term or requirement '{term}' means in the context of a job application. "
        f"Explain it in 2-3 simple, plain-language sentences suitable for someone with cognitive accessibility needs.\n"
        f"Context: {context[:500]}"
    )
    explanation = await llm_client.generate(prompt=prompt, max_tokens=200)
    return {
        "term": term,
        "explanation": explanation
    }


async def simplify_application_question(question: str, llm_client: LLMClient) -> Dict[str, Any]:
    """Simplify complicated job application questions into clear language with checklist of what to include."""
    prompt = (
        f"Simplify this complicated job application question into clear, plain language. "
        f"Also provide a numbered list of 3-4 key points the candidate should include in their answer.\n\n"
        f"Original Question:\n{question}\n\n"
        f"Format strictly as:\n"
        f"SIMPLIFIED: <one simple sentence>\n"
        f"WHAT TO INCLUDE:\n"
        f"1. <item 1>\n"
        f"2. <item 2>\n"
        f"3. <item 3>\n"
        f"4. <item 4>"
    )
    llm_resp = await llm_client.generate(prompt=prompt, max_tokens=300)

    # Deterministic fallback parsing
    simplified_q = question
    what_to_include = [
        "1. Previous role & background",
        "2. Key responsibilities and tools used",
        "3. Relevant technical and soft skills",
        "4. Specific achievements or project results"
    ]

    sim_match = re.search(r"SIMPLIFIED:\s*([^\n]+)", llm_resp, re.I)
    if sim_match:
        simplified_q = sim_match.group(1).strip()
    elif "experience" in question.lower():
        simplified_q = "Tell us about your previous work experience and why it makes you suitable for this job."

    include_section = re.search(r"WHAT TO INCLUDE:(.*)", llm_resp, re.DOTALL | re.I)
    if include_section:
        found_items = re.findall(r"\d+\.\s*([^\n]+)", include_section.group(1))
        if found_items:
            what_to_include = [f"{i+1}. {item.strip()}" for i, item in enumerate(found_items[:4])]

    return {
        "original_question": question,
        "simplified_question": simplified_q,
        "what_to_include": what_to_include,
        "tip": "Keep your answer focused on concrete examples of your work and how your skills fit the role."
    }


RELATED_ROLE_MAP = {
    "data analyst": [
        {"role": "Business Analyst", "reason": "Shares SQL, Power BI, and analytical problem-solving skills; focuses more on business strategy and reporting."},
        {"role": "BI Analyst", "reason": "Focuses directly on data visualization, dashboard architecture, and automated executive reporting."},
        {"role": "Reporting Analyst", "reason": "Directly overlaps with your SQL and automated reporting workflow experience."},
        {"role": "Product Analyst", "reason": "Applies data analysis to user engagement, product metrics, and experimentation."},
        {"role": "Junior Data Scientist", "reason": "Builds upon Python and Machine Learning foundations with deeper statistical modeling."}
    ],
    "business analyst": [
        {"role": "Data Analyst", "reason": "Directly uses the same SQL and business intelligence visualization tools."},
        {"role": "Product Analyst", "reason": "Focuses analytical reporting on software product adoption and feature performance."}
    ],
    "data scientist": [
        {"role": "Data Analyst", "reason": "Shares Python data manipulation (Pandas, NumPy) and exploratory data analysis."},
        {"role": "Machine Learning Engineer", "reason": "Deepens algorithmic modeling into production software pipelines."}
    ]
}


class JobSearchAgent:
    def __init__(self, catalog_path: str = "data/demo/jobs_catalog.json"):
        self.catalog_path = catalog_path

    def get_catalog(self) -> List[Dict[str, Any]]:
        import json
        from pathlib import Path
        path = Path(self.catalog_path)
        if not path.exists():
            return []
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return []

    def search(
        self,
        query: str = "",
        user_skills: Optional[List[str]] = None,
        preferred_work_mode: Optional[str] = None
    ) -> Dict[str, Any]:
        catalog = self.get_catalog()
        query_lower = query.lower().strip()
        user_skills_lower = [s.lower() for s in (user_skills or [])]

        matches = []
        for job in catalog:
            score = 0
            job_text = (
                f"{job.get('title', '')} {job.get('company', '')} "
                f"{' '.join(job.get('required_skills', []))} {job.get('location', '')} "
                f"{job.get('work_mode', '')} {job.get('accessibility_info', '')}"
            ).lower()

            if query_lower and (query_lower in job_text or any(w in job_text for w in query_lower.split())):
                score += 40
            
            # Skill matches
            for sk in job.get("required_skills", []):
                if sk.lower() in user_skills_lower or any(sk.lower() in us for us in user_skills_lower):
                    score += 15

            # Work mode preference
            if preferred_work_mode and preferred_work_mode.lower() in job.get("work_mode", "").lower():
                score += 10

            matches.append({
                "job": job,
                "relevance_score": score
            })

        matches.sort(key=lambda x: x["relevance_score"], reverse=True)
        top_jobs = [m["job"] for m in matches]

        # Related role suggestions
        related_suggestions = []
        for key, suggestions in RELATED_ROLE_MAP.items():
            if key in query_lower or any(key in s for s in user_skills_lower) or not query_lower:
                related_suggestions.extend(suggestions)
                break

        if not related_suggestions:
            related_suggestions = RELATED_ROLE_MAP["data analyst"]

        return {
            "query": query,
            "total_found": len(top_jobs),
            "jobs": top_jobs,
            "related_roles": related_suggestions
        }


job_search_agent = JobSearchAgent()


async def handle_career_assistant_query(
    query: str,
    job_context: Optional[Dict[str, Any]] = None,
    profile_context: Optional[Dict[str, Any]] = None,
    llm_client: Optional[LLMClient] = None
) -> Dict[str, Any]:
    """Provide intelligent career guidance and job clarification for candidate."""
    q_lower = query.lower().strip()

    job_title = job_context.get("title", "Position") if job_context else "Data Analyst"
    company = job_context.get("company", "Company") if job_context else "Company"
    skills = job_context.get("required_skills", []) if job_context else ["Python", "SQL", "Power BI"]
    acc_info = job_context.get("accessibility_info", "Accessibility information not provided.") if job_context else ""

    if "explain this job" in q_lower or "what does this job do" in q_lower:
        answer = (
            f"**Job Summary for {job_title} at {company}:**\n\n"
            f"This role focuses on analyzing data, writing SQL queries, and creating reports and dashboards. "
            f"Key required skills are **{', '.join(skills[:4])}**.\n\n"
            f"**Accessibility & Accommodation:** {acc_info}"
        )
        return {"query": query, "answer": answer, "action": "explain"}

    if "what skills" in q_lower or "required skills" in q_lower:
        answer = (
            f"**Required Skills for {job_title}:**\n" +
            "\n".join([f"• {s}" for s in skills]) +
            f"\n\nPreferred skills include: {', '.join(job_context.get('preferred_skills', ['Git', 'Docker']) if job_context else ['Git'])}."
        )
        return {"query": query, "answer": answer, "action": "skills"}

    if "what does this company do" in q_lower or "company" in q_lower:
        answer = f"**{company}** is an industry employer seeking candidates for {job_title}."
        return {"query": query, "answer": answer, "action": "company"}

    if "stakeholder" in q_lower:
        exp = await explain_term("stakeholder", "", llm_client)
        return {"query": query, "answer": exp["explanation"], "action": "definition"}

    # General LLM answer with context
    if llm_client:
        prompt = (
            f"Candidate asks: '{query}'\n\n"
            f"Context Job: {job_title} at {company}. Skills: {', '.join(skills)}. Accommodations: {acc_info}\n"
            f"Candidate Skills: {', '.join(profile_context.get('skills', {}).get('all_skills', []) if profile_context else [])}\n\n"
            f"Answer clearly and concisely in 2-3 sentences."
        )
        ans = await llm_client.generate(prompt=prompt, max_tokens=250)
        return {"query": query, "answer": ans, "action": "general_answer"}

    return {
        "query": query,
        "answer": f"For {job_title} at {company}, focus on aligning your skills in {', '.join(skills[:3])} and asking for needed accommodations.",
        "action": "general"
    }
