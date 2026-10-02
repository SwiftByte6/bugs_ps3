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

## 🎬 Step-by-Step Hackathon Demonstration Walkthrough (3 Minutes)

1. **Dashboard Launch & Login**:
   - Open `http://localhost:3000/dashboard` (or `/login`). Notice top header badge displaying `Saarthi Connected` (or `Saarthi Offline` with full offline fallback capability).
2. **Accessibility Preferences & Profile**:
   - Navigate to `/dashboard/profile`. View candidate details (Rohit Sharma), skill pills, and resume PDF status.
3. **Job Discovery & Matching**:
   - Navigate to `/dashboard/jobs`. Click skill pill `[ Remote ]` or `[ React ]`. View Profile Match percentage (95% Match score) and matching vs missing skills breakdown.
4. **AI Description Simplification**:
   - Click **View Details** on *Senior Frontend Developer (WCAG Focus)*. View AI simplified summary.
5. **Saarthi Controlled Smart Apply Flow**:
   - Click **Apply with Saarthi** (or **Launch Smart Apply Demo**).
   - *Step 1 (DOM Analysis & Audit)*: View detected form controls and WCAG findings with severity hierarchy (`High`, `Medium`, `Low`).
   - *Step 2 (Field Classification)*: View Safe Fields (auto-filled: name, email, phone) vs Needs Review (salary, cover letter, accommodation, disability disclosure).
   - *Step 3 (Review & Explicit Confirmation)*: Review pre-filled values and check explicit authorization box (`user_confirmed: true`).
   - *Step 4 (Submission & Tracker)*: Click **Submit Application**. View confirmation and automatic Application Tracker entry.
6. **Chrome MV3 Extension Handoff**:
   - Navigate to `/dashboard/extension`. View connection status checklist. Open extension popup to perform page DOM scan, WCAG audit, safe fill, or click **Open Full Dashboard**.
7. **Voice Companion Navigation**:
   - Press single key **V** to activate Voice Companion. Speak *"Find frontend jobs"* or *"Read page"*. Click Emergency **STOP** or press **Esc** to halt speech.

---

## ⚠️ Known Limitations

1. **Host Environment Python Requirement**: Running local LLM/Whisper backend requires Python 3.10+ installed on host OS; frontend includes 100% full offline fallbacks when Python is omitted.
2. **Browser Microphone Permission**: Web Speech API requires microphone permissions granted in Chrome/Edge browsers.
3. **Third-Party Job Portals**: Core demonstration targets controlled demo environment (`SmartApplyModal.jsx` / `GET /api/dom/demo-html`) to ensure 100% deterministic hackathon performance.
