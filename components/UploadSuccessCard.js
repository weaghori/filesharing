/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, QrCode, RefreshCw, Sparkles, Clock, ShieldCheck } from "lucide-react";
import CountdownBadge from "./CountdownBadge";
import { formatBytes } from "@/lib/utils";

export default function UploadSuccessCard({ uploadResult, onReset }) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/i/${uploadResult.imageId}`
      : uploadResult.shareUrl;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    shareUrl
  )}&bgcolor=FFFFFF&color=09090B&margin=10`;

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-[#2563EB]/40 bg-white dark:bg-[#0B1220] p-6 sm:p-8 shadow-xl dark:shadow-[0_0_35px_rgba(37,99,235,0.25)] transition-all animate-in fade-in zoom-in-95 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-[#151E32] transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-[#2563EB]/20 text-zinc-950 dark:text-[#60A5FA] border border-zinc-200 dark:border-[#2563EB]/40">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-950 dark:text-white">File Ready to Share</h2>
            <p className="text-xs text-zinc-500 dark:text-[#94A3B8] truncate max-w-xs sm:max-w-md">
              {uploadResult.fileName || uploadResult.originalName} • {formatBytes(uploadResult.fileSize || uploadResult.size)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CountdownBadge
            expiresAt={uploadResult.expiresAt}
            size="large"
          />
        </div>
      </div>

      {/* Share Link Box */}
      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#94A3B8] mb-2">
            Shareable Link (Expires in 24 Hours)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 rounded-xl border border-zinc-300 dark:border-[#151E32] bg-zinc-50 dark:bg-[#05070B] px-4 py-3 text-sm text-zinc-950 dark:text-white font-mono focus:border-zinc-950 dark:focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:ring-[#2563EB] transition-colors"
              onClick={(e) => e.target.select()}
            />
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-[#2563EB] dark:hover:bg-[#3B82F6] shadow-sm dark:shadow-[0_0_15px_rgba(37,99,235,0.4)]"
              }`}
              title="Copy to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* QR Code Toggle */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => setShowQr(!showQr)}
            className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-[#94A3B8] hover:text-zinc-950 dark:hover:text-[#60A5FA] transition-colors py-1"
          >
            <QrCode className="h-4 w-4" />
            <span>{showQr ? "Hide QR Code" : "Show QR Code for mobile scanning"}</span>
          </button>

          {showQr && (
            <div className="mt-4 flex flex-col items-center rounded-xl border border-zinc-200 dark:border-[#151E32] bg-zinc-50 dark:bg-[#05070B] p-4 shadow-inner">
              <img
                src={qrImageUrl}
                alt="QR Code for file URL"
                width={180}
                height={180}
                className="rounded-lg border border-zinc-200 dark:border-[#2563EB]/30 shadow-sm"
              />
              <span className="mt-2 text-[11px] text-zinc-500 dark:text-[#94A3B8]">
                Scan with any mobile camera app to open & download
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-zinc-200 dark:border-[#151E32] transition-colors">
          <Link
            href={`/i/${uploadResult.imageId}`}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-[#2563EB]/40 bg-zinc-50 dark:bg-[#0B1220] px-4 py-2.5 text-sm font-semibold text-zinc-950 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#111A2E] shadow-sm transition-all"
          >
            <ExternalLink className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />
            <span>Open File Page & Countdown</span>
          </Link>

          <button
            type="button"
            onClick={onReset}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-[#151E32] bg-white dark:bg-[#05070B] px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-[#94A3B8] hover:text-zinc-950 dark:hover:text-white hover:border-zinc-400 dark:hover:border-[#2563EB]/40 shadow-sm transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Upload Another File</span>
          </button>
        </div>
      </div>
    </div>
  );
}
