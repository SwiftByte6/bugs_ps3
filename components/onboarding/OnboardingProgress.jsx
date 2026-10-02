"use client";

import React from "react";
import Badge from "../ui/Badge";
import { Sparkles } from "lucide-react";

export default function OnboardingProgress({ currentStep = 1, totalSteps = 2 }) {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full max-w-xl mx-auto mb-8">
      <div className="flex items-center justify-between mb-2 text-xs font-semibold text-[#6F6F73]">
        <span className="flex items-center gap-1.5 text-[#40189D]">
          <Sparkles className="w-3.5 h-3.5" />
          Step {currentStep} of {totalSteps}
        </span>
        <span>{percentage}% Completed</span>
      </div>
      <div className="w-full h-2 bg-[#E2E2E5] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#40189D] transition-all duration-300 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
