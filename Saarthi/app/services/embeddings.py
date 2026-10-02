import logging
from typing import List, Union
import numpy as np

logger = logging.getLogger("app.embeddings")

_model = None


def get_embedding_model():
    """Lazily load and cache the SentenceTransformer model."""
    global _model
    if _model is None:
        logger.info("Loading SentenceTransformer model 'all-MiniLM-L6-v2'...")
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def compute_embedding(text: str) -> np.ndarray:
    """Compute normalized 1D embedding vector for a single string."""
    model = get_embedding_model()
    emb = model.encode(text, normalize_embeddings=True)
    return np.array(emb, dtype=np.float32)


def compute_embeddings(texts: List[str]) -> np.ndarray:
    """Compute normalized 2D embeddings matrix for multiple strings."""
    if not texts:
        return np.empty((0, 384), dtype=np.float32)
    model = get_embedding_model()
    embs = model.encode(texts, normalize_embeddings=True)
    return np.array(embs, dtype=np.float32)


def cosine_similarity(v1: np.ndarray, v2: np.ndarray) -> float:
    """Compute cosine similarity between two 1D or 2D vectors."""
    v1_flat = v1.flatten()
    v2_flat = v2.flatten()
    norm1 = np.linalg.norm(v1_flat)
    norm2 = np.linalg.norm(v2_flat)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(np.dot(v1_flat, v2_flat) / (norm1 * norm2))
