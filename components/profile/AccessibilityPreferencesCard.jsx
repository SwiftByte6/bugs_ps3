"use client";

import React from "react";
import Link from "next/link";
import Card, { CardHeader, CardTitle, CardContent } from "../ui/Card";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { Sliders, Eye, Keyboard, BookOpen, Volume2, Mic, Settings } from "lucide-react";

export default function AccessibilityPreferencesCard({ preferences }) {
  const activeModes = [
    { key: "visual_assistance", label: "Visual Assistance", icon: Eye },
    { key: "motor_assistance", label: "Motor Assistance", icon: Keyboard },
    { key: "reading_assistance", label: "Reading Assistance", icon: BookOpen },
    { key: "hearing_assistance", label: "Hearing Assistance", icon: Volume2 },
    { key: "voice_assistance", label: "Voice Assistance", icon: Mic },
  ].filter((mode) => Boolean(preferences?.[mode.key]));

  return (
    <Card className="bg-white border-[#E2E2E5] mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#40189D]" />
            Active Accessibility Preferences
          </span>
          <Link href="/onboarding" passHref>
            <Button variant="outline" size="sm" icon={Settings}>
              Edit Preferences
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeModes.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {activeModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <Badge
                  key={mode.key}
                  variant="primary"
                  size="md"
                  icon={Icon}
                  className="py-1.5"
                >
                  {mode.label}
                </Badge>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-[#6F6F73]">
            No specific accessibility assistance modes selected. Click 'Edit Preferences' to configure your assistance settings.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
