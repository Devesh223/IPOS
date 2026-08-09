import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { ResendEmailProvider, DevelopmentEmailProvider, sendEmail } from "../src/domain/email/service";
import { RazorpayGatewayProvider, StripeGatewayProvider } from "../src/domain/finance/gateway";
import {
  validateFileMetadata,
  S3CompatibleStorageProvider,
  LocalStorageProvider,
  MAX_FILE_SIZE_BYTES,
} from "../src/domain/files/service";
import { BusinessRuleError } from "../src/domain/errors";

describe("External Provider: Email Dispatcher (Resend & Development)", () => {
  it("DevelopmentEmailProvider dispatches and returns deterministic messageId without throwing", async () => {
    const devProvider = new DevelopmentEmailProvider();
    const res = await devProvider.sendEmail({
      to: "client@mitti.in",
      subject: "Welcome to Indian Pixel Studio",
      html: "<p>Welcome!</p>",
    });

    expect(res.success).toBe(true);
    expect(res.messageId).toContain("dev-msg-");
  });

  it("ResendEmailProvider falls back gracefully when unconfigured", async () => {
    const resendProvider = new ResendEmailProvider(""); // Empty API key
    const res = await resendProvider.sendEmail({
      to: "client@mitti.in",
      subject: "Invoice Settlement Notice",
      html: "<p>Invoice IP-INV-2026-0001 is ready.</p>",
    });

    expect(res.success).toBe(true);
    expect(res.messageId).toContain("dev-unconfigured-");
  });
});

describe("External Provider: Payment Gateways (Razorpay & Stripe)", () => {
  it("RazorpayGatewayProvider creates valid orders in integer paise and verifies HMAC signatures", async () => {
    const secret = "rzp_test_secret_key_888";
    const provider = new RazorpayGatewayProvider("rzp_test_key_111", secret);

    const order = await provider.createOrder({
      invoiceId: "inv-1",
      invoiceNumber: "IP-INV-2026-0001",
      amountInPaise: 17700000, // ₹1,77,000 (150,000 + 18% GST)
      currency: "INR",
      description: "Milestone 1 Commencement (40%)",
    });

    expect(order.provider).toBe("razorpay");
    expect(order.amountInPaise).toBe(17700000);
    expect(order.checkoutUrl).toContain("checkout.razorpay.com");

    // Cryptographic signature test
    const rawBody = JSON.stringify({ event: "payment.captured", amount: 17700000, invoiceId: "inv-1" });
    const authenticSignature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    const forgedSignature = "0000000000000000000000000000000000000000000000000000000000000000";

    expect(provider.verifyWebhookSignature(rawBody, authenticSignature, secret)).toBe(true);
    expect(provider.verifyWebhookSignature(rawBody, forgedSignature, secret)).toBe(false);
    expect(provider.verifyWebhookSignature("", "", secret)).toBe(false);
  });

  it("StripeGatewayProvider verifies standard and v1 formatted webhook signatures", async () => {
    const secret = "whsec_stripe_test_secret_999";
    const provider = new StripeGatewayProvider("sk_test_mock_123");

    const order = await provider.createOrder({
      invoiceId: "inv-2",
      invoiceNumber: "IP-INV-2026-0002",
      amountInPaise: 11800000,
      currency: "INR",
      description: "Milestone 2 Delivery (40%)",
    });

    expect(order.provider).toBe("stripe");
    expect(order.amountInPaise).toBe(11800000);

    const rawBody = JSON.stringify({ type: "payment_intent.succeeded", id: "pi_123" });
    const authenticHex = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    const stripeHeaderSig = `t=1700000000,v1=${authenticHex}`;

    expect(provider.verifyWebhookSignature(rawBody, authenticHex, secret)).toBe(true);
    expect(provider.verifyWebhookSignature(rawBody, stripeHeaderSig, secret)).toBe(true);
    expect(provider.verifyWebhookSignature(rawBody, "invalid_sig", secret)).toBe(false);
  });
});

describe("External Provider: Object Storage & Asset Governance", () => {
  it("generates presigned upload and download URLs with scoped storage keys", async () => {
    const storage = new S3CompatibleStorageProvider("indian-pixel-prod-assets");
    const storageKey = "ws-101/proj-202/deliverables/file_123_artwork.png";

    const upload = await storage.generatePresignedUploadUrl(storageKey, "image/png", 900);
    expect(upload.uploadUrl).toContain("indian-pixel-prod-assets.storage.indianpixel.com");
    expect(upload.storageKey).toBe(storageKey);
    expect(upload.expiresInSeconds).toBe(900);

    const download = await storage.generatePresignedDownloadUrl(storageKey, 3600);
    expect(download.downloadUrl).toContain("download=true");
    expect(download.expiresInSeconds).toBe(3600);
  });

  it("enforces 50MB ceiling and rejects executable/dangerous files", () => {
    expect(() => validateFileMetadata("malware.exe", "application/x-msdownload", 1024)).toThrowError(BusinessRuleError);
    expect(() => validateFileMetadata("giant_video.mp4", "video/mp4", MAX_FILE_SIZE_BYTES + 1)).toThrowError(BusinessRuleError);
    expect(() => validateFileMetadata("brand_guidelines.pdf", "application/pdf", 10 * 1024 * 1024)).not.toThrow();
  });
});
