import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";

const MOCK_JOBS = [
  {
    id: "job_101",
    company: "TechAccess Solutions",
    title: "Senior Frontend Developer (WCAG Focus)",
    location: "Mumbai, India",
    work_mode: "Remote",
    type: "Full-time",
    salary: "₹18,000,000 - ₹25,000,000 / yr",
    match_percentage: 95,
    skills: ["React", "Next.js", "JavaScript", "WCAG 2.1", "Tailwind CSS"],
    matched_skills: ["React", "Next.js", "JavaScript", "Tailwind CSS"],
    missing_skills: ["WCAG 2.1 Audit"],
    simplified_summary:
      "Build accessible web apps for healthcare & education. Full keyboard nav & screen reader support required.",
    description:
      "We are seeking a passionate Senior Frontend Engineer with strong expertise in building accessible React and Next.js applications. You will work closely with our accessibility taskforce to ensure every workflow is WCAG 2.1 AAA compliant.",
  },
  {
    id: "job_102",
    company: "InclusionLabs Inc.",
    title: "Accessibility UI Developer",
    location: "Bengaluru, India",
    work_mode: "Hybrid",
    type: "Full-time",
    salary: "₹15,000,000 - ₹20,000,000 / yr",
    match_percentage: 91,
    skills: ["React", "JavaScript", "ARIA", "Tailwind CSS", "TypeScript"],
    matched_skills: ["React", "JavaScript", "Tailwind CSS"],
    missing_skills: ["TypeScript"],
    simplified_summary:
      "Design and maintain accessible UI component systems. Focus on color contrast and keyboard focus traps.",
    description:
      "InclusionLabs is creating inclusive hiring software. As an Accessibility UI Developer, you will construct reusable React components with robust focus management, ARIA landmarks, and keyboard shortcuts.",
  },
  {
    id: "job_103",
    company: "Global Workforce Tech",
    title: "Frontend Engineer (Design Systems)",
    location: "Delhi NCR, India",
    work_mode: "Remote",
    type: "Full-time",
    salary: "₹16,000,000 - ₹22,000,000 / yr",
    match_percentage: 88,
    skills: ["React", "Next.js", "JavaScript", "HTML5", "CSS3"],
    matched_skills: ["React", "Next.js", "JavaScript"],
    missing_skills: ["CSS Grid Expert"],
    simplified_summary:
      "Craft clean, high-performance web components for global workforce portals with instant keyboard responsiveness.",
    description:
      "Join our core design systems engineering team to build light, high-performance user interfaces used by millions of job seekers around the globe.",
  },
  {
    id: "job_104",
    company: "Kitakita Crew Ltd.",
    title: "Junior Web Accessibility Developer",
    location: "Pune, India",
    work_mode: "On-site",
    type: "Full-time",
    salary: "₹10,000,000 - ₹14,000,000 / yr",
    match_percentage: 84,
    skills: ["JavaScript", "HTML5", "CSS3", "React"],
    matched_skills: ["JavaScript", "React"],
    missing_skills: ["Automated Testing"],
    simplified_summary:
      "Assist in auditing existing customer portals for screen-reader readability and visual contrast compliance.",
    description:
      "An entry-to-mid level role focusing on accessibility remediation, semantic HTML validation, and interactive keyboard widget testing.",
  },
  {
    id: "job_105",
    company: "Madju Djaja Studios",
    title: "Full Stack Engineer (Node & React)",
    location: "Hyderabad, India",
    work_mode: "Remote",
    type: "Full-time",
    salary: "₹20,000,000 - ₹28,000,000 / yr",
    match_percentage: 78,
    skills: ["Node.js", "React", "JavaScript", "Supabase", "PostgreSQL"],
    matched_skills: ["React", "JavaScript", "Supabase"],
    missing_skills: ["PostgreSQL Schema Optimization"],
    simplified_summary:
      "Develop end-to-end features connecting React frontends to real-time Node and Supabase databases.",
    description:
      "Looking for a versatile Full Stack Developer to build resilient web features, implement API integrations, and maintain seamless authentication routines.",
  },
];

/**
 * Get jobs list (tries FastAPI catalog / search endpoints first, then fallback mock)
 */
export async function getJobs(filterSkill = null) {
  try {
    const catalog = await api.get(ENDPOINTS.JOBS_CATALOG);
    if (Array.isArray(catalog) && catalog.length > 0) {
      if (!filterSkill || filterSkill === "All") return catalog;
      return catalog.filter(
        (job) =>
          (job.skills && job.skills.some((s) => s.toLowerCase().includes(filterSkill.toLowerCase()))) ||
          (job.work_mode && job.work_mode.toLowerCase() === filterSkill.toLowerCase())
      );
    }
  } catch (err) {
    // Backend catalog endpoint failed or unreachable
  }

  // Fallback Mock Jobs
  if (!filterSkill || filterSkill === "All") {
    return MOCK_JOBS;
  }

  return MOCK_JOBS.filter(
    (job) =>
      job.skills.some((s) => s.toLowerCase().includes(filterSkill.toLowerCase())) ||
      job.work_mode.toLowerCase() === filterSkill.toLowerCase()
  );
}

/**
 * Search jobs using FastAPI search endpoint
 */
export async function searchJobs(queryText, options = {}) {
  try {
    const results = await api.post(ENDPOINTS.JOBS_SEARCH, {
      query: queryText,
      ...options,
    });
    if (Array.isArray(results)) return results;
    if (results && Array.isArray(results.jobs)) return results.jobs;
  } catch (err) {
    console.warn("FastAPI job search fallback triggered:", err.message);
  }
  return getJobs(queryText);
}

/**
 * Get single job by ID
 */
export async function getJobById(jobId) {
  const jobs = await getJobs();
  return jobs.find((j) => String(j.id) === String(jobId)) || MOCK_JOBS[0];
}

/**
 * Match a job against a user profile using Saarthi backend matching service
 */
export async function matchJob(jobData, profileData) {
  try {
    const response = await api.post(ENDPOINTS.JOBS_MATCH, {
      job: jobData,
      profile: profileData,
    });
    if (response && typeof response.match_percentage === "number") {
      return response;
    }
  } catch (err) {
    console.warn("FastAPI job match fallback triggered:", err.message);
  }

  // Fallback match logic
  const userSkills = profileData?.skills || ["React", "Next.js", "JavaScript", "Tailwind CSS"];
  const jobSkills = jobData?.skills || [];
  const matchedSkills = jobSkills.filter((s) =>
    userSkills.some((us) => us.toLowerCase() === s.toLowerCase())
  );
  const missingSkills = jobSkills.filter(
    (s) => !userSkills.some((us) => us.toLowerCase() === s.toLowerCase())
  );

  const percentage = jobSkills.length > 0
    ? Math.round((matchedSkills.length / jobSkills.length) * 100)
    : 85;

  return {
    match_percentage: percentage,
    matched_skills: matchedSkills,
    missing_skills: missingSkills,
  };
}

/**
 * Simplify a job description using Saarthi backend AI simplification
 */
export async function simplifyJobDescription(descriptionText) {
  try {
    const response = await api.post(ENDPOINTS.JOBS_SIMPLIFY, {
      description: descriptionText,
    });
    if (response && (response.simplified || response.summary)) {
      return response.simplified || response.summary;
    }
  } catch (err) {
    console.warn("FastAPI job simplify fallback triggered:", err.message);
  }
  return descriptionText ? descriptionText.slice(0, 200) + "..." : "No description available.";
}

/**
 * Explain a technical term in simple language
 */
export async function explainJobTerm(termString, context = "") {
  try {
    return await api.post(ENDPOINTS.JOBS_EXPLAIN_TERM, {
      term: termString,
      context,
    });
  } catch (err) {
    return {
      term: termString,
      explanation: `"${termString}" is a industry term. (Backend offline for AI explanation)`,
    };
  }
}

/**
 * Simplify an interview or application question
 */
export async function simplifyQuestion(questionText) {
  try {
    return await api.post(ENDPOINTS.JOBS_SIMPLIFY_QUESTION, {
      question: questionText,
    });
  } catch (err) {
    return {
      question: questionText,
      simplified_question: questionText,
    };
  }
}

/**
 * Query Saarthi Job Assistant
 */
export async function queryJobAssistant(queryText, jobContext = {}) {
  try {
    return await api.post(ENDPOINTS.JOBS_ASSISTANT, {
      query: queryText,
      context: jobContext,
    });
  } catch (err) {
    return {
      reply: "I'm having trouble connecting to Saarthi AI assistant right now.",
      error: err.message,
    };
  }
}
