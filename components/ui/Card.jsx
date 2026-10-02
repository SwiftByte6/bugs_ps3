"use client";

import React from "react";

export function Card({ children, className = "", ...props }) {
  return (
    <div
      className={`bg-white border border-[#E2E2E5] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }) {
  return (
    <div className={`px-6 pt-6 pb-4 border-b border-[#F1F1F3] ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "", as: Component = "h3" }) {
  return (
    <Component className={`text-lg font-bold text-[#222222] tracking-tight ${className}`}>
      {children}
    </Component>
  );
}

export function CardDescription({ children, className = "" }) {
  return (
    <p className={`text-sm text-[#6F6F73] mt-1 ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = "" }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = "" }) {
  return (
    <div className={`px-6 py-4 bg-[#F5F5F6]/60 border-t border-[#F1F1F3] flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
}

export default Card;
