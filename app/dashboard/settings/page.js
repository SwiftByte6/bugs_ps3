"use client";

import React, { useState } from "react";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import FormInput from "@/components/ui/FormInput";
import useUser from "@/hooks/useUser";
import { Settings, Shield, Bell, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { user } = useUser();
  const [email, setEmail] = useState(user?.email || "rohit.sharma@example.com");
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast */}
      {saved && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in"
        >
          <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
          <span>Settings saved successfully.</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#222222] tracking-tight">
          Account Settings
        </h1>
        <p className="text-sm text-[#6F6F73] mt-1">
          Manage your account credentials, notifications, and privacy options.
        </p>
      </div>

      <Card className="bg-white border-[#E2E2E5]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#40189D]" />
            Account Security & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <FormInput
              id="account-email"
              label="Account Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="p-4 rounded-xl bg-[#F5F5F6] border border-[#E2E2E5] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#F1EBFF] text-[#40189D]">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <label htmlFor="notifications-toggle" className="text-sm font-bold text-[#222222] block cursor-pointer">
                    Application Status Notifications
                  </label>
                  <p className="text-xs text-[#6F6F73]">
                    Receive email notifications when an application status updates.
                  </p>
                </div>
              </div>
              <input
                id="notifications-toggle"
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="w-5 h-5 accent-[#40189D] rounded-md cursor-pointer"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                className="bg-[#40189D] hover:bg-[#32127A]"
              >
                Save Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
