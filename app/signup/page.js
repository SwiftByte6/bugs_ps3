import AuthCard from "@/components/auth/AuthCard";
import AuthForm from "@/components/auth/AuthForm";
import AccessibilityToolbar from "@/components/ui/AccessibilityToolbar";

export const metadata = {
  title: "Create Account — Saarthi",
  description: "Sign up for Saarthi — Accessible Job Application Assistant.",
};

export default function SignupPage() {
  return (
    <main id="main-content" className="min-h-screen bg-[#F5F5F6] flex flex-col justify-center px-4">
      <AuthCard
        title="Get started with Saarthi"
        subtitle="Create your account to define your accessibility preferences and streamline your job search"
        footerText="Already have a Saarthi account?"
        footerLinkText="Sign In"
        footerLinkHref="/login"
      >
        <AuthForm mode="signup" />
      </AuthCard>
      <AccessibilityToolbar />
    </main>
  );
}
