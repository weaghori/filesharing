"use client";

import { useEffect, useState } from "react";
import { Clock, AlertTriangle, ShieldCheck, Zap } from "lucide-react";
import { getRemainingComponents } from "./CountdownBadge";

export default function ExpirationTimerCard({ expiresAt, onExpire }) {
  const [timer, setTimer] = useState(() => getRemainingComponents(expiresAt));

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const current = getRemainingComponents(expiresAt);
      setTimer(current);

      if (current.isExpired) {
        clearInterval(interval);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  // Total 24 hours in seconds = 86400
  const maxSeconds = 24 * 3600;
  const progressPercent = Math.min(100, Math.max(0, (timer.totalSeconds / maxSeconds) * 100));

  const formattedExpiryDate = expiresAt
    ? new Date(expiresAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
    : "";

  if (timer.isExpired) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-50 dark:bg-red-950/20 p-5 text-center text-red-600 dark:text-red-400">
        <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
        <h3 className="font-bold text-base">File Has Expired</h3>
        <p className="text-xs mt-1">This file has exceeded its 24-hour lifetime and is no longer available.</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border border-zinc-200 dark:border-[#2563EB]/40 bg-white dark:bg-[#0B1220] p-5 shadow-sm dark:shadow-[0_0_25px_rgba(37,99,235,0.15)] space-y-4 transition-colors"
      suppressHydrationWarning
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#60A5FA]">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-[#94A3B8]">
              Self-Destruct Countdown
            </span>
            <p className="text-[11px] text-zinc-400 dark:text-[#94A3B8]/70">
              Live timer until permanent storage deletion
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-[#94A3B8]">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          <span>Purges at: <strong className="text-zinc-950 dark:text-white font-medium" suppressHydrationWarning>{formattedExpiryDate}</strong></span>
        </div>
      </div>

      {/* Digits Display */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#05070B] p-3 shadow-inner">
          <span className="block font-mono text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white" suppressHydrationWarning>
            {String(timer.hours).padStart(2, "0")}
          </span>
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#94A3B8]">
            Hours
          </span>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#05070B] p-3 shadow-inner">
          <span className="block font-mono text-2xl sm:text-3xl font-extrabold text-[#2563EB] dark:text-[#60A5FA]" suppressHydrationWarning>
            {String(timer.minutes).padStart(2, "0")}
          </span>
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#94A3B8]">
            Minutes
          </span>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#05070B] p-3 shadow-inner">
          <span className="block font-mono text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white" suppressHydrationWarning>
            {String(timer.seconds).padStart(2, "0")}
          </span>
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#94A3B8]">
            Seconds
          </span>
        </div>
      </div>

      {/* Lifetime Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] text-zinc-500 dark:text-[#94A3B8]">
          <span>Remaining Lifetime</span>
          <span className="font-mono font-medium">{progressPercent.toFixed(1)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-[#05070B]">
          <div
            className="h-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA] transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
