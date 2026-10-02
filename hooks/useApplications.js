"use client";

import { useState, useEffect } from "react";
import useUser from "./useUser";
import {
  getApplications,
  createApplication,
  updateApplicationStatus,
  deleteApplication,
} from "../lib/services/applicationService";

export default function useApplications() {
  const { user } = useUser();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const userId = user?.id || "user_mock_12345";

  useEffect(() => {
    async function loadApps() {
      setLoading(true);
      try {
        const data = await getApplications(userId);
        setApplications(data);
      } catch (err) {
        console.error("Error loading applications:", err);
      } finally {
        setLoading(false);
      }
    }
    loadApps();
  }, [userId]);

  const addApplication = async (appData) => {
    setSaving(true);
    try {
      const created = await createApplication(userId, appData);
      setApplications((prev) => [created, ...prev]);
      return created;
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (appId, newStatus, notes) => {
    setSaving(true);
    try {
      await updateApplicationStatus(userId, appId, newStatus, notes);
      setApplications((prev) =>
        prev.map((app) =>
          app.id === appId
            ? {
                ...app,
                status: newStatus,
                notes: notes !== undefined ? notes : app.notes,
              }
            : app
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const removeApplication = async (appId) => {
    setSaving(true);
    try {
      await deleteApplication(userId, appId);
      setApplications((prev) => prev.filter((a) => a.id !== appId));
    } finally {
      setSaving(false);
    }
  };

  // Filtered Applications Calculation
  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.platform.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Statistics Calculation (Section 24 of design.md)
  const stats = {
    total: applications.length,
    applied: applications.filter((a) => a.status === "Applied").length,
    underReview: applications.filter((a) => a.status === "Under Review").length,
    interviews: applications.filter((a) => a.status === "Interview").length,
    offers: applications.filter((a) => a.status === "Offer").length,
    rejected: applications.filter((a) => a.status === "Rejected").length,
  };

  return {
    applications: filteredApplications,
    allApplications: applications,
    loading,
    saving,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    addApplication,
    updateStatus,
    removeApplication,
    stats,
  };
}
