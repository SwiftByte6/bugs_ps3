"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import Card, { CardContent } from "@/components/ui/Card";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import AccessibilityOptionCard from "@/components/onboarding/AccessibilityOptionCard";
import AccessibilityToolbar from "@/components/ui/AccessibilityToolbar";
import useProfile from "@/hooks/useProfile";
import { Eye, Keyboard, BookOpen, Volume2, Mic, ArrowRight, Sparkles } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { saveAccessibilityData, saving } = useProfile();

  const [options, setOptions] = useState({
    visual_assistance: true,
    motor_assistance: true,
    reading_assistance: false,
    hearing_assistance: false,
    voice_assistance: false,
  });

  const categories = [
    {
      id: "visual_assistance",
      title: "Visual Assistance",
      description: "Screen-reader friendly navigation, read aloud guidance, and high contrast contrast mode.",
      icon: Eye,
    },
    {
      id: "motor_assistance",
      title: "Motor Assistance",
      description: "Keyboard-first navigation, skip links, simplified click targets, and input auto-advance.",
      icon: Keyboard,
    },
    {
      id: "reading_assistance",
      title: "Reading Assistance",
      description: "Simplified text summaries for complex job descriptions and dyslexia-friendly typography.",
      icon: BookOpen,
    },
    {
      id: "hearing_assistance",
      title: "Hearing / Communication Assistance",
      description: "Visual notifications, visual captions, and alternative written communication templates.",
      icon: Volume2,
    },
    {
      id: "voice_assistance",
      title: "Voice Assistance",
      description: "Voice-to-text dictation and hands-free voice command navigation.",
      icon: Mic,
    },
  ];

  const handleToggle = (id) => {
    setOptions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleContinue = async () => {
    await saveAccessibilityData(options);
    router.push("/dashboard");
  };

  return (
    <main id="main-content" className="min-h-screen bg-[#F5F5F6] py-12 px-4">
      <Container size="md">
        <OnboardingProgress currentStep={1} totalSteps={2} />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1EBFF] text-[#40189D] text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Accessibility Preferences</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#222222] tracking-tight">
            How would you like Saarthi to assist you?
          </h1>
          <p className="mt-2 text-sm text-[#6F6F73] max-w-xl mx-auto leading-relaxed">
            Choose the assistance options that make job searching and applications easier for you. You can change these preferences anytime in your settings.
          </p>
        </div>

        {/* Selection Grid */}
        <Card className="shadow-md bg-white border-[#E2E2E5] mb-8">
          <CardContent className="p-6 space-y-4">
            {categories.map((cat) => (
              <AccessibilityOptionCard
                key={cat.id}
                id={cat.id}
                title={cat.title}
                description={cat.description}
                icon={cat.icon}
                selected={Boolean(options[cat.id])}
                onToggle={handleToggle}
              />
            ))}
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="lg"
            isLoading={saving}
            onClick={handleContinue}
            icon={ArrowRight}
            iconPosition="right"
            className="w-full sm:w-auto px-8 bg-[#40189D] hover:bg-[#32127A] font-bold shadow-md"
          >
            Save Preferences & Continue to Dashboard
          </Button>
        </div>
      </Container>
      <AccessibilityToolbar />
    </main>
  );
}
