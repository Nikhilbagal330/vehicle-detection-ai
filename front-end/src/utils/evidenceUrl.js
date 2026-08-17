const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Convert stored evidence path into a browser URL.
 * Supports:
 * - "/evidence/file.jpg"
 * - "evidence/file.jpg"
 * - full http(s) URLs
 */
export const getEvidenceUrl = (storedPath) => {
  if (!storedPath) {
    return null;
  }

  if (/^https?:\/\//i.test(storedPath)) {
    return storedPath;
  }

  const normalized = storedPath.replace(/\\/g, "/");

  if (normalized.startsWith("/evidence/")) {
    return `${API_URL}${normalized}`;
  }

  if (normalized.startsWith("evidence/")) {
    return `${API_URL}/${normalized}`;
  }

  const filename = normalized.split("/").pop();

  if (!filename) {
    return null;
  }

  return `${API_URL}/evidence/${encodeURIComponent(filename)}`;
};
