"use client";

import React, { useState } from "react";
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
  Puzzle,
  CheckCircle2,
  Download,
  RefreshCw,
  Sparkles,
  Eye,
  Volume2,
  FileCheck2,
  ShieldCheck,
} from "lucide-react";

export default function ExtensionPage() {
  const [isConnected, setIsConnected] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncedMessage, setSyncedMessage] = useState("");

  const handleSyncNow = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSyncedMessage("✓ Profile & accessibility preferences synced successfully to extension.");
      setTimeout(() => setSyncedMessage(""), 4000);
    }, 600);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Toast Notification */}
      {syncedMessage && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in"
        >
          <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
          <span>{syncedMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1EBFF] text-[#40189D] text-xs font-semibold mb-2">
          <Puzzle className="w-3.5 h-3.5" />
          <span>Browser Companion Integration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#222222] tracking-tight">
          Saarthi Chrome Extension
        </h1>
        <p className="text-sm text-[#6F6F73] mt-1">
          Take Saarthi with you while you browse job platforms like LinkedIn, Indeed, and Greenhouse.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Extension Status & Control */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="bg-white border-[#E2E2E5]">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Puzzle className="w-5 h-5 text-[#40189D]" />
                <span>Extension Connection Status</span>
              </CardTitle>
              <Badge
                variant={isConnected ? "success" : "warning"}
                size="md"
                icon={CheckCircle2}
              >
                {isConnected ? "Connected" : "Not Connected"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-[#6F6F73] leading-relaxed">
                The Saarthi Chrome extension injects accessible overlays, text simplification tools, keyboard shortcuts, and auto-fill buttons into external job forms.
              </p>

              {/* Sync Checklist (Section 29 of design.md) */}
              <div className="p-4 rounded-xl bg-[#F5F5F6] border border-[#E2E2E5] space-y-2.5">
                <div className="text-xs font-bold text-[#222222] mb-1">
                  Active Sync Checklist:
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#15803D]">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                  <span>Profile & Skills synced</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#15803D]">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                  <span>Resume PDF available for auto-fill</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#15803D]">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                  <span>Accessibility preferences synced</span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="secondary"
                size="sm"
                icon={RefreshCw}
                isLoading={syncing}
                onClick={handleSyncNow}
              >
                Sync Profile Now
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Download}
                onClick={() => alert("Chrome Extension installer will launch once released on Chrome Web Store!")}
                className="bg-[#40189D] hover:bg-[#32127A] font-bold"
              >
                Install Extension
              </Button>
            </CardFooter>
          </Card>

          {/* Toggle Connection Mock State for testing */}
          <Card className="bg-white border-[#E2E2E5] p-4 flex items-center justify-between text-xs">
            <span className="font-semibold text-[#6F6F73]">
              Simulate Chrome Extension Connection State:
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConnected(!isConnected)}
            >
              Toggle {isConnected ? "Disconnect" : "Connect"} State
            </Button>
          </Card>
        </div>

        {/* Right Column: Simulated Extension Popup Visual (Section 29 of design.md) */}
        <div className="lg:col-span-5">
          <Card className="p-6 bg-white border-[#E2E2E5] shadow-lg">
            <div className="text-xs font-bold text-[#6F6F73] uppercase tracking-wider mb-3">
              Live Extension Popup Preview
            </div>

            {/* Simulated Chrome Extension Popup Box */}
            <div className="border border-[#E2E2E5] rounded-2xl p-5 bg-[#F5F5F6] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E2E5]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#40189D] text-white flex items-center justify-center font-bold text-xs">
                    S
                  </div>
                  <span className="font-bold text-sm text-[#222222]">Saarthi Companion</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Connected" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#222222]">
                  Senior Frontend Developer
                </h4>
                <p className="text-xs text-[#6F6F73]">XYZ Technologies • LinkedIn</p>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-[#E2E2E5] flex items-center justify-between text-xs font-bold text-[#40189D]">
                <span>91% Profile Match</span>
                <Sparkles className="w-4 h-4 text-[#40189D]" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button className="p-2 bg-white rounded-lg border border-[#E2E2E5] font-semibold text-[#222222] flex items-center justify-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-[#40189D]" />
                  <span>Simplify Job</span>
                </button>
                <button className="p-2 bg-white rounded-lg border border-[#E2E2E5] font-semibold text-[#222222] flex items-center justify-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-[#40189D]" />
                  <span>Read Aloud</span>
                </button>
              </div>

              <Button
                variant="primary"
                size="md"
                className="w-full bg-[#40189D] hover:bg-[#32127A] font-bold text-xs"
              >
                Apply with Saarthi
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
