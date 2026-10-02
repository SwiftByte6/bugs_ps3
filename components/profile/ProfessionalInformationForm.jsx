"use client";

import React, { useState } from "react";
import Card, { CardHeader, CardTitle, CardContent } from "../ui/Card";
import FormInput from "../ui/FormInput";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { Plus, X } from "lucide-react";

export default function ProfessionalInformationForm({ profile, onSave, saving }) {
  const [skills, setSkills] = useState(
    profile?.skills || ["React", "Next.js", "JavaScript", "Tailwind CSS"]
  );
  const [newSkill, setNewSkill] = useState("");
  const [links, setLinks] = useState({
    linkedin_url: profile?.linkedin_url || "",
    github_url: profile?.github_url || "",
    portfolio_url: profile?.portfolio_url || "",
  });

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills((prev) => [...prev, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleLinkChange = (field) => (e) => {
    setLinks((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ skills, ...links });
  };

  return (
    <Card className="bg-white border-[#E2E2E5]">
      <CardHeader>
        <CardTitle>Professional Information & Skills</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Skills Management */}
        <div>
          <label className="text-sm font-semibold text-[#222222] block mb-2">
            Skills & Competencies
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {skills.map((skill) => (
              <Badge
                key={skill}
                variant="primary"
                size="md"
                className="flex items-center gap-1.5"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-red-600 focus:outline-hidden p-0.5 rounded-full"
                  aria-label={`Remove ${skill}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a new skill (e.g. TypeScript)"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSkill(e);
                }
              }}
              className="h-10 px-3.5 rounded-xl border border-[#E2E2E5] bg-white text-xs font-medium focus:outline-hidden focus:border-[#40189D] w-full"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddSkill}
              icon={Plus}
              className="shrink-0"
            >
              Add Skill
            </Button>
          </div>
        </div>

        {/* External Links */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-[#F1F1F3]">
          <FormInput
            id="linkedin_url"
            label="LinkedIn Profile URL"
            placeholder="https://linkedin.com/in/username"
            value={links.linkedin_url}
            onChange={handleLinkChange("linkedin_url")}
          />
          <FormInput
            id="github_url"
            label="GitHub Profile URL"
            placeholder="https://github.com/username"
            value={links.github_url}
            onChange={handleLinkChange("github_url")}
          />
          <FormInput
            id="portfolio_url"
            label="Portfolio Website URL"
            placeholder="https://yourportfolio.com"
            value={links.portfolio_url}
            onChange={handleLinkChange("portfolio_url")}
          />

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={saving}
              className="bg-[#40189D] hover:bg-[#32127A]"
            >
              Save Professional Info
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
