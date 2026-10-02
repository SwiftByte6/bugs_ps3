"use client";

import React, { useState } from "react";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import {
  Eye,
  Keyboard,
  BookOpen,
  Mic,
  Volume2,
  CheckCircle2,
} from "lucide-react";

export default function AccessibilityFeatures() {
  const [activeTab, setActiveTab] = useState("visual");

  const categories = [
    {
      id: "visual",
      name: "Visual Assistance",
      icon: Eye,
      items: [
        {
          title: "Screen-Reader Friendly Structure",
          desc: "Full ARIA landmark coverage, explicit labels, screen reader live regions, and semantic HTML5 throughout.",
        },
        {
          title: "High Contrast Mode",
          desc: "WCAG AAA compliant high-contrast mode with yellow/white on dark backgrounds for low-vision users.",
        },
        {
          title: "Integrated Read Aloud",
          desc: "Text-to-speech audio guidance for complex job descriptions and form labels.",
        },
      ],
    },
    {
      id: "motor",
      name: "Motor Assistance",
      icon: Keyboard,
      items: [
        {
          title: "Keyboard-First Navigation",
          desc: "Single-key shortcuts, focus trap management, skip links, and zero mouse dependency.",
        },
        {
          title: "Simplified Interaction Targets",
          desc: "Large click and touch targets (min 48px), expanded touch padding, and input auto-advance.",
        },
        {
          title: "One-Click Quick Apply",
          desc: "Pre-fills multi-step forms automatically to eliminate tedious repeated manual typing.",
        },
      ],
    },
    {
      id: "reading",
      name: "Reading Assistance",
      icon: BookOpen,
      items: [
        {
          title: "Simplified Job Descriptions",
          desc: "AI distills complex corporate jargon into clear, concise bullet points.",
        },
        {
          title: "Dyslexia-Friendly Typography",
          desc: "Custom font spacing, optimized line heights, and dyslexia-legible text toggles.",
        },
        {
          title: "Focus Mode",
          desc: "Strip away sidebar clutter and ads to focus exclusively on application fields.",
        },
      ],
    },
    {
      id: "hearing",
      name: "Hearing & Communication",
      icon: Volume2,
      items: [
        {
          title: "Visual Captions & Alerts",
          desc: "All audio cues accompanied by visual notifications and status badges.",
        },
        {
          title: "Alternative Communication",
          desc: "Pre-written, accessible email templates and interview request notes.",
        },
      ],
    },
    {
      id: "voice",
      name: "Voice Assistance",
      icon: Mic,
      items: [
        {
          title: "Voice-to-Text Input",
          desc: "Dictate cover letter notes and form inputs effortlessly via voice recognition.",
        },
        {
          title: "Hands-Free Commands",
          desc: "'Next field', 'Submit application', 'Read job summary' voice commands.",
        },
      ],
    },
  ];

  const currentCategory = categories.find((c) => c.id === activeTab) || categories[0];

  return (
    <section id="accessibility" className="py-20 bg-[#F5F5F6]">
      <Container size="lg">
        <SectionHeading
          badgeText="Tailored For You"
          title="Accessibility Built Into Every Feature"
          subtitle="Choose the exact assistance options you need. Saarthi adapts the user interface around your preferences."
          centered
        />

        {/* Tab Selection */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-10" role="tablist" aria-label="Accessibility Options">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                role="tab"
                id={`tab-${cat.id}`}
                aria-selected={isSelected}
                aria-controls={`panel-${cat.id}`}
                onClick={() => setActiveTab(cat.id)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm transition-all focus-visible:outline-2 focus-visible:outline-[#40189D] ${
                  isSelected
                    ? "bg-[#40189D] text-white shadow-md scale-105"
                    : "bg-white text-[#333333] hover:bg-[#F1EBFF] border border-[#E2E2E5]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Active Feature Display Card */}
        <Card
          id={`panel-${currentCategory.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${currentCategory.id}`}
          className="p-8 bg-white border-[#E2E2E5] shadow-xs"
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#F1F1F3]">
            <div className="p-3 rounded-xl bg-[#F1EBFF] text-[#40189D]">
              <currentCategory.icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-[#222222]">
                {currentCategory.name}
              </h3>
              <p className="text-xs text-[#6F6F73] font-medium">
                Configurable in your Accessibility Onboarding & Profile
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {currentCategory.items.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#F5F5F6] border border-[#E2E2E5] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-[#40189D] shrink-0" />
                    <h4 className="text-base font-bold text-[#222222]">
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-xs text-[#6F6F73] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E2E2E5] flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#99999D]">
                    Mode Enabled
                  </span>
                  <Badge variant="primary" size="sm">
                    Supported
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Container>
    </section>
  );
}
