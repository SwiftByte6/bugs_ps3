"use client";

import React, { useState, useEffect } from "react";
import { getJobs } from "@/lib/services/jobService";
import useApplications from "@/hooks/useApplications";
import JobCard from "@/components/jobs/JobCard";
import JobDetailsModal from "@/components/jobs/JobDetailsModal";
import Badge from "@/components/ui/Badge";
import Card, { CardContent } from "@/components/ui/Card";
import { Search, Sparkles, CheckCircle2 } from "lucide-react";

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [appliedToast, setAppliedToast] = useState("");

  const { addApplication } = useApplications();

  const filterOptions = ["All", "Remote", "React", "Next.js", "JavaScript", "Tailwind CSS"];

  useEffect(() => {
    async function loadJobs() {
      setLoading(true);
      try {
        const data = await getJobs(activeFilter);
        setJobs(data);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, [activeFilter]);

  const handleApplyWithSaarthi = async (job) => {
    await addApplication({
      company: job.company,
      role: job.title,
      platform: "Saarthi Assisted Direct",
      job_url: "#",
      status: "Applied",
      notes: `Applied with 1-click Saarthi companion. ${job.match_percentage}% profile match score.`,
    });

    setAppliedToast(`✓ Applied to ${job.title} at ${job.company}! Position added to application tracker.`);
    setTimeout(() => setAppliedToast(""), 4500);
  };

  const filteredJobs = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Toast Notification */}
      {appliedToast && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-xs font-bold flex items-center gap-2.5 shadow-md animate-in fade-in"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0 text-[#15803D]" />
          <span>{appliedToast}</span>
        </div>
      )}

      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1EBFF] text-[#40189D] text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Smart Match Discovery</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#222222] tracking-tight">
          Recommended Job Opportunities
        </h1>
        <p className="text-sm text-[#6F6F73] mt-1">
          Positions tailored to your professional skills and accessibility requirements.
        </p>
      </div>

      {/* Filter Controls Bar */}
      <Card className="bg-white border-[#E2E2E5]">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-[#F5F5F6] px-3.5 py-2 rounded-xl border border-[#E2E2E5] w-full md:w-80">
            <Search className="w-4 h-4 text-[#6F6F73]" />
            <input
              type="text"
              placeholder="Search job title or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-[#222222] focus:outline-hidden w-full font-medium"
            />
          </div>

          {/* Skill Filter Pills (Section 7 of design.md) */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {filterOptions.map((opt) => (
              <Badge
                key={opt}
                variant="default"
                size="md"
                selected={activeFilter === opt}
                onClick={() => setActiveFilter(opt)}
                className="cursor-pointer"
              >
                {opt}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Job Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#40189D]"></div>
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onViewDetails={(selected) => setSelectedJob(selected)}
              onApply={handleApplyWithSaarthi}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center bg-white border-[#E2E2E5]">
          <p className="text-sm font-semibold text-[#6F6F73]">
            No jobs found matching your search filter. Try selecting another skill pill.
          </p>
        </Card>
      )}

      {/* Job Details Modal */}
      <JobDetailsModal
        job={selectedJob}
        isOpen={Boolean(selectedJob)}
        onClose={() => setSelectedJob(null)}
        onApply={handleApplyWithSaarthi}
      />
    </div>
  );
}
