"use client";

import React from "react";
import useProfile from "@/hooks/useProfile";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileCompleteness from "@/components/profile/ProfileCompleteness";
import AccessibilityPreferencesCard from "@/components/profile/AccessibilityPreferencesCard";
import PersonalInformationForm from "@/components/profile/PersonalInformationForm";
import ProfessionalInformationForm from "@/components/profile/ProfessionalInformationForm";
import ResumeUpload from "@/components/profile/ResumeUpload";

export default function ProfilePage() {
  const {
    profile,
    accessibility,
    loading,
    saving,
    saveProfileData,
    uploadResumeFile,
    completeness,
  } = useProfile();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#40189D]"></div>
      </div>
    );
  }

  const handleRemoveResume = async () => {
    await saveProfileData({ resume_url: "" });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Overview */}
      <ProfileHeader
        profile={profile}
        completenessPercentage={completeness.percentage}
      />

      {/* Profile Strength & Accessibility Settings Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProfileCompleteness
          percentage={completeness.percentage}
          missing={completeness.missing}
        />
        <AccessibilityPreferencesCard preferences={accessibility} />
      </div>

      {/* Main Forms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <PersonalInformationForm
          profile={profile}
          onSave={saveProfileData}
          saving={saving}
        />
        <ProfessionalInformationForm
          profile={profile}
          onSave={saveProfileData}
          saving={saving}
        />
        <ResumeUpload
          resumeUrl={profile?.resume_url}
          onUpload={uploadResumeFile}
          onRemove={handleRemoveResume}
          saving={saving}
        />
      </div>
    </div>
  );
}
