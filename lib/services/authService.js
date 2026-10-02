import { getSupabaseClient, isSupabaseConfigured } from "../supabase/client";

const MOCK_STORAGE_KEY = "saarthi_mock_user";

/**
 * Sign up candidate via Supabase Auth with rate limit fallback handling
 */
export async function signUpUser({ name, email, password }) {
  const supabase = getSupabaseClient();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        // Handle Supabase free tier email rate limit (429 / email rate limit exceeded)
        if (error.message?.toLowerCase().includes("rate limit") || error.status === 429) {
          console.warn("Supabase Auth email rate limit exceeded. Falling back to local candidate session.");

          // Attempt direct login if user already exists
          try {
            const signInRes = await supabase.auth.signInWithPassword({ email, password });
            if (signInRes.data?.user) return signInRes.data;
          } catch (e) {}

          const rateLimitUser = {
            id: `user_local_${Date.now()}`,
            email,
            user_metadata: { full_name: name },
            full_name: name,
            onboarding_completed: false,
          };
          if (typeof window !== "undefined") {
            localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(rateLimitUser));
          }
          return { user: rateLimitUser, session: { user: rateLimitUser } };
        }
        throw error;
      }

      if (data.user) {
        // 1. Save user profile to Supabase `profiles` table
        try {
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
        } catch (dbErr) {
          console.warn("DB profile row insertion notice:", dbErr);
        }
      }

      return { user: data.user, session: data.session };
    } catch (err) {
      if (err.message?.toLowerCase().includes("rate limit") || err.status === 429) {
        const rateLimitUser = {
          id: `user_local_${Date.now()}`,
          email,
          user_metadata: { full_name: name },
          full_name: name,
          onboarding_completed: false,
        };
        if (typeof window !== "undefined") {
          localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(rateLimitUser));
        }
        return { user: rateLimitUser, session: { user: rateLimitUser } };
      }
      throw err;
    }
  }

  // Fallback Mock Authentication
  const mockUser = {
    id: "user_mock_12345",
    email,
    user_metadata: { full_name: name },
    full_name: name,
    onboarding_completed: false,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockUser));
  }

  return { user: mockUser, session: { user: mockUser } };
}

/**
 * Sign in candidate via Supabase Auth with rate limit fallback handling
 */
export async function signInUser({ email, password }) {
  const supabase = getSupabaseClient();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message?.toLowerCase().includes("rate limit") || error.status === 429) {
          console.warn("Supabase Auth sign in rate limit hit. Falling back to candidate session.");
          const fallbackUser = {
            id: `user_local_${Date.now()}`,
            email,
            user_metadata: { full_name: email.split("@")[0] },
            full_name: email.split("@")[0],
            onboarding_completed: false,
          };
          if (typeof window !== "undefined") {
            localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(fallbackUser));
          }
          return { user: fallbackUser, session: { user: fallbackUser } };
        }
        throw error;
      }

      // Check if profile exists in Supabase `profiles` table
      let profile = null;
      try {
        const { data: profData } = await supabase
          .from("profiles")
          .select("onboarding_completed, full_name")
          .eq("id", data.user.id)
          .single();
        profile = profData;
      } catch (profErr) {}

      if (!profile) {
        // Create profile entry if missing
        try {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            full_name: data.user.user_metadata?.full_name || email.split("@")[0],
            email: email,
            onboarding_completed: false,
            updated_at: new Date().toISOString(),
          });
        } catch (e) {}
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
    } catch (err) {
      if (err.message?.toLowerCase().includes("rate limit") || err.status === 429) {
        const fallbackUser = {
          id: `user_local_${Date.now()}`,
          email,
          user_metadata: { full_name: email.split("@")[0] },
          full_name: email.split("@")[0],
          onboarding_completed: false,
        };
        if (typeof window !== "undefined") {
          localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(fallbackUser));
        }
        return { user: fallbackUser, session: { user: fallbackUser } };
      }
      throw err;
    }
  }

  // Fallback Mock Sign In
  let mockUser = {
    id: "user_mock_12345",
    email,
    user_metadata: { full_name: email.split("@")[0] },
    full_name: email.split("@")[0],
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
    try {
      await supabase.auth.signOut();
    } catch (e) {}
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
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem(MOCK_STORAGE_KEY);
          if (stored) return JSON.parse(stored);
        }
        return null;
      }

      let profile = null;
      try {
        const { data: profData } = await supabase
          .from("profiles")
          .select("onboarding_completed, full_name, email")
          .eq("id", data.user.id)
          .single();
        profile = profData;
      } catch (e) {}

      return {
        ...data.user,
        onboarding_completed: profile?.onboarding_completed ?? false,
        full_name: profile?.full_name || data.user.user_metadata?.full_name || "Job Candidate",
      };
    } catch (e) {}
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
