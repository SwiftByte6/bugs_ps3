import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";

/**
 * RAG Knowledge Base Service connecting to Saarthi FastAPI backend
 */
export async function queryRagKnowledgeBase(queryText, userId = null) {
  try {
    return await api.post(ENDPOINTS.RAG_QUERY, {
      query: queryText,
      user_id: userId,
    });
  } catch (error) {
    console.warn("RAG query fallback triggered:", error.message);
    return {
      answer: "I couldn't reach the RAG knowledge base service at this moment.",
      sources: [],
      error: error.message,
    };
  }
}

export async function getRagStatus() {
  try {
    return await api.get(ENDPOINTS.RAG_STATUS);
  } catch (error) {
    return {
      status: "unavailable",
      documents_indexed: 0,
    };
  }
}
