import logging
from typing import Dict, Any, List, Optional
import numpy as np
import faiss
from app.services.embeddings import compute_embedding, cosine_similarity

logger = logging.getLogger("app.matcher")


class JobMatcher:
    def __init__(self):
        self.dimension = 384
        self.index = faiss.IndexFlatIP(self.dimension)
        self.job_store: List[Dict[str, Any]] = []

    def index_jobs(self, jobs: List[Dict[str, Any]]) -> int:
        """Index a list of job postings into FAISS."""
        self.index.reset()
        self.job_store = []
        if not jobs:
            return 0

        embeddings = []
        for job in jobs:
            text_rep = f"{job.get('title', '')} {job.get('company', '')} {' '.join(job.get('required_skills', []))} {job.get('responsibilities', '')}"
            emb = compute_embedding(text_rep)
            embeddings.append(emb)
            self.job_store.append(job)

        emb_matrix = np.vstack(embeddings).astype(np.float32)
        self.index.add(emb_matrix)
        return len(self.job_store)

    def search_top_jobs(self, resume_text: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Retrieve top-k matching jobs using FAISS."""
        if self.index.ntotal == 0:
            return []
        resume_emb = compute_embedding(resume_text).reshape(1, -1).astype(np.float32)
        k = min(top_k, self.index.ntotal)
        distances, indices = self.index.search(resume_emb, k)

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx < len(self.job_store):
                job = dict(self.job_store[idx])
                job["similarity_score"] = round(float(dist) * 100, 2)
                results.append(job)
        return results

    def calculate_match(
        self,
        resume_profile: Dict[str, Any],
        job_data: Dict[str, Any],
        resume_raw_text: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calculate an explicit, deterministic match score between resume and job posting.
        Components:
          1. Semantic Embedding Similarity: 40%
          2. Skill Overlap: 35%
          3. Experience Compatibility: 15%
          4. Work-Mode Compatibility: 10%
        """
        # 1. Semantic Embedding Similarity (40%)
        if resume_raw_text:
            res_text = resume_raw_text
        else:
            all_skills = " ".join(resume_profile.get("skills", {}).get("all_skills", []))
            res_text = f"{resume_profile.get('name', '')} {all_skills} {' '.join([p.get('title', '') for p in resume_profile.get('projects', [])])}"

        job_text = f"{job_data.get('title', '')} {' '.join(job_data.get('required_skills', []))} {job_data.get('description', '')}"
        
        emb_resume = compute_embedding(res_text)
        emb_job = compute_embedding(job_text)
        raw_cosine = cosine_similarity(emb_resume, emb_job)
        # Rescale [-1, 1] to [0, 1]
        emb_similarity = max(0.0, min(1.0, (raw_cosine + 1.0) / 2.0))
        semantic_points = emb_similarity * 40.0

        # 2. Skill Overlap (35%)
        candidate_skills = {
            s.lower() for s in resume_profile.get("skills", {}).get("all_skills", [])
        }
        # Also check raw text for mentioned skills
        if resume_raw_text:
            text_lower = resume_raw_text.lower()
            for s in ["python", "sql", "machine learning", "power bi", "tableau", "docker", "git"]:
                if s in text_lower:
                    candidate_skills.add(s)

        required_skills = [s.strip() for s in job_data.get("required_skills", []) if s.strip()]
        preferred_skills = [s.strip() for s in job_data.get("preferred_skills", []) if s.strip()]

        matched_skills = []
        missing_skills = []

        for req in required_skills:
            if req.lower() in candidate_skills or any(req.lower() in cs for cs in candidate_skills):
                matched_skills.append(req)
            else:
                missing_skills.append(req)

        for pref in preferred_skills:
            if pref.lower() in candidate_skills or any(pref.lower() in cs for cs in candidate_skills):
                if pref not in matched_skills:
                    matched_skills.append(pref)
            else:
                if pref not in missing_skills:
                    missing_skills.append(pref)

        total_req_count = max(1, len(required_skills))
        matched_req_count = len([s for s in matched_skills if s in required_skills])
        skill_ratio = min(1.0, matched_req_count / total_req_count)
        skill_points = skill_ratio * 35.0

        # 3. Experience Compatibility (15%)
        # Default generous compatibility for entry/internship profiles
        exp_count = len(resume_profile.get("experience", [])) + len(resume_profile.get("projects", []))
        if exp_count >= 2:
            exp_points = 15.0
        elif exp_count == 1:
            exp_points = 10.0
        else:
            exp_points = 5.0

        # 4. Work-Mode Compatibility (10%)
        # Hybrid/Remote matches default 10.0
        work_mode = job_data.get("work_mode", "Hybrid").lower()
        if "hybrid" in work_mode or "remote" in work_mode or "flexible" in work_mode:
            work_mode_points = 10.0
        else:
            work_mode_points = 8.0

        total_score = round(semantic_points + skill_points + exp_points + work_mode_points, 1)
        total_score = max(0.0, min(100.0, total_score))

        # Explanation generator
        explanation = (
            f"Candidate profile scored {total_score}% match based on strong skill alignment in "
            f"{', '.join(matched_skills[:3]) if matched_skills else 'core domains'}, "
            f"semantic relevance ({round(emb_similarity * 100)}%), and verified project experience."
        )

        return {
            "overall_match_score": total_score,
            "breakdown": {
                "semantic_similarity": round(emb_similarity * 100, 1),
                "semantic_points": round(semantic_points, 1),
                "skill_overlap_ratio": round(skill_ratio * 100, 1),
                "skill_points": round(skill_points, 1),
                "experience_points": round(exp_points, 1),
                "work_mode_points": round(work_mode_points, 1),
            },
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "why_this_job_matches": explanation
        }


job_matcher = JobMatcher()
