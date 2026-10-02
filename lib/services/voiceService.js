import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";

/**
 * Voice & Speech Interaction Service connecting to Saarthi FastAPI backend
 */
export async function parseVoiceIntent(transcriptionText, context = {}) {
  try {
    return await api.post(ENDPOINTS.VOICE_INTENT, {
      transcript: transcriptionText,
      current_page: context.current_page || typeof window !== "undefined" ? window.location.pathname : "/dashboard",
      current_job: context.current_job || null,
    });
  } catch (error) {
    console.warn("Voice Intent parsing fallback triggered:", error.message);

    // Rule-based fallback client parser if backend is offline
    const text = (transcriptionText || "").toLowerCase().trim();
    if (text.includes("stop") || text.includes("halt")) {
      return { status: "success", data: { intent: "STOP", description: "Immediately stop active speech and automated actions." } };
    }
    if (text.includes("cancel")) {
      return { status: "success", data: { intent: "CANCEL", description: "Cancel current action or application flow." } };
    }
    if (text.includes("approve") || text.includes("yes") || text.includes("proceed")) {
      return { status: "success", data: { intent: "APPROVE", description: "Confirm and approve current action." } };
    }
    if (text.includes("fill safe")) {
      return { status: "success", data: { intent: "FILL_SAFE_FIELDS", description: "Automatically populate all verified safe fields." } };
    }
    if (text.includes("find") || text.includes("search")) {
      const query = text.replace(/^(find|search)\s+(for\s+)?/, "").trim();
      return { status: "success", data: { intent: "SEARCH_JOBS", search_query: query || "frontend" } };
    }
    if (text.includes("explain")) {
      return { status: "success", data: { intent: "EXPLAIN_QUESTION", description: "Explain active question or requirement." } };
    }
    if (text.includes("read")) {
      return { status: "success", data: { intent: "READ_PAGE", description: "Read main screen content." } };
    }

    return {
      status: "success",
      data: {
        intent: "GENERAL_QUERY",
        transcript: transcriptionText,
        description: "General query or ambiguous voice command.",
      },
    };
  }
}

export async function transcribeAudio(audioFileOrBlob) {
  try {
    const formData = new FormData();
    formData.append("file", audioFileOrBlob);
    return await api.upload(ENDPOINTS.VOICE_TRANSCRIBE, formData);
  } catch (error) {
    console.warn("Voice Transcription backend fallback triggered:", error.message);
    return {
      status: "error",
      text: "",
      error: error.message,
    };
  }
}

export async function executeVoiceCommand(transcriptionText, context = {}) {
  try {
    return await api.post(ENDPOINTS.VOICE_COMMAND, {
      transcript: transcriptionText,
      current_page: context.current_page || "/dashboard",
      current_job: context.current_job || null,
    });
  } catch (error) {
    console.warn("Voice Command execution fallback triggered:", error.message);
    const parsed = await parseVoiceIntent(transcriptionText, context);
    const intentData = parsed.data || {};
    return {
      status: "success",
      data: {
        transcript: transcriptionText,
        intent: intentData.intent || "GENERAL_QUERY",
        response_text: intentData.description || `Executed ${transcriptionText}`,
        speech_announcement: intentData.description || `Command ${transcriptionText} processed.`,
        immediate_stop: intentData.intent === "STOP",
      },
    };
  }
}
