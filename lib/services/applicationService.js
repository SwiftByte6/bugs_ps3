import { getSupabaseClient, isSupabaseConfigured } from "../supabase/client";

const MOCK_APPLICATIONS_KEY = "saarthi_mock_applications";

const INITIAL_MOCK_APPLICATIONS = [
  {
    id: "app_1",
    company: "TechAccess Solutions",
    role: "Senior Frontend Engineer (Accessibility)",
    platform: "LinkedIn Jobs",
    job_url: "https://linkedin.com/jobs/view/101",
    status: "Under Review",
    applied_at: "2026-10-01",
    notes: "Applied via Saarthi extension. Recruiter scheduled phone screen.",
  },
  {
    id: "app_2",
    company: "InclusionLabs Inc.",
    role: "Accessibility UX Developer",
    platform: "Greenhouse",
    job_url: "https://boards.greenhouse.io/inclusionlabs/jobs/202",
    status: "Interview",
    applied_at: "2026-09-28",
    notes: "Technical interview scheduled for Oct 5. Focus on WCAG 2.1 compliance.",
  },
  {
    id: "app_3",
    company: "Global Workforce Tech",
    role: "React & Accessibility Developer",
    platform: "Indeed",
    job_url: "https://indeed.com/viewjob?jk=303",
    status: "Applied",
    applied_at: "2026-10-02",
    notes: "Submitted PDF resume and accessibility accommodations note.",
  },
  {
    id: "app_4",
    company: "NextGen Mobility",
    role: "Frontend Engineer (UI Systems)",
    platform: "Lever",
    job_url: "https://jobs.lever.co/nextgen/404",
    status: "Offer",
    applied_at: "2026-09-15",
    notes: "Offer letter received! Reviewing compensation package.",
  },
  {
    id: "app_5",
    company: "Apex Cloud Services",
    role: "Full Stack JavaScript Developer",
    platform: "LinkedIn Jobs",
    job_url: "https://linkedin.com/jobs/view/505",
    status: "Rejected",
    applied_at: "2026-09-10",
    notes: "Position put on hold by hiring manager.",
  },
];

export async function getApplications(userId) {
  const supabase = getSupabaseClient();

  if (isSupabaseConfigured && supabase && userId) {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("user_id", userId)
      .order("applied_at", { ascending: false });

    if (error && error.code !== "PGRST116") throw error;
    if (data && data.length > 0) return data;
  }

  // Fallback Mock Local Storage
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(MOCK_APPLICATIONS_KEY);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(MOCK_APPLICATIONS_KEY, JSON.stringify(INITIAL_MOCK_APPLICATIONS));
  }
  return INITIAL_MOCK_APPLICATIONS;
}

export async function createApplication(userId, applicationData) {
  const supabase = getSupabaseClient();
  const newApp = {
    id: `app_${Date.now()}`,
    user_id: userId || "user_mock_12345",
    company: applicationData.company,
    role: applicationData.role,
    platform: applicationData.platform || "Direct Site",
    job_url: applicationData.job_url || "#",
    status: applicationData.status || "Applied",
    applied_at: new Date().toISOString().split("T")[0],
    notes: applicationData.notes || "",
  };

  if (isSupabaseConfigured && supabase && userId) {
    const { data, error } = await supabase
      .from("applications")
      .insert(newApp)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Mock Save
  if (typeof window !== "undefined") {
    const existing = await getApplications(userId);
    const updated = [newApp, ...existing];
    localStorage.setItem(MOCK_APPLICATIONS_KEY, JSON.stringify(updated));
    return newApp;
  }
}

export async function updateApplicationStatus(userId, applicationId, newStatus, newNotes) {
  const supabase = getSupabaseClient();

  if (isSupabaseConfigured && supabase) {
    const updatePayload = { status: newStatus, updated_at: new Date().toISOString() };
    if (newNotes !== undefined) updatePayload.notes = newNotes;

    const { data, error } = await supabase
      .from("applications")
      .update(updatePayload)
      .eq("id", applicationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Mock Update
  if (typeof window !== "undefined") {
    const existing = await getApplications(userId);
    const updated = existing.map((app) =>
      app.id === applicationId
        ? {
            ...app,
            status: newStatus,
            notes: newNotes !== undefined ? newNotes : app.notes,
          }
        : app
    );
    localStorage.setItem(MOCK_APPLICATIONS_KEY, JSON.stringify(updated));
    return updated.find((a) => a.id === applicationId);
  }
}

export async function deleteApplication(userId, applicationId) {
  const supabase = getSupabaseClient();

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("id", applicationId);

    if (error) throw error;
    return true;
  }

  // Mock Delete
  if (typeof window !== "undefined") {
    const existing = await getApplications(userId);
    const updated = existing.filter((app) => app.id !== applicationId);
    localStorage.setItem(MOCK_APPLICATIONS_KEY, JSON.stringify(updated));
    return true;
  }
}
