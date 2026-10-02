"use client";

import React from "react";
import Card, { CardContent } from "../ui/Card";
import ApplicationStatusBadge from "./ApplicationStatusBadge";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { ExternalLink, Calendar, FileText } from "lucide-react";

export default function ApplicationCard({ application, onViewDetails }) {
  return (
    <Card className="bg-white border-[#E2E2E5] hover:border-[#40189D]/40 transition-colors">
      <CardContent className="p-6 flex flex-col justify-between h-full">
        <div>
          {/* Header Row: Platform & Status */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <Badge variant="primary" size="sm">
              {application.platform}
            </Badge>
            <ApplicationStatusBadge status={application.status} size="sm" />
          </div>

          {/* Role & Company */}
          <h3 className="text-lg font-bold text-[#222222] line-clamp-1 mb-1">
            {application.role}
          </h3>
          <p className="text-sm font-semibold text-[#40189D] mb-3">
            {application.company}
          </p>

          {/* Applied Date */}
          <div className="flex items-center gap-1.5 text-xs text-[#6F6F73] font-medium mb-3">
            <Calendar className="w-3.5 h-3.5" />
            <span>Applied {application.applied_at}</span>
          </div>

          {/* Notes Snippet */}
          {application.notes && (
            <p className="text-xs text-[#6F6F73] bg-[#F5F5F6] p-2.5 rounded-xl line-clamp-2 border border-[#E2E2E5] mb-4">
              {application.notes}
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[#F1F1F3] flex items-center justify-between">
          <a
            href={application.job_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-[#40189D] hover:underline inline-flex items-center gap-1"
          >
            <span>Job Link</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onViewDetails(application)}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
