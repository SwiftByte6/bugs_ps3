"use client";

import React, { useState } from "react";
import { Eye, Type, Sparkles, Check, Mic } from "lucide-react";
import VoiceControlWidget from "./VoiceControlWidget";

export default function AccessibilityToolbar() {
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const toggleHighContrast = () => {
    const nextState = !highContrast;
    setHighContrast(nextState);
    if (nextState) {
      document.documentElement.classList.add("high-contrast");
      announce("High contrast mode enabled");
    } else {
      document.documentElement.classList.remove("high-contrast");
      announce("High contrast mode disabled");
    }
  };

  const toggleLargeText = () => {
    const nextState = !largeText;
    setLargeText(nextState);
    if (nextState) {
      document.documentElement.classList.add("large-text");
      announce("Large text mode enabled");
    } else {
      document.documentElement.classList.remove("large-text");
      announce("Large text mode disabled");
    }
  };

  const announce = (text) => {
    setAnnouncement(text);
    setTimeout(() => setAnnouncement(""), 4000);
  };

  return (
    <aside
      aria-label="Accessibility Settings Quick Bar"
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 select-none"
    >
      {/* Live Region for Screen Readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Voice Assistant Widget Panel */}
      {showVoice && (
        <div className="animate-in fade-in duration-200">
          <VoiceControlWidget />
        </div>
      )}

      {/* Accessibility Toolbar Panel */}
      {isOpen && (
        <div className="bg-white border border-[#E2E2E5] shadow-xl rounded-2xl p-3 flex flex-col gap-2 min-w-[240px] animate-in fade-in duration-200">
          <div className="text-xs font-bold text-[#6F6F73] uppercase px-2 pt-1 pb-1">
            Accessibility Preferences
          </div>

          <button
            onClick={() => setShowVoice(!showVoice)}
            aria-pressed={showVoice}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
              showVoice
                ? "bg-[#F1EBFF] text-[#40189D]"
                : "hover:bg-[#F5F5F6] text-[#333333]"
            }`}
          >
            <span className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-[#40189D]" />
              Voice Companion (Press V)
            </span>
            {showVoice && <Check className="w-4 h-4 text-[#40189D]" />}
          </button>

          <button
            onClick={toggleHighContrast}
            aria-pressed={highContrast}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
              highContrast
                ? "bg-[#F1EBFF] text-[#40189D]"
                : "hover:bg-[#F5F5F6] text-[#333333]"
            }`}
          >
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#40189D]" />
              High Contrast
            </span>
            {highContrast && <Check className="w-4 h-4 text-[#40189D]" />}
          </button>

          <button
            onClick={toggleLargeText}
            aria-pressed={largeText}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
              largeText
                ? "bg-[#F1EBFF] text-[#40189D]"
                : "hover:bg-[#F5F5F6] text-[#333333]"
            }`}
          >
            <span className="flex items-center gap-2">
              <Type className="w-4 h-4 text-[#40189D]" />
              Larger Text
            </span>
            {largeText && <Check className="w-4 h-4 text-[#40189D]" />}
          </button>
        </div>
      )}

      {/* Floating Quick Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Toggle Accessibility Assistant Controls"
        className="bg-[#40189D] hover:bg-[#32127A] text-white shadow-lg rounded-full px-4 py-3 flex items-center gap-2.5 font-semibold text-sm transition-transform active:scale-95 border border-purple-400/40"
      >
        <Sparkles className="w-4 h-4 text-amber-300" />
        <span>Accessibility Controls</span>
      </button>
    </aside>
  );
}
