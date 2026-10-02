# Application Assistance and Smart Form Filling

The application assistant guides users step-by-step through job application portals, matching stored profile data against web form inputs.

## Smart Form Filling Hierarchy
1. **Exact Deterministic Matching**: Standard HTML attribute names (`name="email"`, `autocomplete="email"`) mapped directly to verified profile fields.
2. **Rule & Synonym Table**: Common synonyms (e.g., "cell phone", "mobile", "contact number" -> `profile.phone`).
3. **Semantic Embedding Similarity**: Sentence transformer similarity matching field labels and placeholders against profile attributes.
4. **LLM Fallback**: Qwen LLM invoked only for ambiguous or open-ended questions.

## Safe vs. Ambiguous Fields
- **Safe Fields**: Name, email, phone number, location, GitHub URL, LinkedIn URL. Safe fields can be populated automatically upon user request.
- **Ambiguous Fields**: Salary expectations, customized cover letters, accommodation disclosures. These fields MUST require explicit confirmation and review from the candidate before populating.
- **Submission Safeguard**: The system NEVER automatically submits a job application. The user must review all populated values in an "Application Review" dialog and explicitly confirm submission.
