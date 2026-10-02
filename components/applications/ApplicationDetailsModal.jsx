"use client";

import React, { useState } from "react";
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from "../ui/Card";
import Button from "../ui/Button";
import ApplicationStatusBadge from "./ApplicationStatusBadge";
import { X, ExternalLink, Calendar, Trash2, CheckCircle2 } from "lucide-react";

export default function ApplicationDetailsModal({
  application,
  isOpen,
  onClose,
  onUpdateStatus,
  onDelete,
}) {
  const [status, setStatus] = useState(application?.status || "Applied");
  const [notes, setNotes] = useState(application?.notes || "");
  const [saving, setSaving] = useState(false);

  if (!isOpen || !application) return null;

  const statuses = ["Applied", "Under Review", "Interview", "Offer", "Rejected"];

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdateStatus(application.id, status, notes);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${application.role} at ${application.company}?`)) {
      await onDelete(application.id);
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
    >
      <div className="w-full max-w-lg">
        <Card className="bg-white shadow-2xl border-[#E2E2E5]">
          <CardHeader className="flex items-center justify-between pb-3">
            <div>
              <CardTitle id="modal-title" className="text-xl">
                {application.role}
              </CardTitle>
              <p className="text-sm font-semibold text-[#40189D] mt-0.5">
                {application.company}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 rounded-lg text-[#6F6F73] hover:bg-[#F5F5F6] focus-visible:ring-2 focus-visible:ring-[#40189D]"
            >
              <X className="w-5 h-5" />
            </button>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Details Summary */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl bg-[#F5F5F6] border border-[#E2E2E5] text-xs">
              <span className="flex items-center gap-1.5 text-[#6F6F73] font-medium">
                <Calendar className="w-4 h-4 text-[#40189D]" />
                Applied {application.applied_at}
              </span>
              <span className="font-semibold text-[#222222]">
                Platform: {application.platform}
              </span>
              <a
                href={application.job_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#40189D] hover:underline flex items-center gap-1"
              >
                <span>External Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Status Change Selector */}
            <div>
              <label className="text-sm font-semibold text-[#222222] block mb-2">
                Update Application Status
              </label>
              <div className="flex flex-wrap gap-2">
                {statuses.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      status === s
                        ? "bg-[#40189D] text-white border-[#40189D]"
                        : "bg-white text-[#333333] border-[#E2E2E5] hover:bg-[#F5F5F6]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Application Notes */}
            <div>
              <label htmlFor="app-notes" className="text-sm font-semibold text-[#222222] block mb-1">
                Application Notes & History
              </label>
              <textarea
                id="app-notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add interview dates, contact email notes, or salary expectations..."
                className="w-full p-3 rounded-xl border border-[#E2E2E5] bg-white text-xs text-[#222222] focus:outline-hidden focus:border-[#40189D]"
              />
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between pt-3">
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={handleDelete}
            >
              Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={saving}
                onClick={handleSave}
                icon={CheckCircle2}
                className="bg-[#40189D] hover:bg-[#32127A]"
              >
                Save Changes
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
