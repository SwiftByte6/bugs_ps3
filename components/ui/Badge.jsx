"use client";

import React from "react";

export default function Badge({
  children,
  variant = "default",
  size = "md",
  className = "",
  icon: Icon,
  selected = false,
}) {
  const base =
    "inline-flex items-center font-medium rounded-full border transition-all select-none";

  const variants = {
    default: selected
      ? "bg-[#40189D] text-white border-[#40189D] font-semibold"
      : "bg-[#F1EBFF] text-[#40189D] border-transparent font-medium hover:bg-[#E5D7FF]",
    primary:
      "bg-[#F1EBFF] text-[#40189D] border-transparent font-semibold",
    success:
      "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0] font-semibold",
    warning:
      "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A] font-semibold",
    danger:
      "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA] font-semibold",
    info:
      "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE] font-semibold",
  };

  const sizes = {
    sm: "px-2.5 py-0.5 text-xs gap-1",
    md: "px-3 py-1 text-xs gap-1.5",
    lg: "px-4 py-1.5 text-sm gap-2 font-semibold",
  };

  return (
    <span
      className={`${base} ${variants[variant] || variants.default} ${
        sizes[size] || sizes.md
      } ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
      {children}
    </span>
  );
}
