"use client";

import React, { useState } from "react";
import Card, { CardHeader, CardTitle, CardContent } from "../ui/Card";
import FormInput from "../ui/FormInput";
import Button from "../ui/Button";

export default function PersonalInformationForm({ profile, onSave, saving }) {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    location: profile?.location || "",
  });

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card className="bg-white border-[#E2E2E5]">
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              id="full_name"
              label="Full Name"
              value={formData.full_name}
              onChange={handleChange("full_name")}
              required
            />
            <FormInput
              id="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange("email")}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              id="phone"
              label="Phone Number"
              value={formData.phone}
              onChange={handleChange("phone")}
            />
            <FormInput
              id="location"
              label="Location"
              value={formData.location}
              onChange={handleChange("location")}
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={saving}
              className="bg-[#40189D] hover:bg-[#32127A]"
            >
              Save Personal Info
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
