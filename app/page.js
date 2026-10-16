"use client";

import { useState } from "react";
import Dropzone from "@/components/Dropzone";
import UploadSuccessCard from "@/components/UploadSuccessCard";
import { ShieldCheck, Zap, Lock, Sparkles } from "lucide-react";

export default function Home() {
  const [uploadResult, setUploadResult] = useState(null);

  const handleUploadSuccess = (result) => {
    setUploadResult(result);
  };

  const handleResetUpload = () => {
    setUploadResult(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
      {/* Hero Header & Upload Area */}
      <section className="flex flex-col items-center text-center space-y-6 pt-4 sm:pt-10">
        {/* Subtle pill badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-300 dark:border-[#2563EB]/30 bg-white dark:bg-[#0B1220] px-3.5 py-1.5 text-xs font-medium text-zinc-800 dark:text-[#60A5FA] shadow-sm dark:shadow-[0_0_15px_rgba(37,99,235,0.2)] transition-colors">
          <Sparkles className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
          <span>Aghori Share • Ephemeral • Zero Traces</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-3 max-w-2xl">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white transition-colors">
            Anonymous File Sharing,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 dark:from-[#2563EB] dark:to-[#60A5FA]">
              Zero Traces.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-[#94A3B8] leading-relaxed transition-colors">
            Drag, drop, and share any file in the world — documents, archives, videos, audio, images, or code. No size limit, no accounts, and an active 24-hour self-destruct timer. Powered by Aghori Share.
          </p>
        </div>

        {/* Upload Container: switches smoothly between Dropzone and UploadSuccessCard */}
        <div className="w-full flex justify-center pt-2">
          {uploadResult ? (
            <UploadSuccessCard
              uploadResult={uploadResult}
              onReset={handleResetUpload}
            />
          ) : (
            <Dropzone onUploadSuccess={handleUploadSuccess} />
          )}
        </div>

        {/* Value Proposition Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl pt-2">
          <div className="flex items-center gap-2.5 rounded-xl border border-zinc-200 dark:border-[#151E32] bg-white dark:bg-[#0B1220]/60 p-3.5 text-left shadow-sm dark:shadow-none transition-colors">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-[#2563EB]/15 text-zinc-900 dark:text-[#60A5FA]">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-950 dark:text-white">100% Anonymous</p>
              <p className="text-[11px] text-zinc-500 dark:text-[#94A3B8]">No user accounts or telemetry</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-zinc-200 dark:border-[#151E32] bg-white dark:bg-[#0B1220]/60 p-3.5 text-left shadow-sm dark:shadow-none transition-colors">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-[#2563EB]/15 text-zinc-900 dark:text-[#60A5FA]">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-950 dark:text-white">Self-Destructing</p>
              <p className="text-[11px] text-zinc-500 dark:text-[#94A3B8]">Automatic 24-hour expiration</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-zinc-200 dark:border-[#151E32] bg-white dark:bg-[#0B1220]/60 p-3.5 text-left shadow-sm dark:shadow-none transition-colors">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-[#2563EB]/15 text-zinc-900 dark:text-[#60A5FA]">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-950 dark:text-white">All File Types</p>
              <p className="text-[11px] text-zinc-500 dark:text-[#94A3B8]">PDF, ZIP, Video, Docs, Binaries</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
