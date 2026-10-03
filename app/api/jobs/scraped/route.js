import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const FASTAPI_URL = process.env.NEXT_PUBLIC_SAARTHI_API_URL || "http://127.0.0.1:8000";

export async function GET() {
  try {
    const res = await fetch(`${FASTAPI_URL}/api/jobs/scraped`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    // FastAPI fallback
  }

  // Fallback to reading disk data/scraped_jobs.json directly if present
  try {
    const possiblePaths = [
      path.join(process.cwd(), "Saarthi", "data", "scraped_jobs.json"),
      path.join(process.cwd(), "..", "Saarthi", "data", "scraped_jobs.json"),
      path.join(process.cwd(), "data", "scraped_jobs.json"),
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, "utf-8");
        const jobs = JSON.parse(content);
        return NextResponse.json({ status: "success", count: jobs.length, jobs });
      }
    }
  } catch (e) {
    // ignore
  }

  return NextResponse.json({ status: "success", count: 0, jobs: [] });
}
