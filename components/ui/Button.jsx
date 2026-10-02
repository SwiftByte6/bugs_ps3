"use client";

import React from "react";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  isLoading = false,
  ariaLabel,
  onClick,
  type = "button",
  icon: Icon,
  iconPosition = "left",
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#40189D] disabled:opacity-60 disabled:cursor-not-allowed select-none active:scale-[0.99]";

  const variants = {
    primary:
      "bg-[#40189D] hover:bg-[#32127A] text-white border border-transparent shadow-xs active:bg-[#280E63]",
    secondary:
      "bg-white hover:bg-[#F5F5F6] text-[#333333] border border-[#E2E2E5] shadow-xs",
    outline:
      "bg-white hover:bg-[#F1EBFF] text-[#40189D] border border-[#40189D]",
    ghost:
      "bg-transparent hover:bg-[#F1EBFF] text-[#333333]",
    danger:
      "bg-[#B91C1C] hover:bg-[#991B1B] text-white border border-transparent shadow-xs",
  };

  const sizes = {
    sm: "h-9 px-3 py-1.5 text-xs gap-1.5 rounded-lg",
    md: "h-11 px-4 py-2.5 text-sm gap-2 rounded-xl font-semibold",
    lg: "h-12 px-6 py-3 text-base gap-2.5 rounded-xl font-bold",
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-busy={isLoading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${
        sizes[size] || sizes.md
      } ${className}`}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}

      {Icon && iconPosition === "left" && !isLoading && (
        <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      )}

      <span>{children}</span>

      {Icon && iconPosition === "right" && !isLoading && (
        <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      )}
    </button>
  );
}
