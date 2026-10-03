import Link from "next/link";
import { notFound } from "next/navigation";

const JOBS_MAP = {
  "job-001": {
    id: "job-001",
    title: "Software Engineer",
    company: "TechNova Solutions",
    location: "Mumbai, India",
    employmentType: "Full-time",
    experience: "0–2 years",
    skills: ["Python", "React", "FastAPI", "Git"],
    description: "TechNova Solutions is looking for a Software Engineer to build web applications and backend services. You will collaborate with cross-functional teams to design, develop, and maintain high-volume distributed systems.",
  },
  "job-002": {
    id: "job-002",
    title: "Frontend Developer",
    company: "PixelWorks",
    location: "Bangalore, India",
    employmentType: "Full-time",
    experience: "1–3 years",
    skills: ["React", "JavaScript", "HTML", "CSS"],
    description: "PixelWorks is seeking a skilled Frontend Developer to craft responsive, accessible user interfaces. You will implement WCAG compliant components and optimize page rendering performance.",
  },
  "job-003": {
    id: "job-003",
    title: "Backend Developer",
    company: "CloudCore",
    location: "Remote, India",
    employmentType: "Full-time",
    experience: "2–4 years",
    skills: ["Python", "FastAPI", "PostgreSQL", "Docker"],
    description: "CloudCore is hiring a Backend Developer to design scalable REST APIs, microservices, and database pipelines with automated container deployments.",
  },
  "job-004": {
    id: "job-004",
    title: "UI/UX Designer",
    company: "DesignHub",
    location: "Mumbai, India",
    employmentType: "Full-time",
    experience: "1–3 years",
    skills: ["Figma", "UI Design", "UX Research"],
    description: "DesignHub is looking for an empathetic UI/UX Designer dedicated to accessible and intuitive digital experiences. You will create design systems and wireframes.",
  },
  "job-005": {
    id: "job-005",
    title: "Data Analyst",
    company: "DataSphere",
    location: "Pune, India",
    employmentType: "Full-time",
    experience: "0–2 years",
    skills: ["Python", "SQL", "Power BI", "Excel"],
    description: "DataSphere is seeking a Data Analyst to extract insights, create interactive dashboards, and drive business decisions using modern analytical tools.",
  },
};

export async function generateMetadata({ params }) {
  const { id } = await params;
  const job = JOBS_MAP[id];
  if (!job) return { title: "Job Not Found" };
  return {
    title: `${job.title} at ${job.company} — TechCareers Test Portal`,
  };
}

export default async function TestJobDetailPage({ params }) {
  const { id } = await params;
  const job = JOBS_MAP[id];

  if (!job) {
    notFound();
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 w-full">
      <nav className="mb-6">
        <Link
          href="/test-jobs"
          className="text-sm font-medium text-purple-700 hover:text-purple-900 inline-flex items-center gap-1"
        >
          ← Back to all test jobs
        </Link>
      </nav>

      <article
        className="job-detail-card bg-white border border-gray-200 rounded-lg p-8 shadow-xs"
        data-job-id={job.id}
      >
        <header className="border-b border-gray-200 pb-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="job-title text-2xl md:text-3xl font-bold text-gray-900">
                {job.title}
              </h1>
              <div className="company text-lg font-medium text-gray-700 mt-2">
                {job.company}
              </div>
              <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm text-gray-600 mt-3">
                <div className="location">📍 {job.location}</div>
                <div className="employment-type">💼 {job.employmentType}</div>
                <div className="experience">⏳ {job.experience}</div>
              </div>
            </div>

            <button
              type="button"
              className="apply-button inline-flex items-center justify-center px-6 py-2.5 text-base font-medium text-white bg-purple-700 hover:bg-purple-800 rounded-md transition-colors shrink-0 shadow-xs cursor-pointer"
              onClick={undefined}
            >
              Apply Now
            </button>
          </div>
        </header>

        <section className="space-y-6">
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Role Overview
            </h2>
            <div className="description text-base text-gray-700 leading-relaxed">
              {job.description}
            </div>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-3">
              Required Skills & Technologies
            </h2>
            <div className="skills flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <span
                  key={skill}
                  className="skill inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-800 border border-purple-100"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 text-xs text-gray-400">
            Job Reference ID: <span className="job-id-text font-mono">{job.id}</span>
          </div>
        </section>
      </article>
    </main>
  );
}
