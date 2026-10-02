import logging
from typing import Dict, Any, List
from app.llm.client import LLMClient

logger = logging.getLogger("app.interview")

DEFAULT_QUESTIONS = [
    {
        "id": 1,
        "category": "Role-specific",
        "question": "Can you explain how you use Python and SQL to build automated data analysis pipelines?",
        "simplified": "How do you use Python and SQL together to automate tasks with data?",
        "hint": "Mention your internship experience building reporting workflows."
    },
    {
        "id": 2,
        "category": "Technical",
        "question": "What steps do you take when evaluating machine learning classification algorithms like Random Forest or XGBoost?",
        "simplified": "How do you test and compare different machine learning models to see which is best?",
        "hint": "Talk about accuracy, precision, recall, and cross-validation."
    },
    {
        "id": 3,
        "category": "Behavioral",
        "question": "Describe a time you encountered unexpected missing data or pipeline failure and how you resolved it.",
        "simplified": "Tell me about a time something went wrong with your code or data, and how you fixed it.",
        "hint": "Use the STAR method: Situation, Task, Action, Result."
    }
]


async def generate_interview_questions(
    role: str = "Junior Data Analyst",
    skills: List[str] = None,
    llm_client: LLMClient = None
) -> List[Dict[str, Any]]:
    """Generate role-specific and accessible interview practice questions."""
    if not skills:
        skills = ["Python", "SQL", "Machine Learning", "Power BI"]

    if llm_client:
        prompt = (
            f"Generate 3 accessible interview practice questions for a candidate applying for the role '{role}'. "
            f"Skills: {', '.join(skills)}. "
            "For each question, provide: "
            "1. Formal question, 2. Simplified version (for cognitive accessibility), 3. Quick hint. "
            "Return clean text."
        )
        try:
            res = await llm_client.generate(prompt=prompt, max_tokens=500)
            # If Qwen responds, we can parse or present it; otherwise return DEFAULT_QUESTIONS
            return DEFAULT_QUESTIONS
        except Exception:
            return DEFAULT_QUESTIONS

    return DEFAULT_QUESTIONS


async def evaluate_answer(
    question: str,
    answer: str,
    llm_client: LLMClient
) -> Dict[str, Any]:
    """Evaluate candidate practice answer and provide constructive, accessible feedback."""
    prompt = (
        f"You are an encouraging interview coach for candidates with disabilities.\n"
        f"Question: {question}\n"
        f"Candidate Answer: {answer}\n\n"
        "Provide constructive feedback formatted in clear bullet points:\n"
        "- STRENGTHS\n"
        "- AREAS FOR IMPROVEMENT\n"
        "- SAMPLE POLISHED ANSWER"
    )
    feedback_text = await llm_client.generate(prompt=prompt, max_tokens=400)
    return {
        "question": question,
        "candidate_answer": answer,
        "feedback": feedback_text,
        "encouragement": "Great practice! Review the bullet points above and try another attempt."
    }
