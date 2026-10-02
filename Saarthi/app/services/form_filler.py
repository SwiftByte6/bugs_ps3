import re
import logging
from typing import Dict, Any, List, Optional
from app.services.embeddings import compute_embedding, cosine_similarity

logger = logging.getLogger("app.form_filler")

# Safe fields that map directly from verified profile
SAFE_FIELD_KEYS = {
    "name": ["name", "full_name", "fullname", "candidate_name", "applicant_name", "your_name"],
    "email": ["email", "email_address", "e-mail", "user_email", "contact_email"],
    "phone": ["phone", "mobile", "contact_number", "phone_number", "telephone", "cell"],
    "location": ["location", "city", "current_location", "address", "residence"],
    "linkedin": ["linkedin", "linkedin_profile", "linkedin_url"],
    "github": ["github", "github_profile", "github_url"],
    "portfolio": ["portfolio", "website", "personal_website", "portfolio_url"],
    "experience_years": ["experience", "experience_years", "years_of_experience", "total_experience"]
}

# Ambiguous fields that ALWAYS require candidate review/confirmation
AMBIGUOUS_KEYWORDS = [
    "salary", "compensation", "expected_salary", "why_join", "cover_letter",
    "cover_note", "interest", "referral", "referral_code", "disability",
    "accommodation", "accommodations", "special_needs", "equity", "gender"
]


def map_form_field(
    field_info: Dict[str, Any],
    profile: Dict[str, Any],
    disclosure_preference: str = "ask_every_time"  # "never", "ask_every_time", "allow_selected"
) -> Dict[str, Any]:
    """
    Map an extracted DOM field using the 4-tier hierarchy:
    1. Exact deterministic matching
    2. Rules / synonyms table
    3. Embedding similarity
    4. Fallback / Ambiguous marking
    """
    field_id = (field_info.get("id") or "").lower()
    field_name = (field_info.get("name") or "").lower()
    field_label = (field_info.get("label") or "").lower()
    field_placeholder = (field_info.get("placeholder") or "").lower()

    combined_identifiers = f"{field_name} {field_id} {field_label} {field_placeholder}".strip()

    # Step 1 & 2: Exact & Synonym Matching for Safe Fields
    for profile_key, synonyms in SAFE_FIELD_KEYS.items():
        for syn in synonyms:
            if syn in field_name or syn in field_id or syn in field_label:
                suggested_val = ""
                if profile_key == "name":
                    suggested_val = profile.get("name", "")
                elif profile_key == "email":
                    suggested_val = profile.get("email", "")
                elif profile_key == "phone":
                    suggested_val = profile.get("phone", "")
                elif profile_key == "location":
                    suggested_val = profile.get("location", "")
                elif profile_key == "linkedin":
                    suggested_val = profile.get("linkedin", "")
                elif profile_key == "github":
                    suggested_val = profile.get("github", "")
                elif profile_key == "portfolio":
                    suggested_val = profile.get("portfolio", "")
                elif profile_key == "experience_years":
                    # Derive years from experience count
                    exp_count = len(profile.get("experience", []))
                    suggested_val = "1" if exp_count >= 1 else "0"

                return {
                    "field_id": field_info.get("id"),
                    "field_name": field_info.get("name"),
                    "matched_profile_key": profile_key,
                    "suggested_value": suggested_val,
                    "is_safe": True,
                    "requires_confirmation": False,
                    "strategy": "exact_synonym_match",
                    "confidence": 0.95
                }

    # Accommodation / Disability Privacy Protection
    if any(k in combined_identifiers for k in ["accommodation", "disability", "special_needs"]):
        if disclosure_preference == "never":
            return {
                "field_id": field_info.get("id"),
                "field_name": field_info.get("name"),
                "matched_profile_key": "accommodations",
                "suggested_value": "",
                "is_safe": False,
                "requires_confirmation": True,
                "privacy_note": "Privacy setting 'Never disclose' active. Field left blank.",
                "strategy": "privacy_shield",
                "confidence": 1.0
            }
        else:
            return {
                "field_id": field_info.get("id"),
                "field_name": field_info.get("name"),
                "matched_profile_key": "accommodations",
                "suggested_value": "I request screen-reader friendly interview materials and remote captioning accommodations.",
                "is_safe": False,
                "requires_confirmation": True,
                "privacy_prompt": "Would you like to disclose accommodation requests? You have full control.",
                "strategy": "privacy_protected_ambiguous",
                "confidence": 0.70
            }

    # Step 3: Check for Ambiguous Fields
    if any(k in combined_identifiers for k in AMBIGUOUS_KEYWORDS):
        suggested_val = ""
        if "salary" in combined_identifiers:
            suggested_val = "7,50,000"
        elif "why_join" in combined_identifiers or "interest" in combined_identifiers or "cover" in combined_identifiers:
            suggested_val = "I am excited to bring my data analytics and machine learning skills to contribute to impactful software solutions."

        return {
            "field_id": field_info.get("id"),
            "field_name": field_info.get("name"),
            "matched_profile_key": "ambiguous_custom",
            "suggested_value": suggested_val,
            "is_safe": False,
            "requires_confirmation": True,
            "strategy": "ambiguous_heuristic",
            "confidence": 0.50
        }

    # Step 4: Semantic Embedding Similarity Fallback
    best_match = None
    best_sim = 0.0
    field_emb = compute_embedding(combined_identifiers)

    for profile_key, synonyms in SAFE_FIELD_KEYS.items():
        for syn in synonyms:
            syn_emb = compute_embedding(syn)
            sim = cosine_similarity(field_emb, syn_emb)
            if sim > best_sim:
                best_sim = sim
                best_match = profile_key

    if best_sim > 0.65 and best_match:
        val = profile.get(best_match, "")
        return {
            "field_id": field_info.get("id"),
            "field_name": field_info.get("name"),
            "matched_profile_key": best_match,
            "suggested_value": val if isinstance(val, str) else str(val),
            "is_safe": best_match in ["name", "email", "phone", "location", "linkedin", "github"],
            "requires_confirmation": best_match not in ["name", "email", "phone"],
            "strategy": "embedding_similarity",
            "confidence": round(best_sim, 2)
        }

    return {
        "field_id": field_info.get("id"),
        "field_name": field_info.get("name"),
        "matched_profile_key": "unknown",
        "suggested_value": "",
        "is_safe": False,
        "requires_confirmation": True,
        "strategy": "unmapped",
        "confidence": 0.0
    }


def map_all_fields(
    dom_inputs: List[Dict[str, Any]],
    profile: Dict[str, Any],
    disclosure_preference: str = "ask_every_time"
) -> Dict[str, Any]:
    """Map all DOM form fields against user profile and prepare Application Review."""
    mappings = []
    safe_fields = []
    ambiguous_fields = []

    for inp in dom_inputs:
        m = map_form_field(inp, profile, disclosure_preference)
        mappings.append(m)
        if m["is_safe"] and not m["requires_confirmation"]:
            safe_fields.append(m)
        else:
            ambiguous_fields.append(m)

    # Prepare Application Review payload
    review_summary = {
        "candidate_name": profile.get("name", "N/A"),
        "email": profile.get("email", "N/A"),
        "phone": profile.get("phone", "N/A"),
        "location": profile.get("location", "N/A"),
        "total_fields": len(dom_inputs),
        "safe_auto_fields": len(safe_fields),
        "ambiguous_review_fields": len(ambiguous_fields),
        "submission_requires_user_confirmation": True,
        "safe_fields": safe_fields,
        "ambiguous_fields": ambiguous_fields
    }

    return {
        "mappings": mappings,
        "review_summary": review_summary
    }
