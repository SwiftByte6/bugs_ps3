# Saarthi — Accessible Job Application Assistant

**Saarthi** is an accessibility-first job application assistant designed to help candidates with disabilities navigate the job search and application process without fighting inaccessible web interfaces.

Built with **Next.js App Router**, **JavaScript**, **Tailwind CSS**, and **Supabase**, Saarthi combines a calm, accessible user interface with intelligent form assistance and centralized application tracking.

---

## 🎨 Visual System & Design System

The application strictly follows the visual directive established in [`design.md`](./design.md):

- **Light Mode Only**: Bright, clean, professional appearance.
- **Main Canvas Background**: `#F5F5F6` (Very light gray page background).
- **Content Surfaces**: `#FFFFFF` (Pure white cards with 1px `#E2E2E5` borders and `12–14px` radius).
- **Primary Brand Color**: `#40189D` (Deep Saarthi Purple used for primary buttons, active navigation, and key CTAs).
- **Light Purple Tint**: `#F1EBFF` (Used for skill pills, selected option cards, and badge highlights).
- **Primary Text**: `#222222` | **Secondary Text**: `#6F6F73` | **Muted Text**: `#99999D`.
- **Accessibility**: WCAG 2.1 AAA contrast, single-key keyboard navigation support, and explicit focus states (`outline: 2px solid #40189D`).

---

## 🚀 Completed Features (Stages 1 – 4)

### 1. Landing Page (`/`)
- **Navbar**: Accessible logo, navigation links (*Features*, *Accessibility Pillars*, *How It Works*, *Workflow*), and Sign In / Signup CTAs.
- **Hero Section**: Core value proposition (*"Saarthi helps people with disabilities navigate job applications without fighting inaccessible interfaces."*), primary CTA, and companion preview card.
- **Product Explanation & Accessibility Pillars**: Detailed breakdown of Visual, Motor, Reading, Hearing/Communication, and Voice assistance.
- **How It Works & Workflow**: Step-by-step 5-stage user journey visual diagram (`Profile -> Extension -> Job Search -> Assisted Application -> Application Tracking`).
- **CTA & Footer**: Accessible conversion section and footer links.

### 2. Authentication (`/login` & `/signup`)
- **Supabase Auth Integration**: Full client-side authentication using `@supabase/ssr` with automatic fallback to local mock authentication when environment variables are omitted.
- **Form Components**: Reusable `FormInput.jsx` with explicit `<label>` tags, password eye visibility toggle, and ARIA error callouts (`aria-invalid`, `aria-describedby`).

### 3. Accessibility Onboarding (`/onboarding`)
- **Self-Defined Preferences**: Respectful onboarding flow asking *"How would you like Saarthi to assist you?"* (no intrusive medical questions).
- **Selectable Option Cards**: Multi-selection for Visual, Motor, Reading, Hearing, and Voice assistance modes with `#F1EBFF` selected highlights and checkmark indicators.

### 4. User Profile & Resume Management (`/dashboard/profile`)
- **Personal & Professional Info**: Full Name, Email, Phone, Location, LinkedIn, GitHub, Portfolio URLs.
- **Skills Pill Manager**: Add/remove skill badges (`[ React ]`, `[ Next.js ]`).
- **PDF Resume Upload**: PDF upload, replace, and remove capabilities integrated with Supabase Storage (`resumes` bucket).
- **Profile Strength Indicator**: Completeness score percentage bar with missing items guidance.

### 5. Dashboard Command Center (`/dashboard`)
- **Statistics Overview**: 4 statistics cards (*Total Applications*, *Under Review*, *Interviews*, *Profile Strength*).
- **Recommended Opportunities**: Top matched job cards with match percentage scores.
- **Recent Applications**: Applied positions feed.

### 6. Application Tracker (`/dashboard/applications`)
- **Status Filters**: Filter applications by status (`All`, `Applied`, `Under Review`, `Interview`, `Offer`, `Rejected`).
- **Application Cards & Modals**: `ApplicationStatusBadge.jsx`, detail view/edit modal (`ApplicationDetailsModal.jsx`), and manual application tracking modal (`AddApplicationModal.jsx`).

### 7. Job Discovery (`/dashboard/jobs`)
- **Smart Skill Filters**: Pill filters for `[ All ]`, `[ Remote ]`, `[ React ]`, `[ Next.js ]`, etc.
- **Match Breakdown & AI Summaries**: Job details modal displaying AI-simplified descriptions and matching skill breakdowns.
- **1-Click Apply**: Instantly applies and adds the position to the application tracker.

### 8. Chrome Extension Experience (`/dashboard/extension`)
- **Connection Status Overview**: Interactive status indicator (*Connected* / *Not Connected*).
- **Sync Checklist**: Verified readiness status (`✓ Profile synced`, `✓ Resume PDF available`, `✓ Accessibility preferences synced`).
- **Popup Preview**: Simulated overlay rendering the extension's behavior on external job sites.

### 9. Global Accessibility Toolbar
- **Interactive Controls**: Floating quick bar present across pages offering live High Contrast mode toggle, Larger Text toggle, and screen reader announcements (`aria-live="polite"`).

---

## 🛠 Project Structure

```text
app/
├── layout.js
├── page.js
├── globals.css
├── login/
│   └── page.js
├── signup/
│   └── page.js
├── onboarding/
│   └── page.js
└── dashboard/
    ├── layout.js
    ├── page.js
    ├── profile/
    │   └── page.js
    ├── applications/
    │   └── page.js
    ├── jobs/
    │   └── page.js
    ├── extension/
    │   └── page.js
    └── settings/
        └── page.js

components/
├── landing/
├── auth/
├── onboarding/
├── dashboard/
├── profile/
├── applications/
├── jobs/
├── extension/
└── ui/

lib/
├── supabase/
│   └── client.js
└── services/
    ├── authService.js
    ├── profileService.js
    ├── applicationService.js
    └── jobService.js

hooks/
├── useUser.js
├── useProfile.js
└── useApplications.js
```

---

## ⚡ Environment Setup & Supabase Database

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xhlwvvqmgfzknqsdzucg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Database SQL Schemas

```sql
-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  skills TEXT[] DEFAULT '{}',
  resume_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Accessibility Preferences Table
CREATE TABLE IF NOT EXISTS public.accessibility_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  visual_assistance BOOLEAN DEFAULT FALSE,
  motor_assistance BOOLEAN DEFAULT FALSE,
  reading_assistance BOOLEAN DEFAULT FALSE,
  hearing_assistance BOOLEAN DEFAULT FALSE,
  voice_assistance BOOLEAN DEFAULT FALSE,
  high_contrast BOOLEAN DEFAULT FALSE,
  read_aloud BOOLEAN DEFAULT FALSE,
  keyboard_navigation BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id)
);

-- 3. Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  platform TEXT DEFAULT 'Direct',
  job_url TEXT,
  status TEXT DEFAULT 'Applied',
  applied_at DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
```

---

## 🔮 Roadmap & Future Integration Plans

The frontend service architecture (`profileService.js`, `applicationService.js`, `jobService.js`) has been designed to decouple UI components from backend implementation. Future integrations will include:

1. **Saarthi FastAPI Backend Integration**:
   - Connecting `jobService.js` and `applicationService.js` to real FastAPI REST endpoints for LangGraph and OpenRouter LLM job parsing.
2. **Chrome Extension Cross-Domain Messaging**:
   - Establishing WebSocket / `postMessage` channels between the Saarthi Chrome extension content script and the Saarthi Dashboard to sync auto-fill fields in real time.
3. **Automated DOM Analysis & Form Filling**:
   - Automatic field mapping for complex multi-step application forms on LinkedIn, Greenhouse, and Lever.
4. **Voice Navigation Engine**:
   - Web Speech API integration for hands-free voice command execution (*"Read job summary"*, *"Next field"*, *"Submit application"*).
