from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from app.services.interview import generate_interview_questions, evaluate_answer
from app.llm.client import LLMClient

router = APIRouter(prefix="/api/interview", tags=["Interview Prep"])
llm_client = LLMClient()


class InterviewQuestionsRequest(BaseModel):
    role: Optional[str] = "Junior Data Analyst"
    skills: Optional[List[str]] = None


class EvaluateAnswerRequest(BaseModel):
    question: str
    answer: str


@router.post("/questions")
async def get_practice_questions(req: InterviewQuestionsRequest):
    questions = await generate_interview_questions(
        role=req.role or "Junior Data Analyst",
        skills=req.skills,
        llm_client=llm_client
    )
    return {
        "status": "success",
        "role": req.role,
        "questions": questions
    }


@router.post("/evaluate")
async def evaluate_interview_response(req: EvaluateAnswerRequest):
    evaluation = await evaluate_answer(
        question=req.question,
        answer=req.answer,
        llm_client=llm_client
    )
    return {
        "status": "success",
        "data": evaluation
    }
