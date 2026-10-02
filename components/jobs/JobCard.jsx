"use client";

import React from "react";
import Card, { CardContent } from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { Sparkles, MapPin, CheckCircle2, ArrowRight } from "lucide-react";

export default function JobCard({ job, onViewDetails, onApply }) {
  return (
    <Card className="bg-white border-[#E2E2E5] hover:border-[#40189D]/40 transition-all flex flex-col justify-between h-full">
      <CardContent className="p-6 flex flex-col justify-between h-full">
        <div>
          {/* Company & Header */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-[#6F6F73] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#40189D]" />
              {job.company}
            </span>
            <Badge variant="primary" size="sm">
              {job.work_mode}
            </Badge>
          </div>

          {/* Job Title */}
          <h3 className="text-lg font-bold text-[#222222] line-clamp-1 mb-1">
            {job.title}
          </h3>

          {/* Location & Salary */}
          <div className="flex items-center gap-2 text-xs text-[#6F6F73] font-medium mb-4">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#40189D]" />
              {job.location}
            </span>
            <span>•</span>
            <span>{job.type}</span>
          </div>

          {/* Skill Pills (Section 7 of design.md) */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {job.skills.map((skill) => (
              <Badge key={skill} variant="primary" size="sm">
                {skill}
              </Badge>
            ))}
          </div>

          {/* Profile Match Progress Bar (Section 26 of design.md) */}
          <div className="p-3.5 rounded-xl bg-[#F5F5F6] border border-[#E2E2E5] mb-5">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="flex items-center gap-1 text-[#40189D]">
                <Sparkles className="w-3.5 h-3.5 text-[#40189D]" />
                {job.match_percentage}% Profile Match
              </span>
              <span className="text-[#6F6F73] font-medium text-[11px]">
                {job.matched_skills.length} matching skills
              </span>
            </div>

            <div className="w-full h-2 bg-[#E2E2E5] rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-[#40189D] rounded-full"
                style={{ width: `${job.match_percentage}%` }}
              />
            </div>

            <p className="text-[11px] text-[#6F6F73] line-clamp-1">
              Why you match: {job.matched_skills.map((s) => `✓ ${s}`).join(" ")}
            </p>
          </div>
        </div>

        {/* Action Buttons (Section 8 of design.md) */}
        <div className="pt-4 border-t border-[#F1F1F3] flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onViewDetails(job)}
            className="flex-1"
          >
            View Details
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onApply(job)}
            icon={ArrowRight}
            iconPosition="right"
            className="flex-1 bg-[#40189D] hover:bg-[#32127A]"
          >
            Apply with Saarthi
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
