import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const FASTAPI_URL = process.env.NEXT_PUBLIC_SAARTHI_API_URL || "http://127.0.0.1:8000";

function getScrapedJobsFile() {
  const possiblePaths = [
    path.join(process.cwd(), "Saarthi", "data", "scraped_jobs.json"),
    path.join(process.cwd(), "..", "Saarthi", "data", "scraped_jobs.json"),
    path.join(process.cwd(), "data", "scraped_jobs.json"),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(process.cwd(), "Saarthi", "data", "scraped_jobs.json");
}

export async function POST(req) {
  try {
    const body = await req.json();

    // 1. Forward to FastAPI backend if online (fire and forget)
    try {
      fetch(`${FASTAPI_URL}/api/jobs/extension-ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).catch(() => {});
    } catch (e) {
      // FastAPI unreachable
    }

    // 2. Direct local disk sync (always executed for instant dashboard sync)
    const targetFile = getScrapedJobsFile();
    fs.mkdirSync(path.dirname(targetFile), { recursive: true });

    let existingJobs = [];
    if (fs.existsSync(targetFile)) {
      try {
        existingJobs = JSON.parse(fs.readFileSync(targetFile, "utf-8"));
      } catch (e) {
        existingJobs = [];
      }
    }

    const incomingJobs = body.jobs || [];
    for (const j of incomingJobs) {
      const jobDict = {
        id: j.id || j.job_id || `scraped_${Date.now()}`,
        job_id: j.id || j.job_id || `scraped_${Date.now()}`,
        title: j.title || "Unknown Title",
        company: j.company || "Unknown Company",
        location: j.location || "",
        work_mode: (j.location || "").toLowerCase().includes("remote") ? "Remote" : "Full-time",
        type: j.employment_type || j.employmentType || "Full-time",
        employment_type: j.employment_type || j.employmentType || "Full-time",
        experience: j.experience || "",
        skills: j.skills || [],
        description: j.description || "",
        job_url: j.url || j.job_url || "",
        source: body.portal || body.source || "test_job_portal",
        scraped_at: j.scraped_at || new Date().toISOString(),
        match_percentage: 90,
        matched_skills: (j.skills || []).slice(0, 3),
        missing_skills: []
      };

      const existingIdx = existingJobs.findIndex(
        (ej) => ej.job_id === jobDict.job_id || (ej.title === jobDict.title && ej.company === jobDict.company)
      );
      if (existingIdx !== -1) {
        existingJobs[existingIdx] = jobDict;
      } else {
        existingJobs.unshift(jobDict);
      }
    }

    fs.writeFileSync(targetFile, JSON.stringify(existingJobs, null, 2), "utf-8");

    return NextResponse.json({
      status: "success",
      success: true,
      source: body.portal || body.source,
      received: incomingJobs.length,
      jobs_received: incomingJobs.length,
      jobs: incomingJobs
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
