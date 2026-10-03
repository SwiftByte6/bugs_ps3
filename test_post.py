import json
import urllib.request

payload = {
    "source": "test_job_portal",
    "page_url": "http://localhost:3000/test-jobs",
    "jobs": [
        {
            "id": "job-001",
            "title": "Senior Accessibility Specialist",
            "company": "EquiTech Global",
            "location": "Remote",
            "employment_type": "Full-time",
            "skills": ["WCAG 2.2", "React", "Screen Readers"],
            "description": "Lead web accessibility audits and assistive tech integrations."
        },
        {
            "id": "job-002",
            "title": "Frontend Accessibility Engineer",
            "company": "AccessFlow Systems",
            "location": "Bengaluru (Hybrid)",
            "employment_type": "Full-time",
            "skills": ["React", "TypeScript", "ARIA"],
            "description": "Develop accessible web components with full screen reader and keyboard support."
        }
    ]
}

data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(
    "http://localhost:3000/api/jobs/extension-ingest",
    data=data,
    headers={"Content-Type": "application/json"}
)

with urllib.request.urlopen(req) as resp:
    print(resp.read().decode("utf-8"))
