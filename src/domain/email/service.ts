/**
 * Email Dispatcher Abstraction for Indian Pixel OS.
 * Decouples domain logic from concrete email transport (SMTP, Resend, SendGrid, SES).
 */

import { logger } from "@/lib/logger";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface EmailProvider {
  sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

export class ResendEmailProvider implements EmailProvider {
  private apiKey: string;
  private defaultFrom: string;

  constructor(
    apiKey = process.env.RESEND_API_KEY || "",
    defaultFrom = process.env.EMAIL_FROM || "Indian Pixel Studio <noreply@indianpixel.com>"
  ) {
    this.apiKey = apiKey;
    this.defaultFrom = defaultFrom;
  }

  async sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    logger.info("email.send.started", { to: message.to, subject: message.subject });

    if (!this.apiKey) {
      logger.warn("email.send.unconfigured", { message: "RESEND_API_KEY is not set. Email logged locally." });
      return {
        success: true,
        messageId: `dev-unconfigured-${Date.now()}`,
      };
    }

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: message.from || this.defaultFrom,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const sanitizedError = errorData.message || `Resend API returned status ${res.status}`;
        logger.error("email.send.failed", new Error(sanitizedError), { to: message.to });
        return { success: false, error: sanitizedError };
      }

      const data = await res.json();
      logger.info("email.send.succeeded", { to: message.to, messageId: data.id });
      return { success: true, messageId: data.id };
    } catch (err: any) {
      const sanitizedError = err.message || "Failed to communicate with Resend email API";
      logger.error("email.send.failed", err, { to: message.to });
      return { success: false, error: sanitizedError };
    }
  }
}

export class DevelopmentEmailProvider implements EmailProvider {
  async sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId: string }> {
    const messageId = `dev-msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    logger.info("email.send.dev_logged", { to: message.to, subject: message.subject, messageId });
    return { success: true, messageId };
  }
}

// Auto-select Resend if API key is present in environment, otherwise DevelopmentEmailProvider
let activeProvider: EmailProvider = process.env.RESEND_API_KEY
  ? new ResendEmailProvider()
  : new DevelopmentEmailProvider();

export function setEmailProvider(provider: EmailProvider): void {
  activeProvider = provider;
}

export function getEmailProvider(): EmailProvider {
  return activeProvider;
}

export async function sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return activeProvider.sendEmail(message);
}
