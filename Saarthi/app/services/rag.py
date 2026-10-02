import logging
import os
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np
import faiss
from app.services.embeddings import compute_embedding, compute_embeddings
from app.llm.client import LLMClient

logger = logging.getLogger("app.rag")


class StaticRAG:
    def __init__(self, knowledge_dir: str = "data/knowledge"):
        self.knowledge_dir = Path(knowledge_dir)
        self.dimension = 384
        self.index = faiss.IndexFlatIP(self.dimension)
        self.chunks: List[Dict[str, str]] = []  # {"source": filename, "text": chunk_text}
        self.is_indexed = False

    def build_index(self, force_rebuild: bool = False) -> int:
        """Load markdown files from knowledge base, chunk them, embed, and store in FAISS."""
        if self.is_indexed and not force_rebuild:
            return len(self.chunks)

        if not self.knowledge_dir.exists():
            logger.warning(f"Knowledge directory {self.knowledge_dir} does not exist.")
            return 0

        self.index.reset()
        self.chunks = []

        md_files = list(self.knowledge_dir.glob("*.md"))
        if not md_files:
            logger.warning("No markdown documents found in knowledge directory.")
            return 0

        raw_chunks = []
        for file_path in md_files:
            source_name = file_path.name
            try:
                content = file_path.read_text(encoding="utf-8")
                # Split by headers (## or #) or paragraphs
                sections = content.split("\n## ")
                for i, sec in enumerate(sections):
                    cleaned = sec.strip()
                    if cleaned:
                        if i > 0:
                            cleaned = "## " + cleaned
                        raw_chunks.append({
                            "source": source_name,
                            "text": cleaned
                        })
            except Exception as e:
                logger.error(f"Error reading {file_path}: {e}")

        if not raw_chunks:
            return 0

        self.chunks = raw_chunks
        texts_to_embed = [c["text"] for c in self.chunks]
        emb_matrix = compute_embeddings(texts_to_embed)

        self.index.add(emb_matrix.astype(np.float32))
        self.is_indexed = True
        logger.info(f"Indexed {len(self.chunks)} chunks from {len(md_files)} knowledge docs in FAISS.")
        return len(self.chunks)

    def retrieve(self, query: str, top_k: int = 3, threshold: float = 0.25) -> List[Dict[str, Any]]:
        """Retrieve top-k relevant chunks for a query from FAISS."""
        if not self.is_indexed:
            self.build_index()

        if self.index.ntotal == 0:
            return []

        query_emb = compute_embedding(query).reshape(1, -1).astype(np.float32)
        k = min(top_k, self.index.ntotal)
        distances, indices = self.index.search(query_emb, k)

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            score = float(dist)
            if score >= threshold and idx < len(self.chunks):
                item = dict(self.chunks[idx])
                item["score"] = round(score, 3)
                results.append(item)

        return results

    async def answer_query(
        self,
        query: str,
        llm_client: LLMClient,
        top_k: int = 3
    ) -> Dict[str, Any]:
        """Grounded QA: Retrieve chunks -> Prompt Qwen3.8 27B -> Grounded Answer with sources."""
        retrieved = self.retrieve(query, top_k=top_k)

        if not retrieved:
            return {
                "query": query,
                "answer": "I do not have enough information in the accessibility knowledge base to answer this question accurately.",
                "sources": [],
                "retrieved_chunks": []
            }

        context_blocks = []
        sources = []
        for r in retrieved:
            context_blocks.append(f"[Source: {r['source']}]\n{r['text']}")
            if r["source"] not in sources:
                sources.append(r["source"])

        context_str = "\n\n---\n\n".join(context_blocks)

        prompt = (
            "You are an accessibility expert assisting job candidates with disabilities. "
            "Answer the question using ONLY the provided knowledge context. "
            "If the context does not contain enough information, state clearly that you do not have enough information. "
            "Be concise, clear, and direct.\n\n"
            f"Context:\n{context_str}\n\n"
            f"Question: {query}\n\n"
            "Answer:"
        )

        system_prompt = (
            "You are a strict, grounded accessibility knowledge assistant. "
            "Rely strictly on the provided context."
        )

        answer = await llm_client.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.1,
            max_tokens=400
        )

        return {
            "query": query,
            "answer": answer,
            "sources": sources,
            "retrieved_chunks": retrieved
        }


static_rag = StaticRAG()
