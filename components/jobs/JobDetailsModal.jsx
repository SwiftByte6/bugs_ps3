"use client";

import React from "react";
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { X, Sparkles, MapPin, CheckCircle2, ArrowRight, BookOpen } from "lucide-react";

export default function JobDetailsModal({ job, isOpen, onClose, onApply }) {
  if (!isOpen || !job) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="job-modal-title"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Card className="bg-white shadow-2xl border-[#E2E2E5]">
          <CardHeader className="flex items-start justify-between pb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="primary" size="sm">
                  {job.work_mode}
                </Badge>
                <span className="text-xs font-bold text-[#40189D]">
                  {job.company}
                </span>
              </div>
              <CardTitle id="job-modal-title" className="text-2xl">
                {job.title}
              </CardTitle>
              <div className="flex items-center gap-3 text-xs text-[#6F6F73] mt-1 font-medium">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#40189D]" />
                  {job.location}
                </span>
                <span>•</span>
                <span>{job.salary}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 rounded-lg text-[#6F6F73] hover:bg-[#F5F5F6]"
            >
              <X className="w-5 h-5" />
            </button>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* AI Simplified Description Box */}
            <div className="p-4 rounded-xl bg-[#F1EBFF] border border-purple-200">
              <div className="flex items-center gap-2 text-[#40189D] font-bold text-sm mb-1">
                <BookOpen className="w-4 h-4 text-[#40189D]" />
                <span>Simplified Job Summary</span>
              </div>
              <p className="text-xs text-[#40189D] leading-relaxed font-medium">
                {job.simplified_summary}
              </p>
            </div>

            {/* Profile Match Explanation */}
            <div className="p-4 rounded-xl bg-[#F5F5F6] border border-[#E2E2E5]">
              <div className="flex items-center justify-between text-xs font-bold text-[#222222] mb-2">
                <span className="flex items-center gap-1.5 text-[#40189D]">
                  <Sparkles className="w-4 h-4" />
                  {job.match_percentage}% Profile Match Breakdown
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-bold text-[#15803D] block mb-1">
                    Matching Skills:
                  </span>
                  <ul className="space-y-1">
                    {job.matched_skills.map((s) => (
                      <li key={s} className="flex items-center gap-1 text-[#222222]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {job.missing_skills.length > 0 && (
                  <div>
                    <span className="font-bold text-[#B45309] block mb-1">
                      Nice to have skills:
                    </span>
                    <ul className="space-y-1 text-[#6F6F73]">
                      {job.missing_skills.map((s) => (
                        <li key={s}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Full Description */}
            <div>
              <h4 className="text-sm font-bold text-[#222222] mb-2">
                Full Job Description
              </h4>
              <p className="text-xs text-[#6F6F73] leading-relaxed">
                {job.description}
              </p>
            </div>

            {/* Required Skills */}
            <div>
              <h4 className="text-sm font-bold text-[#222222] mb-2">
                Required Tech Stack & Skills
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map((s) => (
                  <Badge key={s} variant="primary" size="sm">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between gap-3">
            <Button variant="secondary" size="md" onClick={onClose}>
              Close
            </Button>
            <div className="flex items-center gap-2.5">
              {job.job_url && (
                <a
                  href={job.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-white text-[#40189D] border border-[#40189D] hover:bg-purple-50 transition-all shadow-xs"
                >
                  <span>Open Application Page</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              )}
              <Button
                variant="primary"
                size="md"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => {
                  onApply(job);
                  onClose();
                }}
                className="bg-[#40189D] hover:bg-[#32127A] font-bold"
              >
                Smart Apply with Saarthi
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
