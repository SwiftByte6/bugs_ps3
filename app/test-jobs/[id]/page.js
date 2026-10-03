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

          {/* Realistic Application Form for Testing Extension Autofill (Requirement 5, 6, 8, 9) */}
          <div id="application-form-section" className="pt-6 border-t border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Apply for this Role
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Test portal application form. You can use the Saarthi Extension popup to audit and safely fill verified fields.
            </p>

            <form
              id="job-application-form"
              className="space-y-4 bg-gray-50 p-6 rounded-lg border border-gray-200"
              action="#"
            >
              {/* Safe Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="applicant_name" className="block text-xs font-semibold text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="applicant_name"
                    name="applicant_name"
                    required
                    placeholder="e.g. Alex Sharma"
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label htmlFor="applicant_email" className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="applicant_email"
                    name="applicant_email"
                    required
                    placeholder="e.g. alex@example.com"
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label htmlFor="applicant_phone" className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="applicant_phone"
                    name="applicant_phone"
                    required
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label htmlFor="applicant_location" className="block text-xs font-semibold text-gray-700 mb-1">
                    Current Location
                  </label>
                  <input
                    type="text"
                    id="applicant_location"
                    name="applicant_location"
                    placeholder="e.g. Mumbai, India"
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label htmlFor="applicant_linkedin" className="block text-xs font-semibold text-gray-700 mb-1">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    id="applicant_linkedin"
                    name="applicant_linkedin"
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label htmlFor="applicant_portfolio" className="block text-xs font-semibold text-gray-700 mb-1">
                    Portfolio / Website URL
                  </label>
                  <input
                    type="url"
                    id="applicant_portfolio"
                    name="applicant_portfolio"
                    placeholder="https://portfolio.dev"
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label htmlFor="applicant_education" className="block text-xs font-semibold text-gray-700 mb-1">
                    Highest Education / Degree
                  </label>
                  <input
                    type="text"
                    id="applicant_education"
                    name="applicant_education"
                    placeholder="e.g. B.Tech in Computer Science"
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label htmlFor="applicant_skills" className="block text-xs font-semibold text-gray-700 mb-1">
                    Key Technical Skills
                  </label>
                  <input
                    type="text"
                    id="applicant_skills"
                    name="applicant_skills"
                    placeholder="e.g. Python, React, FastAPI, SQL"
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Sensitive / Ambiguous Fields - Left for Explicit User Input */}
              <div className="pt-3 border-t border-gray-200 space-y-3">
                <div className="p-2.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-1.5">
                  <span>🔒 Sensitive/custom questions below require manual confirmation before submission.</span>
                </div>

                <div>
                  <label htmlFor="expected_salary" className="block text-xs font-semibold text-gray-700 mb-1">
                    Expected Salary (Annual INR)
                  </label>
                  <input
                    type="text"
                    id="expected_salary"
                    name="expected_salary"
                    placeholder="e.g. Rs. 8,00,000"
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label htmlFor="accommodation_request" className="block text-xs font-semibold text-gray-700 mb-1">
                    Workplace / Interview Accommodation Request (Optional)
                  </label>
                  <textarea
                    id="accommodation_request"
                    name="accommodation_request"
                    rows="2"
                    placeholder="Describe any assistive technology or interview accommodations you require..."
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  ></textarea>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  id="btn-submit-application"
                  className="px-6 py-2 bg-purple-700 hover:bg-purple-800 text-white text-sm font-semibold rounded-md transition-colors"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>

          <div className="pt-4 border-t border-gray-100 text-xs text-gray-400">
            Job Reference ID: <span className="job-id-text font-mono">{job.id}</span>
          </div>
        </section>
      </article>
    </main>
  );
}

