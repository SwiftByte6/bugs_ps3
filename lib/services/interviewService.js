import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";

/**
 * AI Mock Interview Preparation Service connecting to Saarthi FastAPI backend
 */
export async function generateInterviewQuestions(jobTitle, jobDescription = "", profileData = {}) {
  try {
    return await api.post(ENDPOINTS.INTERVIEW_QUESTIONS, {
      job_title: jobTitle,
      job_description: jobDescription,
      profile: profileData,
    });
  } catch (error) {
    console.warn("Interview Question generation fallback triggered:", error.message);
    return {
      questions: [
        "Tell me about a time you implemented WCAG accessibility features in a React application.",
        "How do you ensure proper focus management when building interactive modals?",
        "Describe your experience using ARIA roles and keyboard navigation.",
      ],
      fallback: true,
      error: error.message,
    };
  }
}

export async function evaluateInterviewAnswer(questionText, answerText, jobContext = {}) {
  try {
    return await api.post(ENDPOINTS.INTERVIEW_EVALUATE, {
      question: questionText,
      answer: answerText,
      context: jobContext,
    });
  } catch (error) {
    console.warn("Interview Answer evaluation fallback triggered:", error.message);
    return {
      score: 80,
      feedback: "Good response highlighting core technical concepts.",
      suggestions: ["Mention explicit ARIA attributes and focus trap libraries if applicable."],
      fallback: true,
      error: error.message,
    };
  }
}
