"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import useUser from "@/hooks/useUser";
import useApplications from "@/hooks/useApplications";
import useProfile from "@/hooks/useProfile";
import { getJobs } from "@/lib/services/jobService";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ApplicationCard from "@/components/applications/ApplicationCard";
import ApplicationDetailsModal from "@/components/applications/ApplicationDetailsModal";
import JobCard from "@/components/jobs/JobCard";
import JobDetailsModal from "@/components/jobs/JobDetailsModal";
import {
  FileCheck2,
  Clock,
  Calendar,
  UserCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function DashboardOverviewPage() {
  const { user } = useUser();
  const { allApplications, stats, updateStatus, removeApplication, addApplication } = useApplications();
  const { profile, completeness } = useProfile();

  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const name = profile?.full_name || user?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Candidate";

  useEffect(() => {
    async function loadRecommended() {
      setLoadingJobs(true);
      try {
        const data = await getJobs("All");
        setRecommendedJobs(data.slice(0, 3));
      } finally {
        setLoadingJobs(false);
      }
    }
    loadRecommended();
  }, []);

  const handleApplyWithSaarthi = async (job) => {
    await addApplication({
      company: job.company,
      role: job.title,
      platform: "Saarthi Assisted Direct",
      job_url: "#",
      status: "Applied",
      notes: `Applied with 1-click Saarthi companion. ${job.match_percentage}% profile match score.`,
    });

    setToastMessage(`✓ Applied to ${job.title} at ${job.company}!`);
    setTimeout(() => setToastMessage(""), 4500);
  };

  const recentApplications = allApplications.slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in"
        >
          <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222] tracking-tight">
            Welcome back, {name}
          </h1>
          <p className="text-sm text-[#6F6F73] mt-1">
            Your accessible job search command center at a glance.
          </p>
        </div>
        <Link href="/dashboard/jobs" passHref>
          <Button variant="primary" size="md" icon={ArrowRight} iconPosition="right" className="bg-[#40189D] hover:bg-[#32127A]">
            Find More Jobs
          </Button>
        </Link>
      </div>

      {/* Statistics Cards (Section 24 of design.md) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-[#E2E2E5]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#6F6F73]">Applications</p>
              <p className="text-3xl font-black text-[#222222] mt-1">{stats.total}</p>
              <p className="text-[11px] text-[#15803D] font-bold mt-1">+3 this week</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#F1EBFF] text-[#40189D]">
              <FileCheck2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E2E2E5]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#6F6F73]">Under Review</p>
              <p className="text-3xl font-black text-[#222222] mt-1">{stats.underReview}</p>
              <p className="text-[11px] text-[#B45309] font-bold mt-1">Active review status</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#FFFBEB] text-[#B45309]">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E2E2E5]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#6F6F73]">Interviews</p>
              <p className="text-3xl font-black text-[#222222] mt-1">{stats.interviews}</p>
              <p className="text-[11px] text-[#2563EB] font-bold mt-1">Upcoming schedules</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#EFF6FF] text-[#2563EB]">
              <Calendar className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E2E2E5]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#6F6F73]">Profile Strength</p>
              <p className="text-3xl font-black text-[#40189D] mt-1">{completeness.percentage}%</p>
              <p className="text-[11px] text-[#40189D] font-bold mt-1">Resume & Skills synced</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#F1EBFF] text-[#40189D]">
              <UserCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommended Opportunities Section */}
      <section aria-labelledby="recommended-jobs-heading">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 id="recommended-jobs-heading" className="text-xl font-bold text-[#222222] tracking-tight">
              Recommended Opportunities
            </h2>
            <p className="text-xs text-[#6F6F73]">
              Jobs tailored to your skills with high profile match scores.
            </p>
          </div>
          <Link href="/dashboard/jobs" className="text-xs font-bold text-[#40189D] hover:underline flex items-center gap-1">
            <span>View All Jobs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingJobs ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#40189D]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onViewDetails={(j) => setSelectedJob(j)}
                onApply={handleApplyWithSaarthi}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recent Applications Section */}
      <section aria-labelledby="recent-apps-heading">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 id="recent-apps-heading" className="text-xl font-bold text-[#222222] tracking-tight">
              Recent Applications
            </h2>
            <p className="text-xs text-[#6F6F73]">
              Your most recently tracked application entries.
            </p>
          </div>
          <Link href="/dashboard/applications" className="text-xs font-bold text-[#40189D] hover:underline flex items-center gap-1">
            <span>View Tracker</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentApplications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentApplications.map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                onViewDetails={(a) => setSelectedApp(a)}
              />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center bg-white border-[#E2E2E5]">
            <p className="text-xs text-[#6F6F73] font-medium mb-3">
              No recent applications tracked yet.
            </p>
            <Link href="/dashboard/jobs" passHref>
              <Button variant="primary" size="sm" className="bg-[#40189D] hover:bg-[#32127A]">
                Explore Jobs
              </Button>
            </Link>
          </Card>
        )}
      </section>

      {/* Modals */}
      <JobDetailsModal
        job={selectedJob}
        isOpen={Boolean(selectedJob)}
        onClose={() => setSelectedJob(null)}
        onApply={handleApplyWithSaarthi}
      />

      <ApplicationDetailsModal
        application={selectedApp}
        isOpen={Boolean(selectedApp)}
        onClose={() => setSelectedApp(null)}
        onUpdateStatus={updateStatus}
        onDelete={removeApplication}
      />
    </div>
  );
}
