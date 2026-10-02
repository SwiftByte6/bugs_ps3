import { getSupabaseClient, isSupabaseConfigured } from "../supabase/client";

const MOCK_STORAGE_KEY = "saarthi_mock_user";

/**
 * Sign up candidate via Supabase Auth and initialize profiles & accessibility_preferences tables
 */
export async function signUpUser({ name, email, password }) {
  const supabase = getSupabaseClient();

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      // 1. Save user profile to Supabase `profiles` table
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: name,
        email: email,
        onboarding_completed: false,
        updated_at: new Date().toISOString(),
      });

      // 2. Initialize accessibility preferences row in `accessibility_preferences` table
      await supabase.from("accessibility_preferences").upsert({
        user_id: data.user.id,
        visual_assistance: false,
        motor_assistance: false,
        reading_assistance: false,
        hearing_assistance: false,
        voice_assistance: false,
        high_contrast: false,
        read_aloud: true,
        keyboard_navigation: true,
        updated_at: new Date().toISOString(),
      });
    }

    return { user: data.user, session: data.session };
  }

  // Fallback Mock Authentication
  const mockUser = {
    id: "user_mock_12345",
    email,
    user_metadata: { full_name: name },
    onboarding_completed: false,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockUser));
  }

  return { user: mockUser, session: { user: mockUser } };
}

/**
 * Sign in candidate via Supabase Auth & load onboarding status from `profiles` table
 */
export async function signInUser({ email, password }) {
  const supabase = getSupabaseClient();

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Check if profile exists in Supabase `profiles` table
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, full_name")
      .eq("id", data.user.id)
      .single();

    if (!profile) {
      // Create profile entry if missing
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: data.user.user_metadata?.full_name || email.split("@")[0],
        email: email,
        onboarding_completed: false,
        updated_at: new Date().toISOString(),
      });
    }

    const onboardingCompleted = profile?.onboarding_completed ?? false;

    return {
      user: {
        ...data.user,
        full_name: profile?.full_name || data.user.user_metadata?.full_name || email.split("@")[0],
        onboarding_completed: onboardingCompleted,
      },
      session: data.session,
    };
  }

  // Fallback Mock Sign In
  let mockUser = {
    id: "user_mock_12345",
    email,
    user_metadata: { full_name: email.split("@")[0] },
    onboarding_completed: false,
  };

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(MOCK_STORAGE_KEY);
    if (stored) {
      mockUser = JSON.parse(stored);
    } else {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockUser));
    }
  }

  return { user: mockUser, session: { user: mockUser } };
}

/**
 * Sign out current user
 */
export async function signOutUser() {
  const supabase = getSupabaseClient();

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  if (typeof window !== "undefined") {
    localStorage.removeItem(MOCK_STORAGE_KEY);
  }
}

/**
 * Get current active Supabase Auth user & associated profile metadata
 */
export async function getCurrentUser() {
  const supabase = getSupabaseClient();

  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, full_name, email")
      .eq("id", data.user.id)
      .single();

    return {
      ...data.user,
      onboarding_completed: profile?.onboarding_completed ?? false,
      full_name: profile?.full_name || data.user.user_metadata?.full_name || "Candidate",
    };
  }

  // Mock retrieve current user
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(MOCK_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return null;
}
