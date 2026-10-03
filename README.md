# Saarthi — Accessible Job Application Assistant

**Saarthi** is an accessibility-first job application assistant designed to help candidates with disabilities navigate the job search and application process without fighting inaccessible web interfaces.

Built with **Next.js App Router**, **JavaScript**, **Tailwind CSS**, **Supabase**, and a python **FastAPI + LangGraph backend**, Saarthi combines a calm, accessible user interface with intelligent form assistance and centralized application tracking.

---

## 🎨 Visual System & Design System

The application strictly follows the visual directive established in [`design.md`](./design.md):

- **Light Mode Only**: Bright, clean, professional appearance across all components and pages.
- **Main Canvas Background**: `#F5F5F6` (Very light gray page background).
- **Content Surfaces**: `#FFFFFF` (Pure white cards with 1px `#E2E2E5` borders and `12–14px` radius).
- **Primary Brand Color**: `#40189D` (Deep Saarthi Purple used for primary buttons, active navigation, and key CTAs).
- **Light Purple Tint**: `#F1EBFF` (Used for skill pills, selected option cards, and badge highlights).
- **Primary Text**: `#222222` | **Secondary Text**: `#6F6F73` | **Muted Text**: `#99999D`.
- **Accessibility**: WCAG 2.1 AAA contrast, single-key keyboard navigation support, and explicit focus states (`outline: 2px solid #40189D`).

---

## 🚀 Setup & Execution Commands

### 1. Environment Variables

Create `.env.local` in project root:

```env
NEXT_PUBLIC_SAARTHI_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_SUPABASE_URL=https://xhlwvvqmgfzknqsdzucg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Create `Saarthi/.env`:

```env
OPENROUTER_API_KEY=your-openrouter-api-key
```

### 2. Frontend Setup & Run (Next.js)

```bash
pnpm install
pnpm dev
```
*Frontend runs on `http://localhost:3000`.*

### 3. Backend Setup & Run (FastAPI)

```bash
cd Saarthi
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
python run.py
```
*Backend runs on `http://127.0.0.1:8000`.*

### 4. Chrome Extension Setup

1. Open Google Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** toggle in top-right corner.
3. Click **Load unpacked** and select directory: `<repo-root>/Saarthi/extension`.

---

## 🎙️ Intelligent Voice-Controlled Interaction Architecture

Saarthi implements an **audio-first, AI-driven accessibility interaction layer** designed for hands-free and blind/low-vision workflows without hardcoded natural language commands.

```
USER INPUT (Voice / Keyboard / Gesture / File)
       │
       ▼
INPUT PROCESSING (Faster-Whisper CPU INT8 / MediaPipe / Text)
       │
       ▼
AI NORMALIZATION (VoiceIntelligenceService)
       │ Contextually corrects speech artifacts, colloquialisms, and terminology
       ▼
INTENT & ENTITY EXTRACTION
       │ Extracts normalized intents (JOB_SEARCH, TRACK_APPLICATIONS, SMART_APPLY, PROFILE_UPDATE, etc.)
       ▼
LANGGRAPH ROUTER (StateGraph Multi-Agent Orchestrator)
       ├── Job Search & Matching Agent (Query expansion & FAISS similarity)
       ├── Application Tracker Agent (Status inquiry & TTS summaries)
       ├── JD Simplification Agent (Cognitive load reduction)
       ├── Smart Apply Agent (DOM audit & safe profile field mapping)
       ├── Interview Preparation Agent (Dynamic question generator)
       └── Profile Builder Agent (Semantic voice form field updates)
       │
       ▼
ACTION & TTS FEEDBACK (Web Speech / Piper TTS & 5-State Visual Status Badge)
```

### 1. Blind / Low-Vision Audio-First Mode
- **Zero-Click Activation**: When Blind/Low Vision mode is active, Saarthi automatically requests microphone permissions and greets the candidate: *"Hey, welcome to Saarthi. How can I help you?"*.
- **5-Second Silence Rule**: Uses real-time speech timeout detection (5-second silence window) to finalize spoken input before passing it to AI normalization.
- **Continuous Voice Interaction Loop**: Automatically asks *"What would you like me to do next?"* and stays in a listening loop until explicit global pause/stop commands (`Stop`, `Pause`, `Halt`).
- **Global Control Commands**: Universal voice control for `STOP`, `PAUSE`, `RESUME`, `REPEAT`, `HELP`, `NEXT`, and `BACK`.

### 2. Semantic Transcript Normalization
- Context-aware normalizer corrects STT mishearings without brittle regex dictionaries:
  - `"show me front end jobs"` ➔ `JOB_SEARCH` with `role: "frontend developer"`.
  - `"can you show me what's happening with my data analist application?"` ➔ `TRACK_APPLICATIONS` with `role: "data analyst"`.
  - `"my email is soham dot pashilkar at gmail dot com"` ➔ `PROFILE_UPDATE` with `field: "email", value: "soham.pashilkar@gmail.com"`.
- **Form Field Population**: Automatically maps spoken resume answers (e.g., *"Bachelor of Technology in Computer Engineering"*) directly into the actual form fields in the user's profile state.

### 3. Consequential Action Safeguards & Security Boundary
- **Never Spoken Passwords**: Passwords and secret authentication tokens are **strictly forbidden** from the speech-to-text pipeline and LLM context. Smart Sign-In uses Email + OTP or device passkeys.
- **Explicit Confirmation for Consequential Actions**: Submitting job applications (`SMART_APPLY`), deleting applications, or updating credentials will **never** automatically submit without explicit user confirmation (`user_confirmed: true`).
- **Secret Isolation**: OpenRouter API keys and `.env` secrets remain strictly on the backend and are never sent to the client or LLM.

### 4. MediaPipe Gesture Fallback
- For candidates who are both **blind/low vision and unable to speak**, Saarthi activates the MediaPipe hand and facial landmark pipeline as an alternative interaction pathway:
  - 👍 `CONFIRM` / `YES`
  - 👎 `DENY` / `NO`
  - ✋ `STOP` / `CANCEL`
  - ☝️ `NEXT`
  - ✌️ `PREVIOUS`
  - Head Nod ➔ `YES` | Head Shake ➔ `NO`

---

## 🎬 Step-by-Step Demonstration Walkthrough

1. **Blind / Audio-First Flow**:
   - Open `/dashboard`. If Visual Assistance is enabled, voice companion initiates automatically with the greeting *"Hey, welcome to Saarthi. How can I help you?"*.
2. **Natural Voice Job Search**:
   - Speak *"Find me frontend jobs"*. Saarthi normalizes the transcript, routes through the LangGraph `JobSearchAgent`, navigates to the Jobs view, and reads out the top matching opportunities.
3. **Application Tracking via Voice**:
   - Speak *"What happened with my data analyst application?"*. LangGraph routes to `ApplicationTrackerAgent` and announces the current status aloud.
4. **Voice Profile Form Filling**:
   - Navigate to `/dashboard/profile`. Speak *"My email is soham dot pashilkar at gmail dot com"*. Saarthi asks for confirmation and populates the field upon confirmation.
5. **Safe Smart Apply**:
   - Speak *"Apply to this job"*. Saarthi prepares the form, audits accessibility, and waits for explicit authorization before submission.
6. **Voice Status Indicator**:
   - Observe the 5-state badge in the Voice Companion: `● Listening`, `● Processing`, `● Speaking`, `● Waiting`, `● Paused`.

---

## ⚠️ Known Limitations & Boundaries

1. **Host Environment Python Requirement**: Running local Faster-Whisper and LangGraph backend requires Python 3.10+; the frontend provides graceful fallbacks and Web Speech API if the local backend is starting.
2. **Browser Microphone Permission**: Speech recognition requires microphone permissions granted in the browser.
3. **Third-Party Job Portals**: Controlled DOM analysis and auto-fill are verified on standard ATS portals and the built-in demo environment (`GET /api/dom/demo-html`).

