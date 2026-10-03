import Link from "next/link";

export const metadata = {
  title: "Test Job Portal — Saarthi Extension Test Bench",
  description: "Realistic job portal page for testing DOM scraping by the Saarthi Chrome Extension.",
};

const TEST_JOBS = [
  {
    id: "job-001",
    title: "Software Engineer",
    company: "TechNova Solutions",
    location: "Mumbai, India",
    employmentType: "Full-time",
    experience: "0–2 years",
    skills: ["Python", "React", "FastAPI", "Git"],
    description: "TechNova Solutions is looking for a Software Engineer to build web applications and backend services.",
  },
  {
    id: "job-002",
    title: "Frontend Developer",
    company: "PixelWorks",
    location: "Bangalore, India",
    employmentType: "Full-time",
    experience: "1–3 years",
    skills: ["React", "JavaScript", "HTML", "CSS"],
    description: "PixelWorks is seeking a skilled Frontend Developer to craft responsive, accessible user interfaces.",
  },
  {
    id: "job-003",
    title: "Backend Developer",
    company: "CloudCore",
    location: "Remote, India",
    employmentType: "Full-time",
    experience: "2–4 years",
    skills: ["Python", "FastAPI", "PostgreSQL", "Docker"],
    description: "CloudCore is hiring a Backend Developer to design scalable REST APIs, microservices, and database pipelines.",
  },
  {
    id: "job-004",
    title: "UI/UX Designer",
    company: "DesignHub",
    location: "Mumbai, India",
    employmentType: "Full-time",
    experience: "1–3 years",
    skills: ["Figma", "UI Design", "UX Research"],
    description: "DesignHub is looking for an empathetic UI/UX Designer dedicated to accessible and intuitive digital experiences.",
  },
  {
    id: "job-005",
    title: "Data Analyst",
    company: "DataSphere",
    location: "Pune, India",
    employmentType: "Full-time",
    experience: "0–2 years",
    skills: ["Python", "SQL", "Power BI", "Excel"],
    description: "DataSphere is seeking a Data Analyst to extract insights, create interactive dashboards, and drive business decisions.",
  },
];

export default function TestJobsListingPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8 w-full">
      <header className="mb-8 border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              TechCareers Test Job Portal
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Local testing sandbox for DOM job extraction & extension scraping.
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
            5 Openings Available
          </span>
        </div>
      </header>

      <section className="space-y-6" aria-label="Job Openings">
        {TEST_JOBS.map((job) => (
          <div
            key={job.id}
            className="job-card bg-white border border-gray-200 rounded-lg p-6 shadow-xs hover:border-gray-300 transition-colors"
            data-job-id={job.id}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h2 className="job-title text-xl font-semibold text-gray-900">
                  {job.title}
                </h2>
                <div className="company text-base font-medium text-gray-700 mt-1">
                  {job.company}
                </div>
                <div className="flex flex-wrap gap-y-1 gap-x-4 text-sm text-gray-500 mt-2">
                  <div className="location">📍 {job.location}</div>
                  <div className="employment-type">💼 {job.employmentType}</div>
                  <div className="experience">⏳ {job.experience}</div>
                </div>
              </div>
              <Link
                href={`/test-jobs/${job.id}`}
                className="job-link inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-purple-700 hover:bg-purple-800 rounded-md transition-colors shrink-0"
              >
                View Job
              </Link>
            </div>

            <div className="description text-sm text-gray-600 mt-4 line-clamp-2">
              {job.description}
            </div>

            <div className="skills flex flex-wrap gap-2 mt-4">
              {job.skills.map((skill) => (
                <span
                  key={skill}
                  className="skill inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
