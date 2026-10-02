"use client";

import React from "react";
import Badge from "./Badge";

export default function SectionHeading({
  badgeText,
  title,
  subtitle,
  centered = false,
  className = "",
}) {
  return (
    <div
      className={`max-w-3xl ${
        centered ? "mx-auto text-center" : ""
      } mb-12 lg:mb-16 ${className}`}
    >
      {badgeText && (
        <div className="mb-3 inline-block">
          <Badge variant="primary" size="md">
            {badgeText}
          </Badge>
        </div>
      )}
      {title && (
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#222222] tracking-tight leading-tight">
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="mt-4 text-lg text-[#6F6F73] leading-relaxed font-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
}
