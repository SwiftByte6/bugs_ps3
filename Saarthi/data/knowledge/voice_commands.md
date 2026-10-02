# Voice Navigation and Speech Commands

Voice assistance allows users with motor impairments or hands-free requirements to navigate the application and fill out forms using natural spoken commands.

## Standard Voice Commands
- "Read this page": Reads out the active screen's primary content and structure.
- "Explain this job": Summarizes the active job description into key highlights.
- "Go to next field": Moves keyboard focus to the subsequent input control.
- "Fill my email": Fills the focused or identified email field from the user profile.
- "Explain this question": Provides clarification on complex application questions.
- "Read the error": Focuses and reads any active validation warnings.
- "Show unanswered fields": Highlights empty required inputs before submission.
- "Fill safe fields": Automatically populates unambiguous fields (name, email, phone).
- "Stop": Immediately terminates any active speech-to-text, text-to-speech, or automated navigation actions.

Voice commands prioritize local rule matching for low latency and zero token usage, falling back to semantic interpretation only when phrasing is ambiguous.
