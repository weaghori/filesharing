import { randomBytes } from "crypto";

export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function generateShortId(length = 8) {
  return randomBytes(Math.ceil((length * 3) / 4))
    .toString("base64")
    .replace(/[+/=]/g, "")
    .substring(0, length);
}

export function formatTimeAgo(timestamp) {
  if (!timestamp) return "";
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export function getTimeRemaining(expiresAt) {
  if (!expiresAt) return { isExpired: false, label: "Never expires", seconds: Infinity };
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { isExpired: true, label: "Expired", seconds: 0 };

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let label = "";
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    label = `${days}d ${hours % 24}h remaining`;
  } else if (hours > 0) {
    label = `${hours}h ${minutes}m remaining`;
  } else if (minutes > 0) {
    label = `${minutes}m ${seconds}s remaining`;
  } else {
    label = `${seconds}s remaining`;
  }

  return { isExpired: false, label, seconds: totalSeconds };
}
