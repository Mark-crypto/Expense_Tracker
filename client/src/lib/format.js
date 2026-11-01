export const formatKES = (amount, decimals = 0) =>
  `KES ${Number(amount || 0).toLocaleString("en-KE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;

// The user's own date as YYYY-MM-DD, not the UTC date.
export const localToday = () => new Date().toLocaleDateString("en-CA");

export const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const compactNumber = (value) =>
  Intl.NumberFormat("en-KE", { notation: "compact" }).format(value);

export const formatFileSize = (bytes) => {
  if (!bytes) return "0 Bytes";
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / 1024 ** i).toFixed(2))} ${sizes[i]}`;
};

// Item breakdowns are stored as JSON text.
export const parseItems = (value) => {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const initials = (name) =>
  name
    ?.trim()
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2) || "U";

export const titleCase = (text) =>
  text?.replace(/\b\w/g, (char) => char.toUpperCase()) ?? "";
