import { BusinessRuleError } from "../errors";
import { logger } from "@/lib/logger";

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

export interface PresignedUploadResult {
  uploadUrl: string;
  storageKey: string;
  expiresInSeconds: number;
}

export interface PresignedDownloadResult {
  downloadUrl: string;
  expiresInSeconds: number;
}

export interface ObjectStorageProvider {
  generatePresignedUploadUrl(
    storageKey: string,
    mimeType: string,
    expiresInSeconds?: number
  ): Promise<PresignedUploadResult>;
  generatePresignedDownloadUrl(
    storageKey: string,
    expiresInSeconds?: number
  ): Promise<PresignedDownloadResult>;
}

export class S3CompatibleStorageProvider implements ObjectStorageProvider {
  private bucketName: string;

  constructor(bucketName = process.env.STORAGE_BUCKET_NAME || "indian-pixel-assets") {
    this.bucketName = bucketName;
  }

  async generatePresignedUploadUrl(
    storageKey: string,
    mimeType: string,
    expiresInSeconds = 900
  ): Promise<PresignedUploadResult> {
    logger.info("storage.upload.started", { storageKey, mimeType });

    // Deterministic presigned upload endpoint
    const uploadUrl = `https://${this.bucketName}.storage.indianpixel.com/${storageKey}?upload=true&expires=${expiresInSeconds}`;

    logger.info("storage.upload.succeeded", { storageKey });
    return {
      uploadUrl,
      storageKey,
      expiresInSeconds,
    };
  }

  async generatePresignedDownloadUrl(
    storageKey: string,
    expiresInSeconds = 3600
  ): Promise<PresignedDownloadResult> {
    const downloadUrl = `https://${this.bucketName}.storage.indianpixel.com/${storageKey}?download=true&expires=${expiresInSeconds}`;
    return {
      downloadUrl,
      expiresInSeconds,
    };
  }
}

export class LocalStorageProvider implements ObjectStorageProvider {
  async generatePresignedUploadUrl(
    storageKey: string,
    mimeType: string,
    expiresInSeconds = 900
  ): Promise<PresignedUploadResult> {
    logger.info("storage.upload.local", { storageKey, mimeType });
    return {
      uploadUrl: `/api/files/upload?key=${encodeURIComponent(storageKey)}`,
      storageKey,
      expiresInSeconds,
    };
  }

  async generatePresignedDownloadUrl(
    storageKey: string,
    expiresInSeconds = 3600
  ): Promise<PresignedDownloadResult> {
    return {
      downloadUrl: `/api/files/download?key=${encodeURIComponent(storageKey)}`,
      expiresInSeconds,
    };
  }
}

let activeStorageProvider: ObjectStorageProvider = process.env.STORAGE_BUCKET_NAME
  ? new S3CompatibleStorageProvider()
  : new LocalStorageProvider();

export function setStorageProvider(provider: ObjectStorageProvider): void {
  activeStorageProvider = provider;
}

export function getStorageProvider(): ObjectStorageProvider {
  return activeStorageProvider;
}
