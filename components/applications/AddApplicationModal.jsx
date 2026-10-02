"use client";

import React, { useState } from "react";
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from "../ui/Card";
import FormInput from "../ui/FormInput";
import Button from "../ui/Button";
import { X, Plus } from "lucide-react";

export default function AddApplicationModal({ isOpen, onClose, onAdd }) {
  const [form, setForm] = useState({
    company: "",
    role: "",
    platform: "LinkedIn Jobs",
    job_url: "",
    status: "Applied",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company || !form.role) return;
    setSaving(true);
    try {
      await onAdd(form);
      setForm({
        company: "",
        role: "",
        platform: "LinkedIn Jobs",
        job_url: "",
        status: "Applied",
        notes: "",
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-modal-title"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
    >
      <div className="w-full max-w-md">
        <Card className="bg-white shadow-2xl border-[#E2E2E5]">
          <CardHeader className="flex items-center justify-between">
            <CardTitle id="add-modal-title">Track New Application</CardTitle>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-1 rounded-lg text-[#6F6F73] hover:bg-[#F5F5F6]"
            >
              <X className="w-5 h-5" />
            </button>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <FormInput
                id="company"
                label="Company Name"
                placeholder="e.g. Acme Corp"
                value={form.company}
                onChange={handleChange("company")}
                required
              />
              <FormInput
                id="role"
                label="Job Title / Role"
                placeholder="e.g. Senior Frontend Developer"
                value={form.role}
                onChange={handleChange("role")}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  id="platform"
                  label="Platform"
                  placeholder="e.g. LinkedIn"
                  value={form.platform}
                  onChange={handleChange("platform")}
                />
                <FormInput
                  id="job_url"
                  label="Job URL"
                  placeholder="https://..."
                  value={form.job_url}
                  onChange={handleChange("job_url")}
                />
              </div>
              <div>
                <label htmlFor="notes-field" className="text-sm font-semibold text-[#222222] block mb-1">
                  Notes / Accommodations
                </label>
                <textarea
                  id="notes-field"
                  rows={3}
                  value={form.notes}
                  onChange={handleChange("notes")}
                  placeholder="Add notes..."
                  className="w-full p-3 rounded-xl border border-[#E2E2E5] text-xs text-[#222222] focus:outline-hidden focus:border-[#40189D]"
                />
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={saving}
                icon={Plus}
                className="bg-[#40189D] hover:bg-[#32127A]"
              >
                Track Application
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
