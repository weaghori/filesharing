"use client";

import { useEffect, useState } from "react";
import { Clock, AlertTriangle, ShieldCheck } from "lucide-react";

export function getRemainingComponents(expiresAt) {
  if (!expiresAt) return { isExpired: false, hours: 24, minutes: 0, seconds: 0, totalSeconds: 86400, formatted: "24h 00m 00s" };
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { isExpired: true, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, formatted: "Expired" };

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, "0");
  const formatted = `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;

  return { isExpired: false, hours, minutes, seconds, totalSeconds, formatted };
}

export default function CountdownBadge({ expiresAt, onExpire, size = "default" }) {
  const [remaining, setRemaining] = useState(() => getRemainingComponents(expiresAt));

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const current = getRemainingComponents(expiresAt);
      setRemaining(current);

      if (current.isExpired) {
        clearInterval(interval);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (remaining.isExpired) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-950/40 px-3 py-1 text-xs font-bold text-red-700 dark:text-red-400">
        <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
        File Expired
      </span>
    );
  }

  const isUrgent = remaining.totalSeconds < 600; // less than 10 minutes

  if (size === "large") {
    return (
      <div
        className="flex items-center gap-2 rounded-xl border border-blue-200 dark:border-[#2563EB]/40 bg-blue-50/70 dark:bg-[#0B1220] px-4 py-2 text-sm font-semibold text-blue-900 dark:text-[#60A5FA] shadow-sm"
        suppressHydrationWarning
      >
        <Clock className={`h-4 w-4 ${isUrgent ? "text-amber-500 animate-pulse" : "text-[#2563EB] dark:text-[#60A5FA]"}`} />
        <span className="font-mono text-base font-bold tracking-tight" suppressHydrationWarning>
          {remaining.formatted}
        </span>
        <span className="text-xs font-normal opacity-80">remaining</span>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold font-mono transition-colors shadow-sm ${
        isUrgent
          ? "border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 animate-pulse"
          : "border border-blue-200 dark:border-[#2563EB]/40 bg-blue-50 dark:bg-[#0B1220] text-blue-700 dark:text-[#60A5FA]"
      }`}
      suppressHydrationWarning
    >
      <Clock className={`h-3.5 w-3.5 ${isUrgent ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-[#2563EB]"}`} />
      <span suppressHydrationWarning>{remaining.formatted}</span>
    </span>
  );
}
