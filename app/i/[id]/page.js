/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import {
  Download,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  ArrowLeft,
  Calendar,
  HardDrive,
  Eye,
  Loader2,
  Sparkles,
  FileText,
  FileArchive,
  Film,
  Music,
  Code2,
  File,
} from "lucide-react";
import CountdownBadge from "@/components/CountdownBadge";
import ExpirationTimerCard from "@/components/ExpirationTimerCard";
import { formatBytes, formatTimeAgo } from "@/lib/utils";

function renderFilePreview(file) {
  const ext = (file.extension || file.originalName?.split(".").pop() || "").toLowerCase();
  const mime = file.mimeType || "";

  // 1. Image preview
  if (file.isImage || mime.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "avif"].includes(ext)) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-[#151E32] bg-zinc-100 dark:bg-[#0B1220] shadow-lg dark:shadow-[0_0_35px_rgba(37,99,235,0.15)] flex items-center justify-center p-3 sm:p-6 min-h-[350px] transition-colors">
        <img
          src={file.publicUrl}
          alt={file.originalName}
          className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
        />
      </div>
    );
  }

  // 2. Video preview
  if (file.isVideo || mime.startsWith("video/") || ["mp4", "webm", "ogg", "mov"].includes(ext)) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-[#151E32] bg-black p-2 sm:p-4 flex items-center justify-center min-h-[350px]">
        <video
          controls
          className="max-h-[70vh] w-full rounded-xl object-contain"
          src={file.publicUrl}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // 3. Audio preview
  if (file.isAudio || mime.startsWith("audio/") || ["mp3", "wav", "ogg", "flac", "m4a"].includes(ext)) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-[#151E32] bg-zinc-50 dark:bg-[#0B1220] p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-6 shadow-md">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/30">
          <Music className="h-10 w-10" />
        </div>
        <div className="max-w-md w-full">
          <h3 className="text-lg font-bold text-zinc-950 dark:text-white truncate">{file.originalName}</h3>
          <p className="text-xs text-zinc-500 dark:text-[#94A3B8] mt-1">{formatBytes(file.size)} • Audio Stream</p>
        </div>
        <audio controls className="w-full max-w-md" src={file.publicUrl}>
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }

  // 4. PDF preview
  if (file.isPdf || mime === "application/pdf" || ext === "pdf") {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-[#151E32] bg-zinc-50 dark:bg-[#0B1220] p-6 sm:p-10 text-center flex flex-col items-center justify-center space-y-6 shadow-md">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30">
          <FileText className="h-10 w-10" />
        </div>
        <div className="max-w-md">
          <h3 className="text-lg font-bold text-zinc-950 dark:text-white truncate">{file.originalName}</h3>
          <p className="text-xs text-zinc-500 dark:text-[#94A3B8] mt-1">PDF Document • {formatBytes(file.size)}</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={file.publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-[#151E32] bg-white dark:bg-[#05070B] px-4 py-2.5 text-xs font-semibold text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#151E32] transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Open PDF in New Tab</span>
          </a>
          <a
            href={`/api/images/${file.imageId}/download`}
            download={file.originalName}
            className="flex items-center gap-2 rounded-xl bg-zinc-950 dark:bg-[#2563EB] px-5 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:hover:bg-[#3B82F6] transition-all"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </a>
        </div>
      </div>
    );
  }

  // 5. Generic File preview (Archives, Documents, Code, Binaries, etc.)
  let IconComponent = File;
  if (["zip", "rar", "7z", "tar", "gz", "iso"].includes(ext)) IconComponent = FileArchive;
  else if (["js", "ts", "jsx", "tsx", "py", "json", "html", "css", "cpp", "c", "java", "rs"].includes(ext)) IconComponent = Code2;
  else if (["doc", "docx", "txt", "rtf", "odt", "csv", "xls", "xlsx"].includes(ext)) IconComponent = FileText;

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-[#151E32] bg-zinc-50 dark:bg-[#0B1220] p-8 sm:p-14 text-center flex flex-col items-center justify-center space-y-6 shadow-md transition-colors">
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-zinc-200/80 dark:bg-[#05070B] text-zinc-800 dark:text-[#60A5FA] border border-zinc-300 dark:border-[#2563EB]/40 shadow-inner">
        <IconComponent className="h-12 w-12" />
      </div>

      <div className="max-w-lg space-y-1">
        <div className="inline-block rounded-md bg-zinc-200 dark:bg-[#151E32] px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-700 dark:text-[#60A5FA]">
          .{ext || "FILE"}
        </div>
        <h3 className="text-xl font-bold text-zinc-950 dark:text-white break-all">{file.originalName}</h3>
        <p className="text-xs text-zinc-500 dark:text-[#94A3B8]">{formatBytes(file.size)} • {file.mimeType || "Binary Stream"}</p>
      </div>

      <a
        href={`/api/images/${file.imageId}/download`}
        download={file.originalName}
        className="flex items-center gap-2.5 rounded-xl bg-zinc-950 dark:bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800 dark:hover:bg-[#3B82F6] shadow-md dark:shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95 transition-all"
      >
        <Download className="h-4 w-4" />
        <span>Download File ({formatBytes(file.size)})</span>
      </a>
    </div>
  );
}

function ImagePreviewContent({ params }) {
  const resolvedParams = use(params);
  const id = resolvedParams?.id;

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function loadFile() {
      setLoading(true);
      try {
        const res = await fetch(`/api/images/${id}`);
        const data = await res.json();

        if (res.status === 410 || data.code === "EXPIRED" || data.error === "expired") {
          setErrorStatus("expired");
          setErrorMessage(data.error || "This file has reached its 24-hour expiration limit and has been permanently purged.");
          return;
        }

        if (res.status === 404 || data.code === "NOT_FOUND" || data.error === "not_found") {
          setErrorStatus("not_found");
          setErrorMessage(data.error || "This file does not exist or has already expired.");
          return;
        }

        if (!res.ok || !data.success) {
          setErrorStatus("error");
          setErrorMessage(data.error || "Unable to retrieve the requested file.");
          return;
        }

        setFile(data.image);
      } catch (err) {
        console.error("[Aghori Share] Preview page fetch error:", err);
        setErrorStatus("error");
        setErrorMessage("A network error occurred while retrieving this file.");
      } finally {
        setLoading(false);
      }
    }

    loadFile();
  }, [id]);

  const handleCopyLink = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 dark:border-[#2563EB]/40 bg-white dark:bg-[#0B1220] shadow-md dark:shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-900 dark:text-[#60A5FA]" />
          </div>
          <p className="text-sm text-zinc-600 dark:text-[#94A3B8]">Retrieving encrypted file record...</p>
        </div>
      </div>
    );
  }

  if (errorStatus || !file) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:py-24 text-center">
        <div className="rounded-3xl border border-zinc-200 dark:border-[#151E32] bg-white dark:bg-[#0B1220] p-8 sm:p-12 shadow-xl dark:shadow-2xl relative overflow-hidden transition-colors">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-50 dark:bg-[#05070B] text-red-600 dark:text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.2)]">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
            {errorStatus === "expired" ? "File Has Expired" : "File Unavailable"}
          </h1>

          <p className="mt-3 text-sm text-zinc-600 dark:text-[#94A3B8] leading-relaxed max-w-md mx-auto">
            {errorMessage || "This file has passed its designated 24-hour lifetime and was purged from storage. Zero server copies remain."}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-zinc-950 dark:bg-[#2563EB] px-5 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:hover:bg-[#3B82F6] shadow-sm dark:shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all"
            >
              <Sparkles className="h-4 w-4" />
              <span>Upload a New File</span>
            </Link>

            <Link
              href="/gallery"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-[#151E32] bg-white dark:bg-[#05070B] px-5 py-2.5 text-xs font-medium text-zinc-700 dark:text-[#94A3B8] hover:text-zinc-950 dark:hover:text-white shadow-sm transition-colors"
            >
              <span>Explore Public Gallery</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-[#151E32] pb-5 transition-colors">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-[#151E32] bg-white dark:bg-[#0B1220] text-zinc-700 dark:text-[#94A3B8] hover:text-zinc-950 dark:hover:text-white hover:border-zinc-400 dark:hover:border-[#2563EB]/40 shadow-sm transition-colors"
            title="Back to Upload"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-zinc-950 dark:text-white truncate max-w-xs sm:max-w-md">
              {file.originalName}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-[#94A3B8]">
              {formatBytes(file.size)} • {file.mimeType}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <CountdownBadge
            expiresAt={file.expiresAt}
            onExpire={() => setErrorStatus("expired")}
          />

          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium transition-all ${
              copied
                ? "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                : "border-zinc-300 dark:border-[#151E32] bg-white dark:bg-[#0B1220] text-zinc-700 dark:text-[#94A3B8] hover:text-zinc-950 dark:hover:text-white hover:border-zinc-400 dark:hover:border-[#2563EB]/40 shadow-sm"
            }`}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Link Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          <a
            href={`/api/images/${file.imageId}/download`}
            download={file.originalName}
            className="flex items-center gap-1.5 rounded-xl bg-zinc-950 dark:bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:hover:bg-[#3B82F6] dark:shadow-[0_0_15px_rgba(37,99,235,0.35)] transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download</span>
          </a>
        </div>
      </div>

      {/* Prominent Live Expiration Timer Card */}
      <ExpirationTimerCard
        expiresAt={file.expiresAt}
        onExpire={() => setErrorStatus("expired")}
      />

      {/* File Stage: Image, Video, Audio, PDF, or File Card */}
      {renderFilePreview(file)}

      {/* Metadata & Details Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-200 dark:border-[#151E32] bg-white dark:bg-[#0B1220] p-4 space-y-1 shadow-sm dark:shadow-none transition-colors">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-[#94A3B8]">
            <Calendar className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
            <span>Uploaded</span>
          </div>
          <p className="text-sm font-semibold text-zinc-950 dark:text-white">
            {formatTimeAgo(file.createdAt)}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-[#151E32] bg-white dark:bg-[#0B1220] p-4 space-y-1 shadow-sm dark:shadow-none transition-colors">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-[#94A3B8]">
            <HardDrive className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
            <span>File Size</span>
          </div>
          <p className="text-sm font-semibold text-zinc-950 dark:text-white">
            {formatBytes(file.size)}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-[#151E32] bg-white dark:bg-[#0B1220] p-4 space-y-1 shadow-sm dark:shadow-none transition-colors">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-[#94A3B8]">
            <Eye className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
            <span>View Count</span>
          </div>
          <p className="text-sm font-semibold text-zinc-950 dark:text-white">
            {file.views || 1} {file.views === 1 ? "view" : "views"}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-[#151E32] bg-white dark:bg-[#0B1220] p-4 space-y-1 shadow-sm dark:shadow-none flex flex-col justify-center transition-colors">
          <a
            href={file.publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline"
          >
            <span>Open Direct File</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function FilePreviewPage({ params }) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[65vh] px-4">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 dark:border-[#2563EB]/40 bg-white dark:bg-[#0B1220] shadow-md dark:shadow-[0_0_20px_rgba(37,99,235,0.3)]">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-900 dark:text-[#60A5FA]" />
            </div>
            <p className="text-sm text-zinc-600 dark:text-[#94A3B8]">Loading file preview...</p>
          </div>
        </div>
      }
    >
      <ImagePreviewContent params={params} />
    </Suspense>
  );
}
