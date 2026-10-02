"use client";

import React from "react";
import Link from "next/link";
import Container from "../ui/Container";
import { Sparkles, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <Container size="lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                <Sparkles className="w-4 h-4 fill-current" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Saarthi
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Saarthi is an accessibility-first job application companion empowering candidates with disabilities through intelligent form filling, customized screen adaptations, and application tracking.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4">
              Product
            </h4>
            <ul className="space-y-2 text-sm font-medium">
              <li>
                <Link href="#features" className="hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#accessibility" className="hover:text-white transition-colors">
                  Accessibility Pillars
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="#workflow" className="hover:text-white transition-colors">
                  Workflow
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4">
              Accessibility
            </h4>
            <ul className="space-y-2 text-sm font-medium">
              <li className="text-slate-400">WCAG 2.1 AAA Compliant</li>
              <li className="text-slate-400">Keyboard First Design</li>
              <li className="text-slate-400">Screen Reader Optimized</li>
              <li className="text-slate-400">High Contrast Modes</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-medium gap-4">
          <p>© {new Date().getFullYear()} Saarthi Assistant. Built for inclusive access.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-current" /> for an accessible workforce.
          </p>
        </div>
      </Container>
    </footer>
  );
}
