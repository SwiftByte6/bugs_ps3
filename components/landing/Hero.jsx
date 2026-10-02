"use client";

import React from "react";
import Link from "next/link";
import Container from "../ui/Container";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Keyboard,
  Eye,
  Volume2,
  Handshake,
} from "lucide-react";

export default function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden bg-[#F5F5F6]"
    >
      <Container size="lg" className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline & Action CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <Badge variant="primary" size="lg" icon={Sparkles} className="mb-6 bg-[#F1EBFF] text-[#40189D] border-transparent">
              Empowering Inclusive Careers
            </Badge>

            <h1
              id="hero-heading"
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#222222] tracking-tight leading-[1.12]"
            >
              Navigate Job Applications{" "}
              <span className="text-[#40189D]">
                Without Barriers
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-[#6F6F73] font-normal leading-relaxed max-w-2xl">
              <strong className="font-semibold text-[#222222]">
                Saarthi helps people with disabilities navigate job applications without fighting inaccessible interfaces.
              </strong>{" "}
              Personalized accessibility adaptations, intelligent form assistance, and streamlined application tracking—all tuned to your needs.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-4 w-full sm:w-auto">
              <Link href="/signup" passHref className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  icon={ArrowRight}
                  iconPosition="right"
                  className="w-full sm:w-auto shadow-xs bg-[#40189D] hover:bg-[#32127A]"
                >
                  Get Started
                </Button>
              </Link>
              <Link href="#how-it-works" passHref className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto bg-white border-[#E2E2E5] text-[#333333] hover:bg-[#F5F5F6]">
                  How Saarthi Works
                </Button>
              </Link>
            </div>

            {/* Feature Highlights */}
            <div className="mt-10 pt-8 border-t border-[#E2E2E5] grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#15803D] shrink-0" aria-hidden="true" />
                <span className="text-xs font-semibold text-[#222222]">
                  WCAG 2.1 AAA First
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Keyboard className="w-5 h-5 text-[#40189D] shrink-0" aria-hidden="true" />
                <span className="text-xs font-semibold text-[#222222]">
                  Full Keyboard Nav
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Handshake className="w-5 h-5 text-[#40189D] shrink-0" aria-hidden="true" />
                <span className="text-xs font-semibold text-[#222222]">
                  Assisted Discovery
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Assistive Interactive Preview Card */}
          <div className="lg:col-span-5 w-full">
            <Card className="p-6 sm:p-8 bg-white border-[#E2E2E5] shadow-xs relative">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#F1F1F3]">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-xs font-mono text-[#99999D]">saarthi-companion.active</span>
                </div>
                <Badge variant="primary" size="sm" className="bg-[#F1EBFF] text-[#40189D]">
                  Active Companion
                </Badge>
              </div>

              {/* Extension Companion Simulation */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#F1EBFF] border border-purple-200">
                  <div className="flex items-center gap-2 text-[#40189D] font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-[#40189D]" />
                    <span>Active Profile Adaptation</span>
                  </div>
                  <p className="text-xs text-[#40189D] mt-1 font-medium">
                    "High Contrast + Keyboard Nav enabled for Senior Frontend Engineer."
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F5F5F6] border border-[#E2E2E5] space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#222222]">
                    <span>Job Platform Detected</span>
                    <span className="text-[#40189D] font-mono font-bold">LinkedIn Jobs</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-[#E2E2E5] flex items-center justify-between shadow-xs">
                    <div>
                      <h4 className="text-sm font-bold text-[#222222]">
                        Accessibility Software Engineer
                      </h4>
                      <p className="text-xs text-[#6F6F73]">TechAccess Inc. • Hybrid</p>
                    </div>
                    <Badge variant="primary" size="sm">
                      91% Match
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[#6F6F73]">Auto-fill Readiness</span>
                    <span className="font-bold text-[#15803D]">Ready (Resume Synced)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#F1EBFF] border border-purple-200 text-[#40189D] font-semibold flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#40189D]" />
                    <span>Simplified View</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-[#E2E2E5] text-[#222222] font-semibold flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-[#40189D]" />
                    <span>Read Aloud</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </section>
  );
}
