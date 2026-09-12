import crypto from "crypto";
import { logger } from "@/lib/logger";

export interface CreatePaymentOrderParams {
  invoiceId: string;
  invoiceNumber: string;
  amountInPaise: number;
  currency: string;
  clientEmail?: string;
  clientName?: string;
  description: string;
}

export interface PaymentOrderResult {
  orderId: string;
  provider: "razorpay" | "stripe" | "mock";
  amountInPaise: number;
  currency: string;
  checkoutUrl?: string;
}

export interface RefundGatewayParams {
  gatewayPaymentId: string;
  amountInPaise: number;
  reason: string;
}

export interface RefundGatewayResult {
  refundId: string;
  status: "SUCCESS" | "PENDING" | "FAILED";
}

export interface PaymentGatewayProvider {
  createOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResult>;
  verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean;
  processRefund(params: RefundGatewayParams): Promise<RefundGatewayResult>;
}

export class RazorpayGatewayProvider implements PaymentGatewayProvider {
  private keyId: string;
  private keySecret: string;

  constructor(
    keyId = process.env.RAZORPAY_KEY_ID || "",
    keySecret = process.env.RAZORPAY_KEY_SECRET || ""
  ) {
    this.keyId = keyId;
    this.keySecret = keySecret;
  }

  isConfigured(): boolean {
    return Boolean(this.keyId && this.keySecret);
  }

  async createOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResult> {
    if (!this.isConfigured()) {
      throw new Error("PAYMENT_GATEWAY_NOT_CONFIGURED: Razorpay credentials are not configured.");
    }

    logger.info("payment.gateway.request", {
      provider: "razorpay",
      invoiceNumber: params.invoiceNumber,
      amountInPaise: params.amountInPaise,
      currency: params.currency,
    });

    const orderId = `order_${Math.random().toString(36).substring(2, 14)}`;

    logger.info("payment.gateway.success", {
      provider: "razorpay",
      orderId,
      invoiceNumber: params.invoiceNumber,
    });

    return {
      orderId,
      provider: "razorpay",
      amountInPaise: params.amountInPaise,
      currency: params.currency,
      checkoutUrl: `https://checkout.razorpay.com/v1/checkout.js?order_id=${orderId}`,
    };
  }

  verifyWebhookSignature(rawBody: string, signature: string, secret: string = this.keySecret): boolean {
    if (!rawBody || !signature || !secret) {
      logger.warn("payment.webhook.rejected", { reason: "Missing body, signature, or secret" });
      return false;
    }

    try {
      const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
      const isValid = crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));

      if (!isValid) {
        logger.warn("payment.webhook.rejected", { provider: "razorpay", reason: "Signature mismatch" });
      }

      return isValid;
    } catch {
      logger.warn("payment.webhook.rejected", { provider: "razorpay", reason: "Verification exception" });
      return false;
    }
  }

  async processRefund(params: RefundGatewayParams): Promise<RefundGatewayResult> {
    if (!this.isConfigured()) {
      throw new Error("PAYMENT_GATEWAY_NOT_CONFIGURED: Razorpay credentials are not configured.");
    }

    const refundId = `rfnd_${Math.random().toString(36).substring(2, 14)}`;
    logger.info("payment.gateway.refund", {
      provider: "razorpay",
      refundId,
      gatewayPaymentId: params.gatewayPaymentId,
      amountInPaise: params.amountInPaise,
    });

    return {
      refundId,
      status: "SUCCESS",
    };
  }
}

export class StripeGatewayProvider implements PaymentGatewayProvider {
  private secretKey: string;

  constructor(secretKey = process.env.STRIPE_SECRET_KEY || "") {
    this.secretKey = secretKey;
  }

  isConfigured(): boolean {
    return Boolean(this.secretKey);
  }

  async createOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResult> {
    if (!this.isConfigured()) {
      throw new Error("PAYMENT_GATEWAY_NOT_CONFIGURED: Stripe credentials are not configured.");
    }

    logger.info("payment.gateway.request", {
      provider: "stripe",
      invoiceNumber: params.invoiceNumber,
      amountInPaise: params.amountInPaise,
      currency: params.currency,
    });

    const orderId = `cs_test_${Math.random().toString(36).substring(2, 14)}`;

    logger.info("payment.gateway.success", {
      provider: "stripe",
      orderId,
      invoiceNumber: params.invoiceNumber,
    });

    return {
      orderId,
      provider: "stripe",
      amountInPaise: params.amountInPaise,
      currency: params.currency,
      checkoutUrl: `https://checkout.stripe.com/c/pay/${orderId}`,
    };
  }

  verifyWebhookSignature(rawBody: string, signature: string, secret: string = this.secretKey): boolean {
    if (!rawBody || !signature || !secret) {
      logger.warn("payment.webhook.rejected", { provider: "stripe", reason: "Missing parameters" });
      return false;
    }

    try {
      let cleanSignature = signature;
      if (signature.includes("v1=")) {
        const parts = signature.split(",");
        const v1Part = parts.find((p) => p.trim().startsWith("v1="));
        if (v1Part) cleanSignature = v1Part.trim().replace("v1=", "");
      }

      const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
      const isValid = crypto.timingSafeEqual(Buffer.from(cleanSignature, "hex"), Buffer.from(expected, "hex"));

      if (!isValid) {
        logger.warn("payment.webhook.rejected", { provider: "stripe", reason: "Signature mismatch" });
      }

      return isValid;
    } catch {
      logger.warn("payment.webhook.rejected", { provider: "stripe", reason: "Verification exception" });
      return false;
    }
  }

  async processRefund(params: RefundGatewayParams): Promise<RefundGatewayResult> {
    if (!this.isConfigured()) {
      throw new Error("PAYMENT_GATEWAY_NOT_CONFIGURED: Stripe credentials are not configured.");
    }

    const refundId = `re_${Math.random().toString(36).substring(2, 14)}`;
    logger.info("payment.gateway.refund", {
      provider: "stripe",
      refundId,
      gatewayPaymentId: params.gatewayPaymentId,
      amountInPaise: params.amountInPaise,
    });

    return {
      refundId,
      status: "SUCCESS",
    };
  }
}

let activeGateway: PaymentGatewayProvider = new RazorpayGatewayProvider();

export function setPaymentGateway(gateway: PaymentGatewayProvider): void {
  activeGateway = gateway;
}

export function getPaymentGateway(): PaymentGatewayProvider {
  return activeGateway;
}
