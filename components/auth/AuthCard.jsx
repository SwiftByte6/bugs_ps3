"use client";

import React from "react";
import Link from "next/link";
import Card, { CardContent } from "../ui/Card";
import { Sparkles, ShieldCheck } from "lucide-react";

export default function AuthCard({ title, subtitle, children, footerText, footerLinkText, footerLinkHref }) {
  return (
    <div className="w-full max-w-md mx-auto py-8 select-none">
      {/* Saarthi Branding Header */}
      <div className="text-center mb-6 flex flex-col items-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-3 group focus-visible:ring-2 focus-visible:ring-[#40189D] rounded-lg p-1">
          <div className="w-11 h-11 rounded-2xl bg-[#40189D] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Sparkles className="w-6 h-6 fill-current text-white" />
          </div>
          <span className="text-2xl font-black text-[#222222] tracking-tight">
            Saarthi
          </span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#222222] tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-[#6F6F73] mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {/* Main Form Card */}
      <Card className="shadow-xs border-[#E2E2E5] bg-white">
        <CardContent className="p-6 sm:p-8">
          {children}

          {/* Accessibility Assurance Banner */}
          <div className="mt-6 pt-4 border-t border-[#F1F1F3] flex items-center justify-center gap-2 text-xs text-[#6F6F73] font-medium">
            <ShieldCheck className="w-4 h-4 text-[#40189D] shrink-0" />
            <span>WCAG 2.1 AAA Compliant Access</span>
          </div>
        </CardContent>
      </Card>

      {/* Footer link */}
      {footerText && (
        <div className="text-center mt-6 text-sm font-medium text-[#6F6F73]">
          {footerText}{" "}
          <Link
            href={footerLinkHref}
            className="font-bold text-[#40189D] hover:underline focus-visible:ring-2 focus-visible:ring-[#40189D] rounded-xs"
          >
            {footerLinkText}
          </Link>
        </div>
      )}
    </div>
  );
}
