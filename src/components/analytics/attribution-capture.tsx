"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/leads/attribution";

/** Records first-touch UTM/landing data for the session, for lead context only. */
export function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);
  return null;
}
