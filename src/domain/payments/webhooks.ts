import crypto from "crypto";

export interface PaymentWebhookPayload {
  eventId: string;
  provider: "razorpay" | "stripe";
  invoiceId: string;
  amountInPaise: number;
  currency: string;
  referenceNumber: string;
  timestamp: string;
  signature: string;
}

const processedEventIds = new Set<string>();

/**
 * Validates HMAC SHA256 webhook signatures against provider secrets.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Checks if a webhook event ID has already been processed to guarantee idempotency.
 */
export function isWebhookIdempotent(eventId: string): boolean {
  if (processedEventIds.has(eventId)) {
    return false; // Duplicate / Already processed
  }
  processedEventIds.add(eventId);
  return true; // First time processing
}

/**
 * Clears idempotency cache (used for test setup/teardown).
 */
export function resetWebhookIdempotencyCache(): void {
  processedEventIds.clear();
}
