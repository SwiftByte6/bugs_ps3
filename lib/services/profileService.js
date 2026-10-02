import { getSupabaseClient, isSupabaseConfigured } from "../supabase/client";
import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";

const MOCK_PROFILE_KEY = "saarthi_mock_profile";
const MOCK_ACCESSIBILITY_KEY = "saarthi_mock_accessibility";

/**
 * Fetch profile data (prioritizes Supabase DB for current authenticated user)
 */
export async function getProfile(userId) {
  const supabase = getSupabaseClient();

  // 1. Try Supabase Database
  if (isSupabaseConfigured && supabase && userId && userId !== "user_mock_12345") {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data && data.email) {
      return data;
    }

    // If profile row doesn't exist yet, get current user info from Supabase Auth
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        const u = authData.user;
        const initialProfile = {
          id: u.id,
          full_name: u.user_metadata?.full_name || u.email?.split("@")[0] || "Job Candidate",
          email: u.email || "",
          phone: "",
          location: "",
          linkedin_url: "",
          github_url: "",
          portfolio_url: "",
          skills: ["React", "JavaScript"],
          resume_url: "",
          onboarding_completed: false,
        };

        // Create initial profile row in Supabase `profiles` table
        await supabase.from("profiles").upsert({
          ...initialProfile,
          updated_at: new Date().toISOString(),
        });

        return initialProfile;
      }
    } catch (e) {}
  }

  // 2. Try FastAPI Backend if Supabase is unconfigured or in offline mode
  try {
    const backendProfile = await api.get(ENDPOINTS.GET_PROFILE);
    if (backendProfile && backendProfile.email) {
      return {
        id: userId || backendProfile.id || "user_backend_1",
        full_name: backendProfile.full_name || backendProfile.name || "Job Candidate",
        email: backendProfile.email || "candidate@example.com",
        phone: backendProfile.phone || "",
        location: backendProfile.location || "",
        linkedin_url: backendProfile.linkedin_url || "",
        github_url: backendProfile.github_url || "",
        portfolio_url: backendProfile.portfolio_url || "",
        skills: backendProfile.skills || ["React", "Next.js", "JavaScript", "Tailwind CSS"],
        resume_url: backendProfile.resume_url || "",
        onboarding_completed: true,
      };
    }
  } catch (err) {}

  // 3. Fallback Local Storage
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(MOCK_PROFILE_KEY);
    if (stored) return JSON.parse(stored);
  }

  return {
    id: userId || "user_mock_12345",
    full_name: "Job Candidate",
    email: "candidate@example.com",
    phone: "+91 98765 43210",
    location: "Mumbai, India",
    linkedin_url: "https://linkedin.com/in/candidate",
    github_url: "https://github.com/candidate",
    portfolio_url: "",
    skills: ["React", "Next.js", "JavaScript", "Tailwind CSS", "Accessibility (WCAG)"],
    resume_url: "",
    onboarding_completed: true,
  };
}

/**
 * Update user profile across Supabase, FastAPI backend, and local fallback storage
 */
export async function updateProfile(userId, profileData) {
  // 1. Sync with Supabase DB first
  const supabase = getSupabaseClient();
  if (isSupabaseConfigured && supabase && userId) {
    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (!error && data) {
      // Sync with FastAPI Backend if available
      try {
        await api.post(ENDPOINTS.BUILDER, profileData);
      } catch (err) {}
      return data;
    }
  }

  // 2. Sync with FastAPI Backend
  try {
    await api.post(ENDPOINTS.BUILDER, profileData);
  } catch (err) {
    console.warn("FastAPI backend builder sync skipped:", err.message);
  }

  // 3. Fallback Local Storage
  if (typeof window !== "undefined") {
    const existing = await getProfile(userId);
    const updated = { ...existing, ...profileData, updated_at: new Date().toISOString() };
    localStorage.setItem(MOCK_PROFILE_KEY, JSON.stringify(updated));
    return updated;
  }

  return profileData;
}

/**
 * Fetch accessibility preferences
 */
export async function getAccessibilityPreferences(userId) {
  const supabase = getSupabaseClient();

  if (isSupabaseConfigured && supabase && userId) {
    const { data, error } = await supabase
      .from("accessibility_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!error && data) return data;
  }

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(MOCK_ACCESSIBILITY_KEY);
    if (stored) return JSON.parse(stored);
  }

  return {
    visual_assistance: true,
    motor_assistance: true,
    reading_assistance: false,
    hearing_assistance: false,
    voice_assistance: false,
    high_contrast: false,
    read_aloud: true,
    keyboard_navigation: true,
  };
}

/**
 * Update accessibility preferences & sync with Supabase and FastAPI
 */
export async function updateAccessibilityPreferences(userId, prefs) {
  // 1. Sync with Supabase
  const supabase = getSupabaseClient();
  if (isSupabaseConfigured && supabase && userId) {
    const { data } = await supabase
      .from("accessibility_preferences")
      .upsert({
        user_id: userId,
        ...prefs,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", userId);
    
    // Sync with FastAPI backend accessibility endpoint
    try {
      await api.post(ENDPOINTS.ACCESSIBILITY, prefs);
      await api.post(ENDPOINTS.ONBOARDING, { user_id: userId, preferences: prefs });
    } catch (err) {}

    if (data) return data;
  }

  // 2. Sync with FastAPI backend
  try {
    await api.post(ENDPOINTS.ACCESSIBILITY, prefs);
    await api.post(ENDPOINTS.ONBOARDING, { user_id: userId, preferences: prefs });
  } catch (err) {
    console.warn("FastAPI accessibility sync skipped:", err.message);
  }

  // 3. Fallback Local Storage
  if (typeof window !== "undefined") {
    localStorage.setItem(MOCK_ACCESSIBILITY_KEY, JSON.stringify(prefs));
    const profile = await getProfile(userId);
    profile.onboarding_completed = true;
    localStorage.setItem(MOCK_PROFILE_KEY, JSON.stringify(profile));
  }
  return prefs;
}

/**
 * Upload resume file to Supabase Storage and FastAPI backend
 */
export async function uploadResume(userId, file) {
  if (!file) return null;

  // 1. Upload to Supabase Storage if configured
  const supabase = getSupabaseClient();
  if (isSupabaseConfigured && supabase && userId) {
    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}/resume_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(filePath, file, { upsert: true });

    if (!uploadError) {
      await updateProfile(userId, { resume_url: file.name });
      // Sync with FastAPI
      try {
        const formData = new FormData();
        formData.append("file", file);
        await api.upload(ENDPOINTS.RESUME_UPLOAD, formData);
      } catch (e) {}

      return file.name;
    }
  }

  // 2. Upload to FastAPI Backend
  try {
    const formData = new FormData();
    formData.append("file", file);
    await api.upload(ENDPOINTS.RESUME_UPLOAD, formData);
  } catch (err) {
    console.warn("FastAPI resume upload skipped:", err.message);
  }

  // 3. Fallback
  await updateProfile(userId, { resume_url: file.name });
  return file.name;
}

/**
 * Get profile completeness score
 */
export async function getProfileCompleteness(profileData) {
  if (!profileData) return 50;

  let score = 0;
  if (profileData.full_name) score += 20;
  if (profileData.email) score += 20;
  if (profileData.phone) score += 15;
  if (profileData.location) score += 15;
  if (profileData.skills && profileData.skills.length > 0) score += 15;
  if (profileData.resume_url) score += 15;

  return Math.min(100, score);
}
