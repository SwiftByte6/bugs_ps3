"use client";

import React from "react";
import Card, { CardContent } from "../ui/Card";
import Badge from "../ui/Badge";
import { User, MapPin, Mail, Phone } from "lucide-react";

export default function ProfileHeader({ profile, completenessPercentage }) {
  const name = profile?.full_name || "Job Candidate";
  const email = profile?.email || "candidate@example.com";
  const phone = profile?.phone || "Not provided";
  const location = profile?.location || "Not provided";

  return (
    <Card className="mb-6 bg-white border-[#E2E2E5]">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#F1EBFF] text-[#40189D] border border-purple-200 flex items-center justify-center font-bold text-xl shrink-0">
              <User className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-[#222222] tracking-tight">
                  {name}
                </h1>
                <Badge variant="primary" size="sm">
                  Active Candidate
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs text-[#6F6F73] font-medium">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#40189D]" />
                  {email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#40189D]" />
                  {phone}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#40189D]" />
                  {location}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-[#6F6F73] font-semibold mb-1">
              Profile Strength
            </div>
            <div className="text-2xl font-extrabold text-[#40189D]">
              {completenessPercentage}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
