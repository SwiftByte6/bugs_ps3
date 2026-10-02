"use client";

import React, { useState } from "react";
import useApplications from "@/hooks/useApplications";
import ApplicationCard from "@/components/applications/ApplicationCard";
import ApplicationDetailsModal from "@/components/applications/ApplicationDetailsModal";
import AddApplicationModal from "@/components/applications/AddApplicationModal";
import Button from "@/components/ui/Button";
import Card, { CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { Plus, Search, Filter, Briefcase } from "lucide-react";

export default function ApplicationsPage() {
  const {
    applications,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    addApplication,
    updateStatus,
    removeApplication,
  } = useApplications();

  const [selectedApp, setSelectedApp] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const filterTabs = ["All", "Applied", "Under Review", "Interview", "Offer", "Rejected"];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#222222] tracking-tight">
            Application Tracker
          </h1>
          <p className="text-sm text-[#6F6F73] mt-1">
            Monitor all your submitted job applications, interview schedules, and response notes.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => setIsAddOpen(true)}
          className="bg-[#40189D] hover:bg-[#32127A] shrink-0"
        >
          Track New Application
        </Button>
      </div>

      {/* Controls Bar: Search & Status Filters */}
      <Card className="bg-white border-[#E2E2E5]">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="flex items-center gap-2 bg-[#F5F5F6] px-3.5 py-2 rounded-xl border border-[#E2E2E5] w-full md:w-80">
            <Search className="w-4 h-4 text-[#6F6F73]" />
            <input
              type="text"
              placeholder="Search by company or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-[#222222] focus:outline-hidden w-full font-medium"
            />
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {filterTabs.map((tab) => (
              <Badge
                key={tab}
                variant="default"
                size="md"
                selected={statusFilter === tab}
                onClick={() => setStatusFilter(tab)}
                className="cursor-pointer"
              >
                {tab}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Application Grid / Cards */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#40189D]"></div>
        </div>
      ) : applications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onViewDetails={(selected) => setSelectedApp(selected)}
            />
          ))}
        </div>
      ) : (
        /* Empty State (Section 37 of design.md) */
        <Card className="p-12 text-center bg-white border-[#E2E2E5]">
          <div className="w-12 h-12 rounded-2xl bg-[#F1EBFF] text-[#40189D] flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#222222] mb-1">
            No applications match your criteria
          </h3>
          <p className="text-xs text-[#6F6F73] max-w-sm mx-auto mb-6">
            Applications submitted using the Saarthi extension or added manually will appear here.
          </p>
          <Link href="/dashboard/jobs" passHref>
            <Button variant="primary" size="md" className="bg-[#40189D] hover:bg-[#32127A]">
              Explore Recommended Jobs
            </Button>
          </Link>
        </Card>
      )}

      {/* Details & Add Modals */}
      <ApplicationDetailsModal
        application={selectedApp}
        isOpen={Boolean(selectedApp)}
        onClose={() => setSelectedApp(null)}
        onUpdateStatus={updateStatus}
        onDelete={removeApplication}
      />

      <AddApplicationModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={addApplication}
      />
    </div>
  );
}
