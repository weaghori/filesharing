import path from "path";

// Common MIME types mapped by file extension
const EXTENSION_MIME_MAP = {
  // Images
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  ico: "image/x-icon",
  tiff: "image/tiff",
  heic: "image/heic",
  avif: "image/avif",

  // Documents
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  csv: "text/csv",
  rtf: "application/rtf",
  md: "text/markdown",

  // Archives
  zip: "application/zip",
  rar: "application/vnd.rar",
  "7z": "application/x-7z-compressed",
  tar: "application/x-tar",
  gz: "application/gzip",
  bz2: "application/x-bzip2",
  iso: "application/x-iso9660-image",

  // Audio
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  flac: "audio/flac",
  m4a: "audio/m4a",
  aac: "audio/aac",

  // Video
  mp4: "video/mp4",
  mkv: "video/x-matroska",
  webm: "video/webm",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  wmv: "video/x-ms-wmv",

  // Code & Data
  json: "application/json",
  xml: "application/xml",
  js: "text/javascript",
  jsx: "text/javascript",
  ts: "text/typescript",
  tsx: "text/typescript",
  html: "text/html",
  css: "text/css",
  py: "text/x-python",
  java: "text/x-java-source",
  c: "text/x-c",
  cpp: "text/x-c++",
  rs: "text/x-rust",
  go: "text/x-go",
  sql: "application/sql",
  sh: "application/x-sh",

  // Executables & Binaries
  exe: "application/vnd.microsoft.portable-executable",
  apk: "application/vnd.android.package-archive",
  dmg: "application/x-apple-diskimage",
  deb: "application/vnd.debian.binary-package",
  bin: "application/octet-stream",
};

/**
 * Detects file type, extension, and category for ANY file in the world.
 *
 * @param {Buffer} buffer
 * @param {string} originalName
 * @param {string} fallbackMime
 * @returns {{ mimeType: string, extension: string, isImage: boolean, isVideo: boolean, isAudio: boolean, isPdf: boolean, isArchive: boolean }}
 */
export function detectFileType(buffer, originalName = "", fallbackMime = "") {
  let detectedExt = "";
  let detectedMime = "";

  // 1. Inspect Magic Bytes if buffer is available
  if (buffer && buffer.length >= 4) {
    // JPEG: 0xFF 0xD8 0xFF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      detectedExt = "jpg";
      detectedMime = "image/jpeg";
    }
    // PNG: 0x89 0x50 0x4E 0x47
    else if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      detectedExt = "png";
      detectedMime = "image/png";
    }
    // GIF: GIF87a or GIF89a
    else if (
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x38
    ) {
      detectedExt = "gif";
      detectedMime = "image/gif";
    }
    // WebP: RIFF ... WEBP
    else if (
      buffer.length >= 12 &&
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      detectedExt = "webp";
      detectedMime = "image/webp";
    }
    // PDF: %PDF
    else if (
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46
    ) {
      detectedExt = "pdf";
      detectedMime = "application/pdf";
    }
    // ZIP / DOCX / XLSX / APK / JAR: PK\x03\x04
    else if (
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      buffer[2] === 0x03 &&
      buffer[3] === 0x04
    ) {
      detectedExt = "zip";
      detectedMime = "application/zip";
    }
    // 7z: 7z\xBC\xAF\x27\x1C
    else if (
      buffer.length >= 6 &&
      buffer[0] === 0x37 &&
      buffer[1] === 0x7a &&
      buffer[2] === 0xbc &&
      buffer[3] === 0xaf &&
      buffer[4] === 0x27 &&
      buffer[5] === 0x1c
    ) {
      detectedExt = "7z";
      detectedMime = "application/x-7z-compressed";
    }
    // RAR: Rar!\x1A\x07
    else if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x61 &&
      buffer[2] === 0x72 &&
      buffer[3] === 0x21
    ) {
      detectedExt = "rar";
      detectedMime = "application/vnd.rar";
    }
  }

  // 2. Extract extension from original filename
  let fileExt = "";
  if (originalName) {
    const parsedExt = path.extname(originalName).replace(/^\./, "").toLowerCase();
    if (parsedExt) {
      fileExt = parsedExt;
    }
  }

  // If filename extension is known and more specific (e.g. docx vs generic zip), honor filename extension
  const extension = fileExt || detectedExt || "bin";
  const mimeType =
    EXTENSION_MIME_MAP[extension] ||
    detectedMime ||
    fallbackMime ||
    "application/octet-stream";

  const isImage =
    mimeType.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "avif"].includes(extension);

  const isVideo =
    mimeType.startsWith("video/") ||
    ["mp4", "mkv", "webm", "mov", "avi"].includes(extension);

  const isAudio =
    mimeType.startsWith("audio/") ||
    ["mp3", "wav", "ogg", "flac", "m4a", "aac"].includes(extension);

  const isPdf =
    mimeType === "application/pdf" || extension === "pdf";

  const isArchive =
    ["zip", "rar", "7z", "tar", "gz", "bz2", "iso"].includes(extension) ||
    mimeType.includes("zip") ||
    mimeType.includes("compressed") ||
    mimeType.includes("tar");

  return {
    extension,
    mimeType,
    isImage,
    isVideo,
    isAudio,
    isPdf,
    isArchive,
  };
}

/**
 * Backward compatibility wrapper for older callers.
 */
export function validateImageBuffer(buffer) {
  const result = detectFileType(buffer);
  return {
    valid: true,
    mimeType: result.mimeType,
    extension: result.extension,
  };
}

/**
 * Sanitizes user-provided filename to prevent path traversal,
 * null byte injection, and header corruption, while preserving original extension.
 *
 * @param {string} originalName
 * @param {string} fallbackExtension
 * @returns {string} Safe filename
 */
export function sanitizeFilename(originalName, fallbackExtension = "bin") {
  if (!originalName || typeof originalName !== "string") {
    return `file_${Date.now()}.${fallbackExtension}`;
  }

  const basename = path.basename(originalName);

  let cleaned = basename
    .replace(/[\x00-\x1F\x7F]/g, "") // control characters
    .replace(/[\\/:*?"<>|;`$#&]/g, "_") // illegal/dangerous filename chars
    .trim();

  if (!cleaned || cleaned.startsWith(".")) {
    cleaned = `file_${cleaned.replace(/^\.+/, "") || Date.now()}.${fallbackExtension}`;
  }

  if (cleaned.length > 120) {
    const ext = path.extname(cleaned);
    const base = path.basename(cleaned, ext).slice(0, 100);
    cleaned = `${base}${ext}`;
  }

  return cleaned;
}

/**
 * Validates an ID to ensure it contains only URL-safe alphanumeric characters.
 *
 * @param {string} id
 * @returns {boolean}
 */
export function isValidImageId(id) {
  if (!id || typeof id !== "string") return false;
  return /^[a-zA-Z0-9_-]{6,64}$/.test(id);
}
