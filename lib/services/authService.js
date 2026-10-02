import { getSupabaseClient, isSupabaseConfigured } from "../supabase/client";

const MOCK_STORAGE_KEY = "saarthi_mock_user";

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

    // Create initial profile row
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: name,
        email: email,
        onboarding_completed: false,
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

export async function signInUser({ email, password }) {
  const supabase = getSupabaseClient();

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Fetch profile to check onboarding completion status
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", data.user.id)
      .single();

    const onboardingCompleted = profile?.onboarding_completed ?? false;

    return {
      user: { ...data.user, onboarding_completed: onboardingCompleted },
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

export async function getCurrentUser() {
  const supabase = getSupabaseClient();

  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, full_name")
      .eq("id", data.user.id)
      .single();

    return {
      ...data.user,
      onboarding_completed: profile?.onboarding_completed ?? false,
      full_name: profile?.full_name || data.user.user_metadata?.full_name || "User",
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
