"use client";

import React, { useState } from "react";
import Link from "next/link";
import Container from "../ui/Container";
import Button from "../ui/Button";
import { Sparkles, Menu, X, ArrowRight } from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#E2E2E5] transition-colors select-none">
      <Container size="lg">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#40189D] rounded-lg p-1"
            aria-label="Saarthi Home Page"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#40189D] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 fill-current text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-[#222222] flex items-center gap-1.5">
                Saarthi
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F1EBFF] text-[#40189D] uppercase tracking-wider">
                  Assist
                </span>
              </span>
              <span className="text-xs text-[#6F6F73] font-medium hidden sm:inline">
                Accessible Job Application Assistant
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav
            aria-label="Main Navigation"
            className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#6F6F73]"
          >
            <Link
              href="#features"
              className="hover:text-[#40189D] transition-colors focus-visible:outline-2 focus-visible:outline-[#40189D] rounded-sm px-1"
            >
              Features
            </Link>
            <Link
              href="#accessibility"
              className="hover:text-[#40189D] transition-colors focus-visible:outline-2 focus-visible:outline-[#40189D] rounded-sm px-1"
            >
              Accessibility Pillars
            </Link>
            <Link
              href="#how-it-works"
              className="hover:text-[#40189D] transition-colors focus-visible:outline-2 focus-visible:outline-[#40189D] rounded-sm px-1"
            >
              How It Works
            </Link>
            <Link
              href="#workflow"
              className="hover:text-[#40189D] transition-colors focus-visible:outline-2 focus-visible:outline-[#40189D] rounded-sm px-1"
            >
              Workflow
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" passHref>
              <Button variant="ghost" size="md">
                Sign In
              </Button>
            </Link>
            <Link href="/signup" passHref>
              <Button variant="primary" size="md" icon={ArrowRight} iconPosition="right" className="bg-[#40189D] hover:bg-[#32127A]">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#222222] hover:bg-[#F5F5F6] rounded-xl focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#40189D]"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </Container>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E2E2E5] bg-white px-4 pt-3 pb-6 flex flex-col gap-4 shadow-lg">
          <nav className="flex flex-col gap-3 font-semibold text-[#222222]">
            <Link
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#40189D]"
            >
              Features
            </Link>
            <Link
              href="#accessibility"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#40189D]"
            >
              Accessibility Pillars
            </Link>
            <Link
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#40189D]"
            >
              How It Works
            </Link>
            <Link
              href="#workflow"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#40189D]"
            >
              Workflow
            </Link>
          </nav>
          <div className="flex flex-col gap-2 pt-2 border-t border-[#F1F1F3]">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full justify-center">
                Sign In
              </Button>
            </Link>
            <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" className="w-full justify-center bg-[#40189D] hover:bg-[#32127A]">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
