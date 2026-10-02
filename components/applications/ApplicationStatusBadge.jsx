"use client";

import React from "react";
import Badge from "../ui/Badge";
import { CheckCircle2, AlertTriangle, Star, PartyPopper, XCircle, Bookmark } from "lucide-react";

export default function ApplicationStatusBadge({ status = "Applied", size = "md" }) {
  const statusConfig = {
    Saved: {
      icon: Bookmark,
      variant: "default",
      label: "Saved",
    },
    Applied: {
      icon: CheckCircle2,
      variant: "primary",
      label: "✓ Applied",
    },
    "Under Review": {
      icon: AlertTriangle,
      variant: "warning",
      label: "⚠ Under Review",
    },
    Interview: {
      icon: Star,
      variant: "info",
      label: "★ Interview",
    },
    Offer: {
      icon: PartyPopper,
      variant: "success",
      label: "🎉 Offer Received",
    },
    Rejected: {
      icon: XCircle,
      variant: "danger",
      label: "× Rejected",
    },
  };

  const config = statusConfig[status] || statusConfig.Applied;

  return (
    <Badge variant={config.variant} size={size}>
      {config.label}
    </Badge>
  );
}
