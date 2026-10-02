"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  FileCheck2,
  User,
  Puzzle,
  Settings,
  Sparkles,
  LogOut,
} from "lucide-react";
import useUser from "@/hooks/useUser";

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useUser();

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Jobs", href: "/dashboard/jobs", icon: Briefcase },
    { name: "Applications", href: "/dashboard/applications", icon: FileCheck2 },
    { name: "My Profile", href: "/dashboard/profile", icon: User },
    { name: "Extension", href: "/dashboard/extension", icon: Puzzle },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <aside
      aria-label="Dashboard Sidebar Navigation"
      className="w-64 bg-[#40189D] text-white flex flex-col justify-between shrink-0 min-h-screen p-6 shadow-xl select-none"
    >
      <div>
        {/* Saarthi Branding Header */}
        <Link
          href="/dashboard"
          className="flex items-center gap-3 mb-10 p-2 rounded-xl focus-visible:outline-2 focus-visible:outline-white"
        >
          <div className="w-10 h-10 rounded-2xl bg-white text-[#40189D] flex items-center justify-center font-bold shadow-md">
            <Sparkles className="w-5 h-5 fill-current text-[#40189D]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-white">
              Saarthi
            </span>
            <span className="text-[10px] text-purple-200 font-medium uppercase tracking-wider">
              Accessible Career Assistant
            </span>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-2" aria-label="Dashboard Menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all focus-visible:outline-2 focus-visible:outline-white ${
                  isActive
                    ? "bg-white text-[#40189D] shadow-sm font-bold"
                    : "text-purple-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Actions */}
      <div className="pt-6 border-t border-purple-500/40 flex flex-col gap-3">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-xs text-purple-200 hover:bg-white/10 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-white"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
