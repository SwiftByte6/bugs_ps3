from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.rag import static_rag
from app.llm.client import LLMClient

router = APIRouter(prefix="/api/rag", tags=["Static RAG"])
llm_client = LLMClient()


class RAGQueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 3


@router.post("/query")
async def query_rag(req: RAGQueryRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query string cannot be empty.")
    result = await static_rag.answer_query(req.query, llm_client=llm_client, top_k=req.top_k or 3)
    return {
        "status": "success",
        "data": result
    }


@router.get("/status")
def get_rag_status():
    if not static_rag.is_indexed:
        static_rag.build_index()
    return {
        "status": "ready",
        "total_chunks_indexed": static_rag.index.ntotal,
        "knowledge_docs_count": len(list(static_rag.knowledge_dir.glob("*.md")))
    }
