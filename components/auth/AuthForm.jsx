"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import FormInput from "../ui/FormInput";
import Button from "../ui/Button";
import useUser from "../../hooks/useUser";
import { AlertCircle, ArrowRight, CheckCircle2, Mail } from "lucide-react";

export default function AuthForm({ mode = "login" }) {
  const router = useRouter();
  const { login, signup } = useUser();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [successInfo, setSuccessInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError("");
    if (successInfo) setSuccessInfo("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessInfo("");

    if (isSignup) {
      if (!formData.name.trim()) {
        setError("Please enter your full name.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match. Please verify your password.");
        return;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignup) {
        const res = await signup(formData.name, formData.email, formData.password);
        
        if (res?.requiresConfirmation) {
          setSuccessInfo(
            `✓ Account created! Supabase has sent a confirmation link to ${formData.email}. Please check your inbox and click the link to verify your email address before signing in.`
          );
        } else {
          router.push("/onboarding");
        }
      } else {
        const res = await login(formData.email, formData.password);
        const isCompleted = res?.user?.onboarding_completed;
        if (isCompleted) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
      }
    } catch (err) {
      console.error("Auth submit error:", err);
      setError(
        err?.message || "Authentication failed. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Error Callout */}
      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Confirmation Email Sent Success Notice */}
      {successInfo && (
        <div
          role="status"
          className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-xs font-semibold space-y-2 animate-in fade-in"
        >
          <div className="flex items-start gap-2.5 font-bold text-sm text-[#15803D]">
            <Mail className="w-5 h-5 text-[#15803D] shrink-0 mt-0.5" />
            <span>Check Your Email Inbox</span>
          </div>
          <p className="text-xs text-[#166534] font-medium leading-relaxed">
            {successInfo}
          </p>
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push("/login")}
              className="text-xs font-bold border-[#BBF7D0] text-[#15803D] hover:bg-[#DCFCE7]"
            >
              Proceed to Sign In →
            </Button>
          </div>
        </div>
      )}

      {isSignup && (
        <FormInput
          id="name"
          label="Full Name"
          type="text"
          placeholder="e.g. Rohit Sharma"
          value={formData.name}
          onChange={handleChange("name")}
          required
          autoComplete="name"
        />
      )}

      <FormInput
        id="email"
        label="Email Address"
        type="email"
        placeholder="e.g. user@example.com"
        value={formData.email}
        onChange={handleChange("email")}
        required
        autoComplete="email"
      />

      <FormInput
        id="password"
        label="Password"
        type="password"
        placeholder="••••••••"
        value={formData.password}
        onChange={handleChange("password")}
        required
        autoComplete={isSignup ? "new-password" : "current-password"}
        helperText={isSignup ? "Must be at least 6 characters" : undefined}
      />

      {isSignup && (
        <FormInput
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={handleChange("confirmPassword")}
          required
          autoComplete="new-password"
        />
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={loading}
        icon={ArrowRight}
        iconPosition="right"
        className="w-full mt-2 font-bold shadow-xs bg-[#40189D] hover:bg-[#32127A] text-white"
      >
        {isSignup ? "Create Account & Continue" : "Sign In"}
      </Button>
    </form>
  );
}
