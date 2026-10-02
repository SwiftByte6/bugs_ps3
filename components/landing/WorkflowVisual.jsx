"use client";

import React from "react";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import {
  UserCheck,
  Puzzle,
  Search,
  Wand2,
  BarChart3,
  ChevronRight,
  ArrowDown,
} from "lucide-react";

export default function WorkflowVisual() {
  const workflowNodes = [
    {
      id: "profile",
      title: "1. Profile & Preferences",
      subtitle: "Saved Resume & Assistance Options",
      icon: UserCheck,
      color: "bg-[#40189D] text-white",
      badge: "User Core",
    },
    {
      id: "extension",
      title: "2. Chrome Extension",
      subtitle: "Active Overlay on Platforms",
      icon: Puzzle,
      color: "bg-[#40189D] text-white",
      badge: "Companion",
    },
    {
      id: "search",
      title: "3. Job Discovery",
      subtitle: "Simplified Search & Match %",
      icon: Search,
      color: "bg-[#40189D] text-white",
      badge: "Smart Filter",
    },
    {
      id: "application",
      title: "4. Assisted Application",
      subtitle: "Form Filling & Keyboard Nav",
      icon: Wand2,
      color: "bg-[#40189D] text-white",
      badge: "Auto Assist",
    },
    {
      id: "tracking",
      title: "5. Application Tracking",
      subtitle: "Status Dashboard & Notes",
      icon: BarChart3,
      color: "bg-[#40189D] text-white",
      badge: "Central Sync",
    },
  ];

  return (
    <section id="workflow" className="py-20 bg-[#F5F5F6] border-t border-[#E2E2E5]">
      <Container size="lg">
        <SectionHeading
          badgeText="End-to-End Workflow"
          title="The Saarthi Application Journey"
          subtitle="From setup to submission, see how data and accessibility adaptations flow seamlessly across platforms."
          centered
        />

        {/* Desktop Horizontal Workflow Diagram */}
        <div className="hidden lg:flex items-center justify-between gap-2">
          {workflowNodes.map((node, index) => {
            const Icon = node.icon;
            const isLast = index === workflowNodes.length - 1;
            return (
              <React.Fragment key={node.id}>
                <Card className="flex-1 p-5 bg-white border-[#E2E2E5] shadow-xs hover:shadow-md transition-transform hover:-translate-y-1">
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${node.color} shadow-xs`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <Badge variant="default" size="sm" className="mb-2">
                      {node.badge}
                    </Badge>
                    <h3 className="text-sm font-bold text-[#222222]">
                      {node.title}
                    </h3>
                    <p className="text-xs text-[#6F6F73] mt-1">
                      {node.subtitle}
                    </p>
                  </div>
                </Card>
                {!isLast && (
                  <div className="shrink-0 text-[#99999D]">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Mobile / Tablet Vertical Workflow Diagram */}
        <div className="lg:hidden flex flex-col items-center gap-4">
          {workflowNodes.map((node, index) => {
            const Icon = node.icon;
            const isLast = index === workflowNodes.length - 1;
            return (
              <React.Fragment key={node.id}>
                <Card className="w-full p-5 bg-white border-[#E2E2E5] shadow-xs">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${node.color} shrink-0`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <Badge variant="default" size="sm" className="mb-1">
                        {node.badge}
                      </Badge>
                      <h3 className="text-base font-bold text-[#222222]">
                        {node.title}
                      </h3>
                      <p className="text-xs text-[#6F6F73]">
                        {node.subtitle}
                      </p>
                    </div>
                  </div>
                </Card>
                {!isLast && (
                  <ArrowDown className="w-5 h-5 text-[#99999D]" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
