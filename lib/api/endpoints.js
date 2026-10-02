export const ENDPOINTS = {
  // Core
  HEALTH: "/api/health",
  AI_TEST: "/api/ai/test",

  // Profile
  GET_PROFILE: "/api/profile",
  ONBOARDING: "/api/profile/onboarding",
  COMPLETENESS: "/api/profile/completeness",
  ACCESSIBILITY: "/api/profile/accessibility",
  RESUME_SECTION: "/api/profile/resume",
  BUILDER: "/api/profile/builder",

  // Resume
  RESUME_UPLOAD: "/api/resume/upload",
  RESUME_DEMO: "/api/resume/demo",

  // Jobs
  JOBS_PARSE: "/api/jobs/parse",
  JOBS_SIMPLIFY: "/api/jobs/simplify",
  JOBS_EXPLAIN_TERM: "/api/jobs/explain-term",
  JOBS_SIMPLIFY_QUESTION: "/api/jobs/simplify-question",
  JOBS_SEARCH: "/api/jobs/search",
  JOBS_CATALOG: "/api/jobs/catalog",
  JOBS_MATCH: "/api/jobs/match",
  JOBS_ASSISTANT: "/api/jobs/assistant-query",
  JOBS_DEMO: "/api/jobs/demo",

  // DOM & Smart Apply
  DOM_ANALYZE: "/api/dom/analyze",
  DOM_AUDIT: "/api/dom/audit",
  DOM_MAP_FIELDS: "/api/dom/map-fields",
  DOM_SUBMIT: "/api/dom/submit-application",
  DOM_DEMO_HTML: "/api/dom/demo-html",

  // Voice
  VOICE_INTENT: "/api/voice/intent",
  VOICE_TRANSCRIBE: "/api/voice/transcribe",
  VOICE_COMMAND: "/api/voice/command",

  // Vision
  VISION_STATUS: "/api/vision/status",
  VISION_PROCESS_EAR: "/api/vision/process-ear",
  VISION_CALCULATE_EAR: "/api/vision/calculate-ear",
  VISION_HEAD: "/api/vision/head-gesture",
  VISION_HAND: "/api/vision/hand-gesture",
  VISION_COMMAND: "/api/vision/command",

  // RAG
  RAG_QUERY: "/api/rag/query",
  RAG_STATUS: "/api/rag/status",

  // Tracker
  TRACKER: "/api/tracker",
  TRACKER_ITEM: (appId) => `/api/tracker/${appId}`,

  // Interview
  INTERVIEW_QUESTIONS: "/api/interview/questions",
  INTERVIEW_EVALUATE: "/api/interview/evaluate",
};
