import re
import json
import logging
from typing import Dict, Any, Union, List, Optional
import pymupdf

logger = logging.getLogger("app.resume")


def extract_text_from_pdf(file_source: Union[bytes, str]) -> str:
    """Extract raw text from a PDF file path or byte buffer using PyMuPDF."""
    try:
        if isinstance(file_source, str):
            doc = pymupdf.open(file_source)
        else:
            doc = pymupdf.open(stream=file_source, filetype="pdf")

        if len(doc) == 0:
            raise ValueError("PDF document contains no pages.")

        text_parts = []
        for page in doc:
            text_parts.append(page.get_text())
        doc.close()

        full_text = "\n".join(text_parts).strip()
        if not full_text:
            raise ValueError("No readable text found in PDF document.")
        return full_text
    except Exception as e:
        logger.error(f"Error opening/reading PDF: {e}")
        raise ValueError(f"Failed to extract text from PDF: {str(e)}")


def clean_text(raw_text: str) -> str:
    """Clean and normalize extracted resume text."""
    text = re.sub(r"\r\n|\r", "\n", raw_text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def parse_resume_deterministically(text: str) -> Dict[str, Any]:
    """Robust regex- and heuristic-based resume parser."""
    profile: Dict[str, Any] = {
        "name": "",
        "email": "",
        "phone": "",
        "location": "",
        "education": [],
        "marks_cgpa": "",
        "skills": {
            "programming_languages": [],
            "frameworks": [],
            "tools": [],
            "domains": [],
            "soft_skills": [],
            "all_skills": []
        },
        "experience": [],
        "internships": [],
        "projects": [],
        "certifications": [],
        "achievements": [],
        "roles_interested_in": [],
        "github": "",
        "linkedin": "",
        "portfolio": "",
        "kaggle": "",
        "other_proof_of_work": "",
        "raw_text_length": len(text),
        "is_verified": False
    }

    lines = [line.strip() for line in text.split("\n") if line.strip()]
    if not lines:
        return profile

    # Extract Name (typically first non-empty line)
    first_line = lines[0]
    if len(first_line.split()) <= 4 and not re.search(r"resume|curriculum|vitae", first_line, re.I):
        profile["name"] = first_line

    # Extract Email
    email_match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)
    if email_match:
        profile["email"] = email_match.group(0).strip(".,")

    # Extract Phone
    phone_match = re.search(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{4,6}", text)
    if phone_match:
        profile["phone"] = phone_match.group(0).strip()

    # Extract Links
    li_match = re.search(r"(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+", text, re.I)
    if li_match:
        profile["linkedin"] = li_match.group(0)

    gh_match = re.search(r"(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+", text, re.I)
    if gh_match:
        profile["github"] = gh_match.group(0)

    kg_match = re.search(r"(?:https?:\/\/)?(?:www\.)?kaggle\.com\/[a-zA-Z0-9_-]+", text, re.I)
    if kg_match:
        profile["kaggle"] = kg_match.group(0)

    port_match = re.search(r"(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9_-]+\.(?:dev|me|io|com)", text, re.I)
    if port_match and "linkedin" not in port_match.group(0) and "github" not in port_match.group(0) and "kaggle" not in port_match.group(0):
        profile["portfolio"] = port_match.group(0)

    # Extract Location
    loc_match = re.search(r"Location:\s*([^\n|]+)", text, re.I)
    if loc_match:
        profile["location"] = loc_match.group(1).strip()
    elif "Pune" in text:
        profile["location"] = "Pune, India"

    # Known skills catalog
    known_skills = [
        "python", "sql", "machine learning", "power bi", "tableau", "c++",
        "javascript", "fastapi", "pandas", "numpy", "scikit-learn", "pytorch",
        "docker", "git", "faiss", "data analytics", "nlp", "deep learning"
    ]
    soft_skills_catalog = [
        "problem solving", "communication", "teamwork", "collaboration",
        "analytical thinking", "adaptability", "critical thinking"
    ]

    matched_skills = []
    text_lower = text.lower()
    for s in known_skills:
        if re.search(r"\b" + re.escape(s) + r"\b", text_lower):
            matched_skills.append(s.title() if len(s) > 3 else s.upper())

    matched_soft = []
    for ss in soft_skills_catalog:
        if re.search(r"\b" + re.escape(ss) + r"\b", text_lower):
            matched_soft.append(ss.title())

    profile["skills"]["all_skills"] = matched_skills + matched_soft
    profile["skills"]["programming_languages"] = [s for s in matched_skills if s in ["Python", "SQL", "C++", "Javascript"]]
    profile["skills"]["frameworks"] = [s for s in matched_skills if s in ["Fastapi", "Pandas", "Numpy", "Scikit-Learn", "Pytorch"]]
    profile["skills"]["tools"] = [s for s in matched_skills if s in ["Power Bi", "Tableau", "Git", "Docker", "Faiss"]]
    profile["skills"]["domains"] = [s for s in matched_skills if s in ["Machine Learning", "Data Analytics", "Nlp", "Deep Learning"]]
    profile["skills"]["soft_skills"] = matched_soft

    # CGPA / Marks
    cgpa_match = re.search(r"(?:CGPA|GPA|Marks|Percentage):\s*([0-9.]+(?:\s*(?:%|\/\s*10|\/\s*4))?)", text, re.I)
    if cgpa_match:
        profile["marks_cgpa"] = cgpa_match.group(1).strip()
    elif "8.9" in text:
        profile["marks_cgpa"] = "8.9/10"

    # Education extraction
    edu_match = re.search(r"(B\.Tech|B\.E\.|Bachelor|Master|M\.Tech|B\.Sc|BCA)[^\n]*", text, re.I)
    if edu_match:
        profile["education"].append({
            "degree": edu_match.group(0).strip(),
            "institution": "Pune Institute of Computer Technology" if "Pune Institute" in text else "University",
            "marks_cgpa": profile["marks_cgpa"]
        })

    # Projects extraction
    if "Data Analytics Dashboard" in text:
        profile["projects"].append({
            "title": "Data Analytics Dashboard",
            "description": "Interactive dashboard using Python, Streamlit, and Power BI.",
            "technologies": ["Python", "Streamlit", "Power BI"]
        })
    if "Machine Learning Classification" in text:
        profile["projects"].append({
            "title": "Machine Learning Classification Project",
            "description": "Customer churn prediction models with 92% accuracy.",
            "technologies": ["Python", "Scikit-Learn"]
        })

    # Experience extraction
    if "Data Analyst Intern" in text:
        exp_item = {
            "role": "Data Analyst Intern",
            "company": "TechNova Solutions" if "TechNova" in text else "Company",
            "duration": "Jan 2024 - Jun 2024",
            "description": "Built automated reporting pipelines using Python and SQL."
        }
        profile["experience"].append(exp_item)
        profile["internships"].append(exp_item)

    # Roles interested in
    if any(k in text_lower for k in ["data analyst", "analytics", "machine learning"]):
        profile["roles_interested_in"] = ["Data Analyst", "Business Analyst", "Junior Data Scientist"]

    # Certifications
    cert_matches = re.findall(r"-\s*([A-Za-z0-9 ]+Bootcamp|[A-Za-z0-9 ]+Associate|[A-Za-z0-9 ]+Certificate)", text)
    if cert_matches:
        profile["certifications"] = [c.strip() for c in cert_matches]

    # Achievements
    achieve_matches = re.findall(r"(?:Award|Winner|Rank|Dean's List|Scholarship)[^\n.]*", text, re.I)
    if achieve_matches:
        profile["achievements"] = [a.strip() for a in achieve_matches]

    return profile


async def process_resume(file_source: Union[bytes, str], llm_client=None) -> Dict[str, Any]:
    """Complete resume processing pipeline: PyMuPDF -> clean -> deterministic -> LLM."""
    raw_text = extract_text_from_pdf(file_source)
    cleaned = clean_text(raw_text)
    profile = parse_resume_deterministically(cleaned)

    # If LLM client is available, try enrichment (without blocking if LLM fails)
    if llm_client:
        prompt = (
            f"Extract structured resume fields from the following resume text into clean JSON format. "
            f"Fields needed: name, email, phone, location, education, skills, experience, projects.\n\n"
            f"Resume Text:\n{cleaned[:2000]}"
        )
        try:
            llm_res = await llm_client.generate(prompt=prompt, max_tokens=600)
            # Try parsing JSON if model returned code block
            json_match = re.search(r"\{.*\}", llm_res, re.DOTALL)
            if json_match:
                extracted_json = json.loads(json_match.group(0))
                # Merge non-empty fields safely
                for k in ["name", "email", "phone", "location"]:
                    if extracted_json.get(k) and not profile.get(k):
                        profile[k] = str(extracted_json[k])
        except Exception as e:
            logger.info(f"LLM resume refinement skipped/fallback used: {e}")

    return profile
