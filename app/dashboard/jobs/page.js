"use client";

import React, { useState, useEffect } from "react";
import { getJobs, getScrapedJobs } from "@/lib/services/jobService";
import JobCard from "@/components/jobs/JobCard";
import JobDetailsModal from "@/components/jobs/JobDetailsModal";
import SmartApplyModal from "@/components/jobs/SmartApplyModal";
import Badge from "@/components/ui/Badge";
import Card, { CardContent } from "@/components/ui/Card";
import { Search, Sparkles, CheckCircle2, Globe2, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [scrapedJobs, setScrapedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingScraped, setLoadingScraped] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [smartApplyJob, setSmartApplyJob] = useState(null);
  const [appliedToast, setAppliedToast] = useState("");

  const filterOptions = ["All", "Remote", "React", "Next.js", "JavaScript", "Tailwind CSS"];

  async function loadData() {
    setLoading(true);
    try {
      const [data, scraped] = await Promise.all([
        getJobs(activeFilter),
        getScrapedJobs()
      ]);
      setJobs(data);
      setScrapedJobs(scraped);
    } finally {
      setLoading(false);
    }
  }

  async function refreshScraped() {
    setLoadingScraped(true);
    try {
      const scraped = await getScrapedJobs();
      setScrapedJobs(scraped);
    } finally {
      setLoadingScraped(false);
    }
  }

  useEffect(() => {
    loadData();

    // Auto-sync scraped jobs periodically & when tab is focused
    const intervalId = setInterval(() => {
      getScrapedJobs().then((scraped) => {
        if (Array.isArray(scraped) && scraped.length > 0) {
          setScrapedJobs(scraped);
        }
      });
    }, 4000);

    const onFocus = () => {
      refreshScraped();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [activeFilter]);

  const handleOpenSmartApply = (job) => {
    setSelectedJob(null);
    setSmartApplyJob(job);
  };

  const handleSmartApplySuccess = (job) => {
    setAppliedToast(`✓ Smart Apply completed for ${job.title} at ${job.company}! Added to application tracker.`);
    setTimeout(() => setAppliedToast(""), 5000);
  };

  const filteredJobs = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredScrapedJobs = scrapedJobs.filter(
    (j) =>
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
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
          <span>Smart Match & Smart Apply</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#222222] tracking-tight">
          Job Opportunities & Portals
        </h1>
        <p className="text-sm text-[#6F6F73] mt-1">
          Positions tailored to your professional skills and accessibility requirements. Use Saarthi Smart Apply for controlled form mapping.
        </p>
      </div>

      {/* Section 1: Recently Scraped / Found Jobs (Requirement 4 & 13) */}
      <section aria-labelledby="scraped-jobs-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
              <Globe2 className="w-4 h-4" />
            </div>
            <div>
              <h2 id="scraped-jobs-heading" className="text-lg font-bold text-[#222222]">
                Recently Searched & Extension Scraped Jobs
              </h2>
              <p className="text-xs text-[#6F6F73]">
                Live openings detected by the Saarthi Companion extension on supported job portals.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshScraped}
            disabled={loadingScraped}
            className="flex items-center gap-1.5 text-xs text-purple-700 border-purple-200 hover:bg-purple-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingScraped ? "animate-spin" : ""}`} />
            <span>Refresh Scraped</span>
          </Button>
        </div>

        {scrapedJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScrapedJobs.map((job) => (
              <JobCard
                key={job.id || job.job_id}
                job={{
                  ...job,
                  match_percentage: job.match_percentage || 90,
                  skills: job.skills || [],
                  matched_skills: job.matched_skills || (job.skills || []).slice(0, 3),
                  missing_skills: job.missing_skills || []
                }}
                onViewDetails={(selected) => setSelectedJob(selected)}
                onApply={handleOpenSmartApply}
              />
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center bg-purple-50/50 border-purple-100 rounded-xl">
            <p className="text-xs text-[#6F6F73] font-medium">
              No scraped jobs synced yet. Visit{" "}
              <a
                href="/test-jobs"
                target="_blank"
                rel="noreferrer"
                className="text-purple-700 font-bold underline"
              >
                http://localhost:3000/test-jobs
              </a>{" "}
              and click <strong>Scrape Portal Jobs</strong> in the extension to ingest live jobs.
            </p>
          </Card>
        )}
      </section>

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

          {/* Skill Filter Pills */}
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

      {/* Section 2: Catalog Recommended Opportunities */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#222222]">
            Recommended Opportunities ({filteredJobs.length})
          </h2>
          <p className="text-xs text-[#6F6F73]">
            Curated catalog opportunities matching your candidate profile.
          </p>
        </div>

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
                onApply={handleOpenSmartApply}
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
      </section>

      {/* Job Details Modal */}
      <JobDetailsModal
        job={selectedJob}
        isOpen={Boolean(selectedJob)}
        onClose={() => setSelectedJob(null)}
        onApply={handleOpenSmartApply}
      />

      {/* Saarthi Smart Apply Controlled Flow Modal */}
      <SmartApplyModal
        job={smartApplyJob}
        isOpen={Boolean(smartApplyJob)}
        onClose={() => setSmartApplyJob(null)}
        onSuccess={handleSmartApplySuccess}
      />
    </div>
  );
}

