"use client";

import React from "react";
import Card, { CardHeader, CardTitle, CardContent } from "../ui/Card";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function ProfileCompleteness({ percentage = 80, missing = [] }) {
  return (
    <Card className="bg-white border-[#E2E2E5] mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Profile Completeness</span>
          <span className="text-xl font-black text-[#40189D]">{percentage}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="w-full h-3 bg-[#E2E2E5] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#40189D] transition-all duration-300 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {missing.length > 0 ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              <span>Recommended to reach 100% completion:</span>
            </div>
            <ul className="list-disc list-inside text-amber-800 space-y-0.5 ml-2 font-medium">
              {missing.map((item, idx) => (
                <li key={idx}>Add {item}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs flex items-center gap-2 text-[#15803D] font-bold">
            <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
            <span>Your profile is 100% complete and ready for instant job applications!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
