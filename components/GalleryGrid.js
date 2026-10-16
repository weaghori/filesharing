/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Eye,
  File,
  FileText,
  FileArchive,
  Film,
  Music,
  Code2,
} from "lucide-react";
import CountdownBadge from "./CountdownBadge";
import { formatBytes, formatTimeAgo } from "@/lib/utils";

function renderCardThumbnail(file) {
  const ext = (file.extension || file.originalName?.split(".").pop() || "").toLowerCase();
  const mime = file.mimeType || "";

  if (file.isImage || mime.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "avif"].includes(ext)) {
    return (
      <img
        src={file.publicUrl}
        alt={file.originalName}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    );
  }

  let Icon = File;
  let color = "text-zinc-500 dark:text-[#94A3B8]";

  if (file.isVideo || mime.startsWith("video/") || ["mp4", "mkv", "webm", "mov"].includes(ext)) {
    Icon = Film;
    color = "text-rose-500";
  } else if (file.isAudio || mime.startsWith("audio/") || ["mp3", "wav", "flac"].includes(ext)) {
    Icon = Music;
    color = "text-violet-500";
  } else if (file.isPdf || ext === "pdf") {
    Icon = FileText;
    color = "text-red-500";
  } else if (file.isArchive || ["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    Icon = FileArchive;
    color = "text-amber-500";
  } else if (["js", "ts", "py", "html", "css", "cpp", "json"].includes(ext)) {
    Icon = Code2;
    color = "text-emerald-500";
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-zinc-100 dark:bg-[#05070B] p-4 text-center">
      <Icon className={`h-12 w-12 ${color} transition-transform duration-300 group-hover:scale-110`} />
      <span className="mt-2 text-xs font-mono font-bold uppercase tracking-wider text-zinc-600 dark:text-[#94A3B8]">
        .{ext || "FILE"}
      </span>
    </div>
  );
}

export default function GalleryGrid({ refreshKey, limit = 12 }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchImages = useCallback(async (targetPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/images?page=${targetPage}&limit=${limit}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load public files.");
      }

      setImages(data.images || []);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("[Aghori Share] Gallery fetch error:", err);
      setError(err.message || "Failed to load gallery files.");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const res = await fetch(`/api/images?page=${page}&limit=${limit}`);
        const data = await res.json();

        if (!ignore) {
          if (!res.ok || !data.success) {
            setError(data.error || "Failed to load public files.");
          } else {
            setImages(data.images || []);
            setTotalPages(data.totalPages || 1);
            setTotal(data.total || 0);
          }
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Failed to load gallery files.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [page, limit, refreshKey]);

  return (
    <div className="w-full space-y-6">
      {/* Gallery Header / Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-[#151E32] pb-4 transition-colors">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
            <span>Public Ephemeral Files</span>
            <span className="rounded-full bg-zinc-100 dark:bg-[#151E32] px-2.5 py-0.5 text-xs font-semibold text-zinc-800 dark:text-[#60A5FA]">
              {total} active
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-[#94A3B8] mt-0.5">
            Files currently accessible across the network before their 24-hour expiration
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchImages(page)}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-[#151E32] bg-white dark:bg-[#0B1220] px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-[#94A3B8] hover:text-zinc-950 dark:hover:text-white hover:border-zinc-400 dark:hover:border-[#2563EB]/40 shadow-sm dark:shadow-none transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#2563EB] dark:text-[#60A5FA]" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Loading Skeleton State */}
      {loading && images.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-zinc-200 dark:border-[#151E32] bg-white dark:bg-[#0B1220] p-3 space-y-3 shadow-sm dark:shadow-none"
            >
              <div className="skeleton h-44 w-full rounded-xl" />
              <div className="space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="flex justify-between">
                  <div className="skeleton h-3 w-1/3 rounded" />
                  <div className="skeleton h-3 w-1/4 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-white dark:bg-[#0B1220] p-12 text-center shadow-sm dark:shadow-none">
          <AlertCircle className="h-10 w-10 text-red-500 dark:text-red-400 mb-3" />
          <h3 className="text-base font-semibold text-zinc-950 dark:text-white">Could not load files</h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-[#94A3B8] max-w-sm">{error}</p>
          <button
            onClick={() => fetchImages(page)}
            className="mt-4 rounded-xl border border-zinc-300 dark:border-[#2563EB]/40 bg-zinc-50 dark:bg-[#05070B] px-4 py-2 text-xs font-medium text-zinc-900 dark:text-[#60A5FA] hover:bg-zinc-100 dark:hover:bg-[#2563EB]/20 transition-all"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && images.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200 dark:border-[#151E32] bg-white dark:bg-[#0B1220] p-16 text-center shadow-sm dark:shadow-none">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-200 dark:border-[#151E32] bg-zinc-100 dark:bg-[#05070B] text-zinc-400 dark:text-[#94A3B8] mb-4">
            <File className="h-8 w-8" />
          </div>
          <h3 className="text-base font-semibold text-zinc-950 dark:text-white">No active files in gallery</h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-[#94A3B8] max-w-sm">
            Uploaded files will appear here until their timer reaches zero. Be the first to share one!
          </p>
        </div>
      )}

      {/* Populated File Grid */}
      {!loading && !error && images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {images.map((file) => (
            <div
              key={file.imageId}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 dark:border-[#151E32] bg-white dark:bg-[#0B1220] p-3 shadow-sm dark:shadow-none transition-all duration-300 hover:border-zinc-950 dark:hover:border-[#2563EB]/50 hover:shadow-md dark:hover:shadow-[0_0_24px_rgba(37,99,235,0.2)]"
            >
              {/* File Preview Container */}
              <Link
                href={`/i/${file.imageId}`}
                className="relative block aspect-[4/3] w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-[#151E32] bg-zinc-100 dark:bg-[#05070B]"
                aria-label={`View ${file.originalName}`}
              >
                {renderCardThumbnail(file)}

                {/* Top Overlay Badges */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                  <CountdownBadge
                    expiresAt={file.expiresAt}
                  />

                  <span className="rounded-full bg-black/75 backdrop-blur-sm px-2 py-0.5 text-[10px] font-mono font-medium text-white border border-white/10">
                    {formatBytes(file.size)}
                  </span>
                </div>

                {/* Hover overlay hint */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <span className="flex items-center gap-1.5 rounded-lg bg-zinc-950 dark:bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
                    <Eye className="h-3.5 w-3.5" />
                    View Details
                  </span>
                </div>
              </Link>

              {/* Card Footer Info */}
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/i/${file.imageId}`}
                    className="block truncate text-xs font-semibold text-zinc-950 dark:text-white hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors"
                    title={file.originalName}
                  >
                    {file.originalName}
                  </Link>
                  <p className="text-[11px] text-zinc-500 dark:text-[#94A3B8]">
                    {formatTimeAgo(file.createdAt)}
                  </p>
                </div>

                {/* Direct Download Action */}
                <a
                  href={`/api/images/${file.imageId}/download`}
                  download={file.originalName}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 dark:border-[#151E32] bg-zinc-100 dark:bg-[#05070B] text-zinc-700 dark:text-[#94A3B8] transition-colors hover:border-zinc-950 dark:hover:border-[#2563EB]/40 hover:bg-zinc-200 dark:hover:bg-[#2563EB]/20 hover:text-zinc-950 dark:hover:text-[#60A5FA]"
                  title="Download file"
                  aria-label={`Download ${file.originalName}`}
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 dark:border-[#151E32] pt-6 transition-colors">
          <p className="text-xs text-zinc-500 dark:text-[#94A3B8]">
            Showing page <span className="font-semibold text-zinc-950 dark:text-white">{page}</span> of{" "}
            <span className="font-semibold text-zinc-950 dark:text-white">{totalPages}</span>
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1 || loading}
              className="flex items-center gap-1 rounded-xl border border-zinc-200 dark:border-[#151E32] bg-white dark:bg-[#0B1220] px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-[#94A3B8] hover:text-zinc-950 dark:hover:text-white hover:border-zinc-400 dark:hover:border-[#2563EB]/40 shadow-sm dark:shadow-none transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages || loading}
              className="flex items-center gap-1 rounded-xl border border-zinc-200 dark:border-[#151E32] bg-white dark:bg-[#0B1220] px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-[#94A3B8] hover:text-zinc-950 dark:hover:text-white hover:border-zinc-400 dark:hover:border-[#2563EB]/40 shadow-sm dark:shadow-none transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
