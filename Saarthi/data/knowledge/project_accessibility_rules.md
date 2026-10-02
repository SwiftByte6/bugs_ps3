# Project-Specific Accessibility Rules and Ethical Principles

This project adheres to strict ethical standards and privacy guidelines designed specifically for candidates with disabilities.

## Non-Negotiable Ethical Rules
1. **No Disability Diagnosis or Inference**: The system NEVER infers, classifies, or diagnoses a user's disability from eye movements, face geometry, typing cadence, or voice characteristics. Accessibility modes are chosen solely by user preferences.
2. **Local Vision Processing**: MediaPipe Face Mesh processes video frames strictly inside local client memory. Camera streams are NEVER transmitted over the internet or saved to persistent disk.
3. **Privacy-Controlled Accommodation Disclosure**: The system NEVER automatically discloses disability or accommodation requests to an employer. The user chooses between "Never disclose", "Ask every time", and "Allow selected disclosure".
4. **Prompt Injection Hardening**: All scraped or parsed web content is treated as untrusted data. Untrusted DOM text is sanitized and never evaluated as executive instructions.
5. **Data Minimization**: The candidate's full profile is never sent unconditionally in LLM prompts. Only the specific fields necessary for the current task are provided.
