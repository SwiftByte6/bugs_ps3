"use client";

import React from "react";
import { Check } from "lucide-react";

export default function AccessibilityOptionCard({
  id,
  title,
  description,
  icon: Icon,
  selected = false,
  onToggle,
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={() => onToggle(id)}
      className={`w-full text-left p-6 rounded-2xl border transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#40189D] ${
        selected
          ? "bg-[#F1EBFF] border-[#40189D] shadow-xs"
          : "bg-white border-[#E2E2E5] hover:bg-[#F5F5F6]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`p-3 rounded-xl shrink-0 ${
              selected
                ? "bg-[#40189D] text-white"
                : "bg-[#F5F5F6] text-[#40189D]"
            }`}
          >
            <Icon className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#222222]">
              {title}
            </h3>
            <p className="text-xs text-[#6F6F73] mt-1 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Check Indicator */}
        <div
          className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
            selected
              ? "bg-[#40189D] border-[#40189D] text-white"
              : "border-[#E2E2E5] bg-white"
          }`}
        >
          {selected && <Check className="w-4 h-4 stroke-[3]" />}
        </div>
      </div>
    </button>
  );
}
