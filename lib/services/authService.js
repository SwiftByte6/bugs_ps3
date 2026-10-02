import { getSupabaseClient, isSupabaseConfigured } from "../supabase/client";

/**
 * Sign up candidate via Supabase Auth & create profiles & accessibility_preferences records
 */
export async function signUpUser({ name, email, password }) {
  const supabase = getSupabaseClient();

  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured. Please check your .env.local configuration.");
  }

  // 1. Genuine Supabase Auth Registration
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
    // If Supabase email confirmation rate limit (HTTP 429 / "rate limit") is encountered:
    if (error.message?.toLowerCase().includes("rate limit") || error.status === 429) {
      try {
        // Attempt password sign-in in case the user was already created
        const signInRes = await signInUser({ email, password });
        if (signInRes?.user) {
          return { user: signInRes.user, session: signInRes.session, requiresConfirmation: false };
        }
      } catch (signInErr) {
        // User exists with different credentials or email confirmation rate limit reached
        throw new Error(
          "Supabase email rate limit reached. If you already registered, please click 'Sign In' below. (Tip: Disable 'Confirm Email' in Supabase Dashboard -> Auth -> Email to bypass email limits during testing)."
        );
      }
    }
    throw error;
  }

  // 2. Persist real Supabase User ID to PostgreSQL database tables
  if (data.user) {
    try {
      // Save profile row in `profiles` table
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: name,
        email: email,
        onboarding_completed: false,
        updated_at: new Date().toISOString(),
      });

      // Initialize default accessibility preferences row in `accessibility_preferences` table
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
      console.warn("Notice inserting database profile row:", dbErr);
    }
  }

  // Determine if email confirmation is required (data.session is null if email confirmation link was sent)
  const requiresConfirmation = !data.session;

  return {
    user: data.user,
    session: data.session,
    requiresConfirmation,
  };
}

/**
 * Sign in candidate via Supabase Auth & fetch profile metadata from PostgreSQL table
 */
export async function signInUser({ email, password }) {
  const supabase = getSupabaseClient();

  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured. Please check your .env.local configuration.");
  }

  // Genuine Supabase Password Authentication
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  // Fetch real profile row from Supabase `profiles` table
  let profile = null;
  try {
    const { data: profData } = await supabase
      .from("profiles")
      .select("onboarding_completed, full_name, email")
      .eq("id", data.user.id)
      .single();
    profile = profData;
  } catch (e) {}

  if (!profile) {
    // Upsert profile if missing
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
}

/**
 * Sign out current user from Supabase Auth
 */
export async function signOutUser() {
  const supabase = getSupabaseClient();

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
}

/**
 * Get current active Supabase Auth user & associated profile metadata
 */
export async function getCurrentUser() {
  const supabase = getSupabaseClient();

  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
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
}
