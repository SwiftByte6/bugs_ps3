"use client";

import { useState, useEffect } from "react";
import useUser from "./useUser";
import {
  getProfile,
  updateProfile,
  getAccessibilityPreferences,
  updateAccessibilityPreferences,
  uploadResume,
} from "../lib/services/profileService";

export default function useProfile() {
  const { user } = useUser();
  const [profile, setProfile] = useState(null);
  const [accessibility, setAccessibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const userId = user?.id || "user_mock_12345";
        const [profData, accData] = await Promise.all([
          getProfile(userId),
          getAccessibilityPreferences(userId),
        ]);
        setProfile(profData);
        setAccessibility(accData);
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const saveProfileData = async (updatedFields) => {
    setSaving(true);
    try {
      const userId = user?.id || "user_mock_12345";
      const updated = await updateProfile(userId, updatedFields);
      setProfile((prev) => ({ ...prev, ...updatedFields }));
      return updated;
    } finally {
      setSaving(false);
    }
  };

  const saveAccessibilityData = async (updatedPrefs) => {
    setSaving(true);
    try {
      const userId = user?.id || "user_mock_12345";
      await updateAccessibilityPreferences(userId, updatedPrefs);
      setAccessibility(updatedPrefs);
    } finally {
      setSaving(false);
    }
  };

  const uploadResumeFile = async (file) => {
    setSaving(true);
    try {
      const userId = user?.id || "user_mock_12345";
      const fileName = await uploadResume(userId, file);
      setProfile((prev) => ({ ...prev, resume_url: fileName }));
      return fileName;
    } finally {
      setSaving(false);
    }
  };

  // Profile Completeness Calculation
  const calculateCompleteness = () => {
    if (!profile) return { percentage: 0, missing: [] };
    const missing = [];
    let score = 0;

    if (profile.full_name) score += 20; else missing.push("Full Name");
    if (profile.email) score += 20; else missing.push("Email");
    if (profile.phone) score += 15; else missing.push("Phone");
    if (profile.location) score += 15; else missing.push("Location");
    if (profile.skills && profile.skills.length > 0) score += 15; else missing.push("Skills");
    if (profile.resume_url) score += 15; else missing.push("Resume PDF");

    return { percentage: Math.min(score, 100), missing };
  };

  return {
    profile,
    accessibility,
    loading,
    saving,
    saveProfileData,
    saveAccessibilityData,
    uploadResumeFile,
    completeness: calculateCompleteness(),
  };
}
