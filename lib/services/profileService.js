import { getSupabaseClient, isSupabaseConfigured } from "../supabase/client";

const MOCK_PROFILE_KEY = "saarthi_mock_profile";
const MOCK_ACCESSIBILITY_KEY = "saarthi_mock_accessibility";

export async function getProfile(userId) {
  const supabase = getSupabaseClient();

  if (isSupabaseConfigured && supabase && userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    if (data) return data;
  }

  // Fallback Mock Profile Data
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(MOCK_PROFILE_KEY);
    if (stored) return JSON.parse(stored);
  }

  return {
    id: userId || "user_mock_12345",
    full_name: "Rohit Sharma",
    email: "rohit.sharma@example.com",
    phone: "+91 98765 43210",
    location: "Mumbai, India",
    linkedin_url: "https://linkedin.com/in/rohit-sharma-dev",
    github_url: "https://github.com/rohit-sharma",
    portfolio_url: "",
    skills: ["React", "Next.js", "JavaScript", "Tailwind CSS", "Accessibility (WCAG)"],
    resume_url: "Rohit_Sharma_Resume.pdf",
    onboarding_completed: true,
  };
}

export async function updateProfile(userId, profileData) {
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

    if (error) throw error;
    return data;
  }

  // Fallback Mock Storage
  if (typeof window !== "undefined") {
    const existing = await getProfile(userId);
    const updated = { ...existing, ...profileData, updated_at: new Date().toISOString() };
    localStorage.setItem(MOCK_PROFILE_KEY, JSON.stringify(updated));
    return updated;
  }
}

export async function getAccessibilityPreferences(userId) {
  const supabase = getSupabaseClient();

  if (isSupabaseConfigured && supabase && userId) {
    const { data, error } = await supabase
      .from("accessibility_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    if (data) return data;
  }

  // Fallback Mock Preferences
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

export async function updateAccessibilityPreferences(userId, prefs) {
  const supabase = getSupabaseClient();

  if (isSupabaseConfigured && supabase && userId) {
    const { data, error } = await supabase
      .from("accessibility_preferences")
      .upsert({
        user_id: userId,
        ...prefs,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Mark onboarding completed in profiles table
    await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", userId);

    return data;
  }

  // Fallback Mock Save
  if (typeof window !== "undefined") {
    localStorage.setItem(MOCK_ACCESSIBILITY_KEY, JSON.stringify(prefs));
    // Update profile onboarding status
    const profile = await getProfile(userId);
    profile.onboarding_completed = true;
    localStorage.setItem(MOCK_PROFILE_KEY, JSON.stringify(profile));
  }
  return prefs;
}

export async function uploadResume(userId, file) {
  const supabase = getSupabaseClient();

  if (isSupabaseConfigured && supabase && userId && file) {
    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}/resume_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from("resumes")
      .getPublicUrl(filePath);

    const resumeUrl = publicUrlData.publicUrl;

    // Save resume URL to profile
    await updateProfile(userId, { resume_url: file.name });
    return file.name;
  }

  // Mock Upload
  if (file) {
    await updateProfile(userId, { resume_url: file.name });
    return file.name;
  }
}
