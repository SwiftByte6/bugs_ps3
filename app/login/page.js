import AuthCard from "@/components/auth/AuthCard";
import AuthForm from "@/components/auth/AuthForm";
import AccessibilityToolbar from "@/components/ui/AccessibilityToolbar";

export const metadata = {
  title: "Sign In — Saarthi",
  description: "Sign in to your Saarthi accessible job assistant account.",
};

export default function LoginPage() {
  return (
    <main id="main-content" className="min-h-screen bg-[#F5F5F6] flex flex-col justify-center px-4">
      <AuthCard
        title="Welcome back"
        subtitle="Sign in to your Saarthi account to continue your application journey"
        footerText="Don't have a Saarthi account yet?"
        footerLinkText="Create Account"
        footerLinkHref="/signup"
      >
        <AuthForm mode="login" />
      </AuthCard>
      <AccessibilityToolbar />
    </main>
  );
}
