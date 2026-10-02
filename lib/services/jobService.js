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

export async function getJobs(filterSkill = null) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 150));

  if (!filterSkill || filterSkill === "All") {
    return MOCK_JOBS;
  }

  return MOCK_JOBS.filter(
    (job) =>
      job.skills.some((s) => s.toLowerCase().includes(filterSkill.toLowerCase())) ||
      job.work_mode.toLowerCase() === filterSkill.toLowerCase()
  );
}

export async function getJobById(jobId) {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return MOCK_JOBS.find((j) => j.id === jobId) || MOCK_JOBS[0];
}
