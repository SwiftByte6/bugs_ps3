"use client";

import React, { useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

export default function FormInput({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  helperText,
  required = false,
  autoComplete,
  className = "",
  disabled = false,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {/* Explicit Accessible Label */}
      <label
        htmlFor={id}
        className="text-sm font-semibold text-[#222222] flex items-center justify-between"
      >
        <span>
          {label}
          {required && <span className="text-[#B91C1C] ml-1 font-bold" aria-hidden="true">*</span>}
        </span>
      </label>

      {/* Input Field */}
      <div className="relative flex items-center">
        <input
          id={id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? errorId : helperText ? helperId : undefined
          }
          className={`w-full h-11 px-3.5 rounded-xl border bg-white text-[#222222] text-sm font-medium transition-all focus:outline-hidden ${
            error
              ? "border-[#B91C1C] focus:border-[#B91C1C] focus:ring-2 focus:ring-red-100"
              : "border-[#E2E2E5] focus:border-[#40189D] focus:ring-3 focus:ring-[#F1EBFF]"
          } ${isPassword ? "pr-10" : ""}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 text-[#99999D] hover:text-[#222222] p-1 rounded-md focus-visible:ring-2 focus-visible:ring-[#40189D]"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>

      {error ? (
        <p id={errorId} className="text-xs font-semibold text-[#B91C1C] flex items-center gap-1.5 mt-0.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-[#6F6F73] mt-0.5">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
