import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";

/**
 * Health & AI Connection Service for Saarthi FastAPI Backend
 */
export async function checkBackendHealth() {
  try {
    const data = await api.get(ENDPOINTS.HEALTH);
    return {
      status: "connected",
      data,
    };
  } catch (error) {
    return {
      status: "disconnected",
      error: error.message || "Backend service is unavailable.",
    };
  }
}

export async function testAiConnection() {
  try {
    const data = await api.get(ENDPOINTS.AI_TEST);
    return {
      status: "success",
      data,
    };
  } catch (error) {
    return {
      status: "error",
      error: error.message || "AI backend service failed test.",
    };
  }
}
