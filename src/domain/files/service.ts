import { BusinessRuleError } from "../errors";

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/gif",
  // Documents
  "application/pdf",
  "application/json",
  "text/plain",
  "text/csv",
  // Design & Archives
  "application/zip",
  "application/x-zip-compressed",
  "application/vnd.adobe.illustrator",
  "application/postscript",
  // Video & Audio
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/wav",
];

/**
 * Validates uploaded file size and MIME security type.
 */
export function validateFileMetadata(filename: string, mimeType: string, sizeBytes: number): void {
  if (!filename || filename.trim() === "") {
    throw new BusinessRuleError("F-1", "Filename cannot be empty.");
  }

  if (sizeBytes <= 0) {
    throw new BusinessRuleError("F-2", "File size must be greater than zero bytes.");
  }

  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new BusinessRuleError("F-3", `File size (${(sizeBytes / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 50MB.`);
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
    throw new BusinessRuleError("F-4", `MIME type '${mimeType}' is not permitted in Indian Pixel Studio.`);
  }
}

/**
 * Builds isolated multi-tenant storage key namespace.
 */
export function buildStorageKey(
  workspaceId: string,
  projectId: string,
  entityType: string,
  fileId: string,
  filename: string
): string {
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${workspaceId}/${projectId}/${entityType}/${fileId}_${sanitizedFilename}`;
}
