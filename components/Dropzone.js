/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef, useCallback } from "react";
import {
  UploadCloud,
  Clock,
  X,
  AlertCircle,
  Loader2,
  ShieldCheck,
  FileText,
  FileArchive,
  Film,
  Music,
  Code2,
  File,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";

function getFileIcon(filename = "", mimeType = "") {
  const ext = filename.split(".").pop().toLowerCase();
  if (["mp4", "mkv", "webm", "mov", "avi"].includes(ext) || mimeType.startsWith("video/")) {
    return <Film className="h-10 w-10 text-rose-500" />;
  }
  if (["mp3", "wav", "ogg", "flac", "m4a"].includes(ext) || mimeType.startsWith("audio/")) {
    return <Music className="h-10 w-10 text-violet-500" />;
  }
  if (["zip", "rar", "7z", "tar", "gz", "iso"].includes(ext) || mimeType.includes("zip") || mimeType.includes("compressed")) {
    return <FileArchive className="h-10 w-10 text-amber-500" />;
  }
  if (["pdf", "doc", "docx", "txt", "rtf", "odt"].includes(ext) || mimeType.includes("pdf") || mimeType.includes("document")) {
    return <FileText className="h-10 w-10 text-blue-500" />;
  }
  if (["js", "ts", "jsx", "tsx", "py", "json", "html", "css", "cpp", "c", "java", "rs"].includes(ext)) {
    return <Code2 className="h-10 w-10 text-emerald-500" />;
  }
  return <File className="h-10 w-10 text-zinc-500 dark:text-[#94A3B8]" />;
}

export default function Dropzone({ onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isImageFile, setIsImageFile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState("");
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const xhrRef = useRef(null);

  const validateAndSelectFile = useCallback((file) => {
    setError(null);

    if (!file) return;

    if (file.size === 0) {
      setError("Selected file is empty (0 bytes).");
      return;
    }

    // 50 MB limit (Supabase free tier max)
    if (file.size > 50 * 1024 * 1024) {
      setError(`File exceeds the 50 MB limit (${formatBytes(file.size)}).`);
      return;
    }

    setSelectedFile(file);

    const isImage =
      file.type.startsWith("image/") ||
      /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|avif)$/i.test(file.name);

    setIsImageFile(isImage);

    if (isImage) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    } else {
      setPreviewUrl(null);
    }
  }, []);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        validateAndSelectFile(e.dataTransfer.files[0]);
      }
    },
    [validateAndSelectFile]
  );

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    if (uploading && xhrRef.current) {
      xhrRef.current.abort();
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsImageFile(false);
    setError(null);
    setProgress(0);
    setUploadStatusText("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || uploading) return;

    setUploading(true);
    setProgress(5);
    setUploadStatusText("Requesting direct storage authorization...");
    setError(null);

    try {
      // Step 1: Request presigned upload URL from Vercel Serverless (tiny JSON payload)
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: selectedFile.name,
          size: selectedFile.size,
          mimeType: selectedFile.type,
        }),
      });

      const presignData = await presignRes.json();
      if (!presignRes.ok || !presignData.success) {
        throw new Error(presignData.error || "Failed to initialize direct storage upload.");
      }

      setUploadStatusText("Streaming directly to Supabase Storage CDN...");

      // Step 2: Upload binary DIRECTLY to Supabase Storage with real live progress tracking
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 90);
            setProgress(Math.max(10, percent));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Direct storage upload failed with status ${xhr.status}.`));
          }
        };

        xhr.onerror = () => reject(new Error("Network connection error during direct upload."));
        xhr.onabort = () => reject(new Error("Upload cancelled by user."));

        xhr.open("PUT", presignData.signedUrl);
        xhr.setRequestHeader("Content-Type", presignData.mimeType || selectedFile.type || "application/octet-stream");
        xhr.send(selectedFile);
      });

      setProgress(95);
      setUploadStatusText("Finalizing database record...");

      // Step 3: Confirm upload completion in MongoDB Atlas
      const completeRes = await fetch("/api/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: presignData.fileId,
          storagePath: presignData.storagePath,
          originalName: presignData.originalName,
          mimeType: presignData.mimeType,
          size: selectedFile.size,
        }),
      });

      const completeData = await completeRes.json();
      if (!completeRes.ok || !completeData.success) {
        throw new Error(completeData.error || "Failed to finalize file metadata.");
      }

      setProgress(100);
      setUploadStatusText("Upload complete!");

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      onUploadSuccess(completeData);
    } catch (err) {
      console.error("[Aghori Share] Direct upload error:", err);
      setError(err.message || "Failed to upload file. Please try again.");
      setProgress(0);
    } finally {
      setUploading(false);
      xhrRef.current = null;
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <form onSubmit={handleUpload}>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />

        {/* Dropzone Card */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`relative rounded-2xl border transition-all duration-200 bg-white dark:bg-[#0B1220] ${
            dragActive
              ? "border-[#2563EB] bg-blue-50/40 dark:bg-[#0B1220]/90 shadow-[0_0_30px_rgba(37,99,235,0.3)] scale-[1.01]"
              : selectedFile
              ? "border-zinc-400 dark:border-[#2563EB]/40 shadow-sm dark:shadow-[0_0_20px_rgba(37,99,235,0.15)]"
              : "border-zinc-300 dark:border-[#151E32] hover:border-zinc-950 dark:hover:border-[#2563EB]/50 shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-[0_0_20px_rgba(37,99,235,0.15)]"
          }`}
        >
          {!selectedFile ? (
            /* Empty State / Drop Prompt */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-8 sm:p-12 text-center cursor-pointer select-none group"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-200 dark:border-[#151E32] bg-zinc-100 dark:bg-[#05070B] text-zinc-900 dark:text-[#60A5FA] shadow-inner transition-transform group-hover:scale-105 group-hover:border-zinc-400 dark:group-hover:border-[#2563EB]/60 group-hover:shadow-[0_0_20px_rgba(37,99,235,0.25)]">
                <UploadCloud className="h-8 w-8 transition-colors group-hover:text-[#2563EB] dark:group-hover:text-white" />
              </div>

              <h3 className="text-lg font-semibold text-zinc-950 dark:text-white tracking-tight">
                Drop any file here, or{" "}
                <span className="text-[#2563EB] dark:text-[#60A5FA] group-hover:underline">browse</span>
              </h3>
              <p className="mt-2 text-xs text-zinc-500 dark:text-[#94A3B8] max-w-sm">
                Supports all file types up to 50 MB. Fast direct CDN upload, 100% anonymous, 24-hour automatic self-destruct.
              </p>
            </div>
          ) : (
            /* Selected File Preview State */
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Thumbnail / File Icon */}
                <div className="relative h-28 w-28 shrink-0 flex items-center justify-center overflow-hidden rounded-xl border border-zinc-200 dark:border-[#151E32] bg-zinc-100 dark:bg-[#05070B]">
                  {isImageFile && previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Selected preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-2">
                      {getFileIcon(selectedFile.name, selectedFile.type)}
                      <span className="mt-1 text-[10px] uppercase font-bold tracking-wider text-zinc-500 dark:text-[#94A3B8]">
                        {selectedFile.name.split(".").pop() || "FILE"}
                      </span>
                    </div>
                  )}
                </div>

                {/* File Details */}
                <div className="flex-1 w-full space-y-2 text-center sm:text-left">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-zinc-950 dark:text-white truncate max-w-[240px] sm:max-w-[320px]">
                      {selectedFile.name}
                    </p>
                    <button
                      type="button"
                      onClick={handleClear}
                      disabled={uploading}
                      className="p-1 rounded-lg text-zinc-400 dark:text-[#94A3B8] hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#151E32] transition-colors disabled:opacity-40"
                      title="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-[#94A3B8]">
                    {formatBytes(selectedFile.size)} • {selectedFile.type || "Any File Type"}
                  </p>

                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 dark:border-[#2563EB]/30 bg-blue-50 dark:bg-[#05070B] px-3 py-1 text-xs font-medium text-blue-700 dark:text-[#60A5FA]">
                      <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-[#2563EB]" />
                      Live 24h Countdown
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-[#151E32] bg-zinc-100 dark:bg-[#05070B] px-3 py-1 text-xs text-zinc-700 dark:text-[#94A3B8]">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      Direct CDN Upload
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {uploading && (
                <div className="mt-6 space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-zinc-600 dark:text-[#94A3B8]">
                    <span>{uploadStatusText}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-[#05070B]">
                    <div
                      className="h-full bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-[#2563EB] dark:to-[#60A5FA] transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-[#151E32]">
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={uploading}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-zinc-600 dark:text-[#94A3B8] hover:text-zinc-950 dark:hover:text-white disabled:opacity-40 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center gap-2 rounded-xl bg-zinc-950 dark:bg-[#2563EB] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:hover:bg-[#3B82F6] dark:shadow-[0_0_15px_rgba(37,99,235,0.35)] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Uploading Directly...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4" />
                      <span>Upload & Get Share Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-xs text-red-600 dark:text-red-400 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
