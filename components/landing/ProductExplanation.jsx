"use client";

import React from "react";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import Card, { CardContent } from "../ui/Card";
import { Sliders, MousePointerClick, FileCheck } from "lucide-react";

export default function ProductExplanation() {
  const pillars = [
    {
      icon: Sliders,
      title: "Self-Defined Preferences",
      description:
        "We never ask intrusive medical questions. You decide exactly how Saarthi assists you—whether through high contrast, keyboard shortcuts, voice navigation, or simplified text.",
      color: "bg-[#F1EBFF] text-[#40189D]",
    },
    {
      icon: MousePointerClick,
      title: "Smart Application Companion",
      description:
        "Saarthi integrates seamlessly with your favorite job portals, streamlining complex forms and eliminating inaccessible UI hurdles automatically.",
      color: "bg-[#F1EBFF] text-[#40189D]",
    },
    {
      icon: FileCheck,
      title: "Single Source of Truth Profile",
      description:
        "Store your skills, resume, links, and accessibility preferences in one secure dashboard. One click syncs your profile across platforms.",
      color: "bg-[#F1EBFF] text-[#40189D]",
    },
  ];

  return (
    <section id="features" className="py-20 bg-white border-y border-[#E2E2E5]">
      <Container size="lg">
        <SectionHeading
          badgeText="Why Saarthi Exists"
          title="Designed to Remove Job Portal Friction"
          subtitle="Traditional job portals often present overwhelming forms, poor color contrast, and broken keyboard navigation. Saarthi bridges the gap with intelligent, accessible assistance."
          centered
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <Card key={idx} className="h-full border-[#E2E2E5]">
                <CardContent className="p-8 flex flex-col items-start h-full">
                  <div className={`p-4 rounded-2xl mb-6 ${pillar.color}`}>
                    <Icon className="w-7 h-7" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-bold text-[#222222] mb-3">
                    {pillar.title}
                  </h3>
                  <p className="text-[#6F6F73] text-sm leading-relaxed">
                    {pillar.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
