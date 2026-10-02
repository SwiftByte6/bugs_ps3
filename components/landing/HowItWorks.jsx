"use client";

import React from "react";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import Card from "../ui/Card";
import {
  UserPlus,
  Sliders,
  Puzzle,
  Briefcase,
  LayoutDashboard,
} from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      icon: UserPlus,
      title: "Account Setup",
      desc: "Create your free account securely in seconds with email and password.",
    },
    {
      num: "02",
      icon: Sliders,
      title: "Accessibility Onboarding",
      desc: "Select visual, motor, reading, hearing, or voice assistance modes. No disease-based queries.",
    },
    {
      num: "03",
      icon: Puzzle,
      title: "Connect Chrome Extension",
      desc: "Install the companion extension to carry your preferences and profile onto external job sites.",
    },
    {
      num: "04",
      icon: Briefcase,
      title: "Assisted Application",
      desc: "Browse jobs with simplified view, keyboard shortcuts, and smart form pre-filling.",
    },
    {
      num: "05",
      icon: LayoutDashboard,
      title: "Application Tracking",
      desc: "Monitor all applied positions, statuses, and notes in your centralized Saarthi dashboard.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-white border-t border-[#E2E2E5]">
      <Container size="lg">
        <SectionHeading
          badgeText="Simple Step-by-Step"
          title="How Saarthi Works"
          subtitle="From setup to receiving offers, Saarthi guides you with adaptive tools at every stage of your job search."
          centered
        />

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <Card
                key={idx}
                className="p-6 relative bg-[#F5F5F6] border-[#E2E2E5] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-[#40189D]/40 font-mono">
                      {step.num}
                    </span>
                    <div className="p-2.5 rounded-xl bg-white border border-[#E2E2E5] shadow-xs text-[#40189D]">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-[#222222] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-[#6F6F73] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
