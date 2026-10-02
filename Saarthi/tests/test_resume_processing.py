import asyncio
from pathlib import Path
from app.services.resume import extract_text_from_pdf, clean_text, process_resume


def test_sample_resume_extraction():
    sample_pdf = Path("data/demo/sample_resume.pdf")
    assert sample_pdf.exists(), "Sample resume PDF must exist at data/demo/sample_resume.pdf"

    # Step 1: PDF successfully opened and text extracted
    raw_text = extract_text_from_pdf(str(sample_pdf))
    assert len(raw_text) > 100, "Raw extracted text should not be empty"

    # Step 2: Text cleaning
    cleaned = clean_text(raw_text)
    assert "Test User" in cleaned

    # Step 3: Structured profile generation
    profile = asyncio.run(process_resume(str(sample_pdf)))
    assert isinstance(profile, dict), "Profile should be a structured JSON dictionary"

    # Step 4: Compare expected fields against actual extracted fields
    assert profile.get("name") == "Test User", f"Expected 'Test User', got {profile.get('name')}"
    assert profile.get("email") == "test@example.com", f"Expected 'test@example.com', got {profile.get('email')}"
    assert "+91 9000000000" in profile.get("phone", ""), f"Expected phone, got {profile.get('phone')}"

    # Skills verification
    extracted_skills = [s.lower() for s in profile.get("skills", {}).get("all_skills", [])]
    expected_skills = ["python", "sql", "machine learning", "power bi"]
    for expected in expected_skills:
        assert any(expected in s for s in extracted_skills), f"Skill '{expected}' not detected in {extracted_skills}"

    # Education verification
    edu = profile.get("education", [])
    assert len(edu) >= 1, "Expected at least 1 education entry"
    assert "B.Tech" in edu[0].get("degree", "")

    # Experience verification
    exp = profile.get("experience", [])
    assert len(exp) >= 1, "Expected at least 1 experience entry"
    assert "Data Analyst Intern" in exp[0].get("role", "")

    # Projects verification
    proj = profile.get("projects", [])
    assert len(proj) >= 2, f"Expected at least 2 projects, got {len(proj)}"
    proj_titles = [p.get("title") for p in proj]
    assert any("Data Analytics Dashboard" in t for t in proj_titles)
    assert any("Machine Learning Classification" in t for t in proj_titles)

    # Links verification
    assert "linkedin.com/in/testuser" in profile.get("linkedin", "")
    assert "github.com/testuser" in profile.get("github", "")
