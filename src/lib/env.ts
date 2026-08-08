/**
 * Production Environment Configuration & Validation Layer.
 * Validates required secrets on the server-side while preserving zero-secret leaks to client bundles.
 */

export interface AppEnvConfig {
  databaseUrl: string;
  directUrl?: string;
  appUrl: string;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  email: {
    hasResendApiKey: boolean;
    emailFrom: string;
  };
  payments: {
    hasRazorpay: boolean;
    hasStripe: boolean;
    hasWebhookSecret: boolean;
  };
  storage: {
    hasStorageBucket: boolean;
  };
}

export function validateEnv(): AppEnvConfig {
  const isProduction = process.env.NODE_ENV === "production";
  const isDevelopment = process.env.NODE_ENV === "development";
  const isTest = process.env.NODE_ENV === "test";

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl && !isTest) {
    throw new Error(
      "CONFIGURATION ERROR: Missing required environment variable 'DATABASE_URL'."
    );
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (isProduction ? "https://os.indianpixel.com" : "http://localhost:3000");

  const emailFrom = process.env.EMAIL_FROM || "Indian Pixel Studio <noreply@indianpixel.com>";

  return {
    databaseUrl: databaseUrl || "postgresql://mock@localhost:5432/mock",
    directUrl: process.env.DIRECT_URL,
    appUrl,
    isProduction,
    isDevelopment,
    isTest,
    email: {
      hasResendApiKey: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== ""),
      emailFrom,
    },
    payments: {
      hasRazorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
      hasStripe: Boolean(process.env.STRIPE_SECRET_KEY),
      hasWebhookSecret: Boolean(process.env.PAYMENT_WEBHOOK_SECRET),
    },
    storage: {
      hasStorageBucket: Boolean(process.env.STORAGE_BUCKET_NAME),
    },
  };
}
