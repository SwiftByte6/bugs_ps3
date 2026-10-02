"use client";

import React, { useState, useEffect } from "react";
import { Search, Bell, User, Server } from "lucide-react";
import useUser from "@/hooks/useUser";
import { checkBackendHealth } from "@/lib/services/healthService";

export default function Header({ title = "Dashboard" }) {
  const { user } = useUser();
  const userName = user?.user_metadata?.full_name || user?.full_name || "Rohit Sharma";

  const [backendStatus, setBackendStatus] = useState("checking"); // checking | connected | disconnected

  useEffect(() => {
    let isMounted = true;
    async function verifyHealth() {
      setBackendStatus("checking");
      const res = await checkBackendHealth();
      if (isMounted) {
        setBackendStatus(res.status === "connected" ? "connected" : "disconnected");
      }
    }
    verifyHealth();

    const interval = setInterval(verifyHealth, 30000); // Check every 30s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="h-20 bg-white border-b border-[#E2E2E5] px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Search Field */}
      <div className="flex items-center gap-3 bg-[#F5F5F6] px-4 py-2 rounded-xl border border-[#E2E2E5] w-full max-w-md">
        <Search className="w-4 h-4 text-[#6F6F73]" />
        <input
          type="text"
          placeholder="Search jobs, skills, or applications..."
          className="bg-transparent text-xs text-[#222222] placeholder-[#99999D] focus:outline-hidden w-full font-medium"
        />
      </div>

      {/* User Actions & Backend Connection Status */}
      <div className="flex items-center gap-4">
        {/* Backend Health Badge */}
        <div
          aria-label={`Backend status: ${backendStatus}`}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F5F5F6] border border-[#E2E2E5] text-[#444446]"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              backendStatus === "connected"
                ? "bg-emerald-500 animate-pulse"
                : backendStatus === "checking"
                ? "bg-amber-400"
                : "bg-gray-400"
            }`}
          />
          <Server className="w-3.5 h-3.5 text-[#6F6F73]" />
          <span className="text-[11px] font-medium text-[#6F6F73]">
            {backendStatus === "connected"
              ? "Saarthi Connected"
              : backendStatus === "checking"
              ? "Checking Saarthi..."
              : "Saarthi Offline (Fallback)"}
          </span>
        </div>

        <button
          aria-label="Notifications"
          className="p-2.5 rounded-xl bg-[#F5F5F6] text-[#6F6F73] hover:text-[#40189D] hover:bg-[#F1EBFF] border border-[#E2E2E5] transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#40189D]" />
        </button>

        <div className="flex items-center gap-3 pl-2 border-l border-[#E2E2E5]">
          <div className="w-9 h-9 rounded-xl bg-[#F1EBFF] text-[#40189D] font-bold flex items-center justify-center border border-purple-200">
            <User className="w-5 h-5" />
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-[#222222]">
              {userName}
            </span>
            <span className="text-[11px] text-[#6F6F73] font-medium">
              Job Candidate
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
