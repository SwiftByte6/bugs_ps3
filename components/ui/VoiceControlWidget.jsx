"use client";

import React, { useState, useEffect, useRef } from "react";
import Button from "./Button";
import Badge from "./Badge";
import {
  Mic,
  MicOff,
  Square,
  XCircle,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import { executeVoiceCommand } from "@/lib/services/voiceService";

import { useRouter } from "next/navigation";
import useProfile from "@/hooks/useProfile";

export default function VoiceControlWidget({ onCommandExecute }) {
  const router = useRouter();
  const { accessibility } = useProfile();

  // Voice States: 'idle' | 'listening' | 'processing' | 'success' | 'error' | 'cancelled' | 'paused'
  const [voiceState, setVoiceState] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [statusMessage, setStatusMessage] = useState("Click mic or press 'V' to speak");
  const [announcement, setAnnouncement] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [lastResponse, setLastResponse] = useState("");

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const isContinuousRef = useRef(false);
  const isFirstLaunchRef = useRef(true);

  const announce = (text) => {
    setAnnouncement(text);
    setLastResponse(text);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        // If in continuous mode and not paused, resume listening
        if (isContinuousRef.current && voiceState !== "paused") {
          setTimeout(() => {
            startListening();
          }, 600);
        }
      };
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    if (voiceState === "processing") return;
    setTranscript("");
    setVoiceState("listening");
    setStatusMessage("Listening... Speak your command.");

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Already active
      }
    }
  };

  useEffect(() => {
    // 1. Initialize Web Speech Recognition
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setVoiceState("listening");
          setStatusMessage("Listening... Speak your command.");
        };

        recognition.onresult = (event) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);

          // Clear existing silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          // 5-SECOND SILENCE RULE: Finalize utterance after 5s of silence
          if (currentTranscript.trim()) {
            silenceTimerRef.current = setTimeout(() => {
              if (currentTranscript.trim()) {
                recognition.stop();
                handleProcessCommand(currentTranscript.trim());
              }
            }, 5000);
          }
        };

        recognition.onerror = (event) => {
          if (event.error !== "aborted" && event.error !== "no-speech") {
            console.warn("Speech recognition notice:", event.error);
            setVoiceState("idle");
          }
        };

        recognition.onend = () => {
          if (voiceState === "listening" && !isContinuousRef.current) {
            setVoiceState("idle");
          }
        };

        recognitionRef.current = recognition;
      }
    }

    // 2. Blind / Low Vision Auto-Welcome & Activation (Requirement 6 & 7)
    if (accessibility?.visual_assistance || accessibility?.voice_assistance) {
      isContinuousRef.current = true;
      if (isFirstLaunchRef.current) {
        isFirstLaunchRef.current = false;
        setTimeout(() => {
          announce("Hey, welcome to Saarthi. How can I help you?");
        }, 1200);
      }
    }

    // 3. Global Keyboard Listener (V key toggles voice, Escape stops)
    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;

      if (e.key === "v" || e.key === "V") {
        e.preventDefault();
        toggleListening();
      } else if (e.key === "Escape") {
        handleStopAll();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, [accessibility]);

  const toggleListening = () => {
    if (voiceState === "listening") {
      handleStopAll();
    } else {
      isContinuousRef.current = true;
      startListening();
    }
  };

  const handleProcessCommand = async (text) => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setVoiceState("processing");
    setStatusMessage(`Understanding: "${text}"...`);

    try {
      const result = await executeVoiceCommand(text, {
        current_page: typeof window !== "undefined" ? window.location.pathname : "/dashboard",
        previous_response: lastResponse,
      });

      const data = result.data || {};
      const action = data.action || "";
      const target = data.target || "";
      const responseText = data.response_text || data.speech_announcement || `Executed: ${text}`;

      setVoiceState("success");
      setStatusMessage(responseText);

      // Execute Action Router
      if (action === "NAVIGATE") {
        const targetPage = data.target_page || "";
        if (targetPage === "jobs" || target === "tab-jobsearch") router.push("/dashboard/jobs");
        else if (targetPage === "applications" || target === "tab-tracker") router.push("/dashboard/applications");
        else if (targetPage === "profile" || target === "tab-profile") router.push("/dashboard/profile");
        else if (targetPage === "interview" || target === "tab-interview") router.push("/dashboard/interview-prep");
        else if (targetPage === "assistant" || target === "tab-ai-assistant") router.push("/dashboard/assistant");
        else if (targetPage === "settings" || target === "tab-settings") router.push("/dashboard/settings");
      } else if (action === "NAVIGATE_JOBSEARCH") {
        router.push("/dashboard/jobs");
      } else if (action === "NAVIGATE_TRACKER") {
        router.push("/dashboard/applications");
      } else if (action === "NAVIGATE_INTERVIEW") {
        router.push("/dashboard/interview-prep");
      } else if (action === "STOP_ALL") {
        isContinuousRef.current = false;
        handleStopAll();
        return;
      } else if (action === "PAUSE_LISTENING") {
        isContinuousRef.current = false;
        setVoiceState("paused");
      }

      if (onCommandExecute) {
        onCommandExecute(data);
      }

      // Speak response through TTS
      announce(responseText);
    } catch (err) {
      console.error("Voice execution error:", err);
      const errFallback = "I didn't understand that. Please tell me what you would like me to do.";
      setStatusMessage(errFallback);
      announce(errFallback);
      setVoiceState("idle");
    }
  };

  const handleStopAll = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setVoiceState("cancelled");
    setStatusMessage("Voice action cancelled.");
    announce("Voice action stopped.");
    setTimeout(() => {
      setVoiceState("idle");
      setStatusMessage("Click mic or press 'V' to speak");
    }, 2500);
  };

  return (
    <div className="bg-white border border-[#E2E2E5] shadow-xl rounded-2xl p-4 space-y-3 w-full max-w-sm select-none">
      {/* Live Region for Screen Readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Header & Status Indicator */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E2E2E5]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#F1EBFF] text-[#40189D] flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4 text-[#40189D]" />
          </div>
          <span className="font-bold text-xs text-[#222222]">Voice Companion</span>
        </div>

        <Badge
          variant={
            isSpeaking
              ? "primary"
              : voiceState === "listening"
              ? "warning"
              : voiceState === "processing"
              ? "primary"
              : voiceState === "paused"
              ? "default"
              : "default"
          }
          size="sm"
        >
          {isSpeaking
            ? "● Speaking"
            : voiceState === "listening"
            ? "● Listening"
            : voiceState === "processing"
            ? "● Processing"
            : voiceState === "paused"
            ? "● Paused"
            : "● Waiting"}
        </Badge>
      </div>

      {/* Spoken Transcript Preview */}
      {transcript && (
        <div className="p-2.5 rounded-xl bg-[#F1EBFF] border border-purple-200 text-xs font-semibold text-[#40189D] flex items-center gap-2 animate-in fade-in">
          <Mic className="w-3.5 h-3.5 text-[#40189D] animate-pulse shrink-0" />
          <span className="italic">"{transcript}"</span>
        </div>
      )}

      {/* Dynamic Status Text */}
      <div className="p-3 rounded-xl bg-[#F5F5F6] border border-[#E2E2E5] text-xs text-[#222222] font-medium flex items-center justify-between min-h-[44px]">
        <span className="line-clamp-2">{statusMessage}</span>
        {isSpeaking && <Volume2 className="w-4 h-4 text-[#40189D] animate-pulse shrink-0 ml-2" />}
      </div>

      {/* Interactive Controls Bar */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {/* Main Microphone Action Button */}
        <Button
          variant="primary"
          size="md"
          icon={voiceState === "listening" ? MicOff : Mic}
          onClick={toggleListening}
          className={`flex-1 font-bold text-xs ${
            voiceState === "listening"
              ? "bg-amber-600 hover:bg-amber-700 animate-pulse"
              : "bg-[#40189D] hover:bg-[#32127A]"
          }`}
        >
          {voiceState === "listening" ? "Listening (Press V)" : "Start Voice (Press V)"}
        </Button>

        {/* Emergency STOP Button */}
        <button
          onClick={handleStopAll}
          aria-label="Stop active voice speech and listening"
          title="Stop speech & cancel command (Esc)"
          className="p-2.5 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] hover:bg-[#FEE2E2] transition-colors flex items-center justify-center shrink-0 font-bold"
        >
          <Square className="w-4 h-4 fill-[#991B1B]" />
        </button>

        {/* CANCEL Button */}
        <button
          onClick={handleStopAll}
          aria-label="Cancel command"
          title="Cancel action"
          className="p-2.5 rounded-xl bg-[#F5F5F6] border border-[#E2E2E5] text-[#6F6F73] hover:text-[#222222] hover:bg-[#E2E2E5] transition-colors flex items-center justify-center shrink-0 font-bold"
        >
          <XCircle className="w-4 h-4" />
        </button>

        {/* Help Toggle Button */}
        <button
          onClick={() => setShowHelp(!showHelp)}
          aria-label="Supported voice commands help"
          className="p-2.5 rounded-xl bg-[#F5F5F6] border border-[#E2E2E5] text-[#40189D] hover:bg-[#F1EBFF] transition-colors flex items-center justify-center shrink-0"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Supported Voice Commands Cheat Sheet */}
      {showHelp && (
        <div className="p-3 rounded-xl bg-[#F1EBFF] border border-purple-200 text-xs space-y-1.5 animate-in fade-in">
          <span className="font-bold text-[#40189D] block mb-1">
            Supported Voice Commands:
          </span>
          <ul className="space-y-1 text-[#40189D] font-medium text-[11px]">
            <li>• <strong>"Find frontend jobs"</strong> — Search job matches</li>
            <li>• <strong>"Read page"</strong> — Read active screen aloud</li>
            <li>• <strong>"Explain this job"</strong> — Simplify job description</li>
            <li>• <strong>"Fill safe fields"</strong> — Autofill safe profile data</li>
            <li>• <strong>"Stop" / "Halt"</strong> — Instantly cancel speech</li>
            <li>• <strong>"Approve" / "Yes"</strong> — Confirm application submit</li>
          </ul>
        </div>
      )}
    </div>
  );
}
