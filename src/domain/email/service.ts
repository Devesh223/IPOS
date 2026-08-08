/**
 * Email Dispatcher Abstraction for Indian Pixel OS.
 * Decouples domain logic from concrete email transport (SMTP, Resend, SendGrid, SES).
 */

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailProvider {
  sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

class DevelopmentEmailProvider implements EmailProvider {
  async sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId: string }> {
    const messageId = `dev-msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    if (process.env.NODE_ENV === "development") {
      console.log("==================== [DEV EMAIL DISPATCH] ====================");
      console.log(`To: ${message.to}`);
      console.log(`Subject: ${message.subject}`);
      console.log(`Body:\n${message.text || message.html}`);
      console.log("==============================================================");
    }
    return { success: true, messageId };
  }
}

let activeProvider: EmailProvider = new DevelopmentEmailProvider();

export function setEmailProvider(provider: EmailProvider): void {
  activeProvider = provider;
}

export async function sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return activeProvider.sendEmail(message);
}
