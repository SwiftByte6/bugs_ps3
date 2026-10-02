import asyncio
from app.services.rag import static_rag
from app.llm.client import LLMClient


def test_static_rag_retrieval_and_sources():
    # Ensure index is built
    count = static_rag.build_index()
    assert count > 0, "Static RAG must index knowledge markdown files"
    assert static_rag.index.ntotal > 0

    llm = LLMClient()
    query = "What is keyboard navigation?"
    res = asyncio.run(static_rag.answer_query(query, llm_client=llm))

    assert res["query"] == query
    assert len(res["answer"]) > 20
    assert len(res["sources"]) >= 1
    assert any("keyboard_navigation.md" in s for s in res["sources"])
    assert len(res["retrieved_chunks"]) >= 1


def test_static_rag_unsupported_query():
    llm = LLMClient()
    query = "How do I bake a chocolate chip cookie in an oven?"
    # Irrelevant query
    res = asyncio.run(static_rag.answer_query(query, llm_client=llm))
    if not res["sources"]:
        assert "not have enough information" in res["answer"].lower()
