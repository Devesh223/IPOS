import crypto from "crypto";

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

  constructor(keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_key", keySecret = process.env.RAZORPAY_KEY_SECRET || "rzp_test_secret") {
    this.keyId = keyId;
    this.keySecret = keySecret;
  }

  async createOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResult> {
    const orderId = `order_${Math.random().toString(36).substring(2, 14)}`;
    return {
      orderId,
      provider: "razorpay",
      amountInPaise: params.amountInPaise,
      currency: params.currency,
      checkoutUrl: `https://checkout.razorpay.com/v1/checkout.js?order_id=${orderId}`,
    };
  }

  verifyWebhookSignature(rawBody: string, signature: string, secret: string = this.keySecret): boolean {
    try {
      const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
      return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
    } catch {
      return false;
    }
  }

  async processRefund(params: RefundGatewayParams): Promise<RefundGatewayResult> {
    return {
      refundId: `rfnd_${Math.random().toString(36).substring(2, 14)}`,
      status: "SUCCESS",
    };
  }
}

export class StripeGatewayProvider implements PaymentGatewayProvider {
  private secretKey: string;

  constructor(secretKey = process.env.STRIPE_SECRET_KEY || "sk_test_mock") {
    this.secretKey = secretKey;
  }

  async createOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResult> {
    const orderId = `cs_test_${Math.random().toString(36).substring(2, 14)}`;
    return {
      orderId,
      provider: "stripe",
      amountInPaise: params.amountInPaise,
      currency: params.currency,
      checkoutUrl: `https://checkout.stripe.com/c/pay/${orderId}`,
    };
  }

  verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
    try {
      const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
      return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
    } catch {
      return false;
    }
  }

  async processRefund(params: RefundGatewayParams): Promise<RefundGatewayResult> {
    return {
      refundId: `re_${Math.random().toString(36).substring(2, 14)}`,
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
