"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { UploadCloud, Grid } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-2 sm:top-3 z-50 w-full px-3 sm:px-6 pointer-events-none">
      <div className="pointer-events-auto w-full rounded-xl sm:rounded-2xl border border-zinc-200/70 dark:border-white/10 bg-white/50 dark:bg-[#0B1220]/50 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] px-4 sm:px-6 py-2.5 flex items-center justify-between transition-all">
        {/* Brand with Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition-transform active:scale-95"
          aria-label="Aghori Share Homepage"
        >
          <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-300/80 dark:border-white/20 bg-black shadow-sm transition-all group-hover:scale-105">
            <Image
              src="/Aghori_Baba_Icon_Black.png"
              alt="Aghori Share Logo"
              width={36}
              height={36}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm sm:text-base font-bold tracking-tight text-zinc-950 dark:text-white">
              Aghori
            </span>
            <span className="text-sm sm:text-base font-bold text-[#2563EB] dark:text-[#60A5FA]">
              Share
            </span>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className={`flex items-center gap-1.5 rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium transition-all ${
              pathname === "/"
                ? "bg-zinc-900 text-white dark:bg-[#2563EB] dark:text-white shadow-sm"
                : "text-zinc-600 dark:text-[#94A3B8] hover:bg-black/5 dark:hover:bg-white/10 hover:text-zinc-950 dark:hover:text-white"
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Upload</span>
          </Link>

          <Link
            href="/gallery"
            className={`flex items-center gap-1.5 rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium transition-all ${
              pathname === "/gallery"
                ? "bg-zinc-900 text-white dark:bg-[#2563EB] dark:text-white shadow-sm"
                : "text-zinc-600 dark:text-[#94A3B8] hover:bg-black/5 dark:hover:bg-white/10 hover:text-zinc-950 dark:hover:text-white"
            }`}
          >
            <Grid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Public Gallery</span>
          </Link>
        </nav>

        {/* Right Action: Theme Toggle */}
        <div className="flex items-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
