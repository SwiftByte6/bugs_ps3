"use client";

import React from "react";
import Link from "next/link";
import Container from "../ui/Container";
import Button from "../ui/Button";
import { ArrowRight, Sparkles, ShieldCheck } from "lucide-react";

export default function CTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-purple-800 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      <Container size="md" className="relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-100 text-xs font-semibold backdrop-blur-md mb-6 border border-white/15">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Start Your Barrier-Free Job Search</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
          Ready to Experience Accessible Job Applications?
        </h2>

        <p className="mt-4 text-lg text-purple-100 max-w-xl mx-auto font-normal leading-relaxed">
          Create your Saarthi profile, define your accessibility preferences, and take back control of your application workflow today.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup" passHref className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="lg"
              icon={ArrowRight}
              iconPosition="right"
              className="w-full sm:w-auto shadow-lg bg-white text-purple-900 hover:bg-slate-100 font-bold"
            >
              Get Started Free
            </Button>
          </Link>
          <Link href="/login" passHref className="w-full sm:w-auto">
            <Button
              variant="ghost"
              size="lg"
              className="w-full sm:w-auto text-white hover:bg-white/10 border border-white/20"
            >
              Sign In to Account
            </Button>
          </Link>
        </div>

        <div className="mt-10 flex items-center justify-center gap-6 text-xs text-purple-200/90 font-medium">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            No credit card required
          </span>
          <span>•</span>
          <span>100% Free for Job Seekers</span>
        </div>
      </Container>
    </section>
  );
}
