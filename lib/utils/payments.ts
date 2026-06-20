/**
 * Payment provider abstraction layer.
 * Architecture only — not implemented in this build.
 *
 * Supports Paystack and Flutterwave, both widely used across Africa.
 * When payments are activated, implement these interfaces for each provider
 * and select the active provider via PAYMENT_PROVIDER env var.
 *
 * AI_HOOK: Future — AI can suggest optimal payment provider based on
 * customer country, invoice currency, and transaction history.
 */

// ─────────────────────────────────────────
// Shared types
// ─────────────────────────────────────────

export interface PaymentInitPayload {
  amount: number // In smallest currency unit (kobo, pesewas, etc.)
  currency: string
  email: string
  reference: string
  callbackUrl: string
  metadata?: Record<string, unknown>
}

export interface PaymentInitResult {
  authorizationUrl: string
  reference: string
  accessCode?: string
}

export interface PaymentVerifyResult {
  reference: string
  status: 'success' | 'failed' | 'pending'
  amount: number
  currency: string
  paidAt?: string
  metadata?: Record<string, unknown>
}

export interface WebhookEvent {
  event: string
  data: Record<string, unknown>
}

// ─────────────────────────────────────────
// Provider interface
// ─────────────────────────────────────────

export interface PaymentProvider {
  name: string
  initializePayment(payload: PaymentInitPayload): Promise<PaymentInitResult>
  verifyPayment(reference: string): Promise<PaymentVerifyResult>
  validateWebhook(payload: string, signature: string): boolean
  parseWebhookEvent(payload: Record<string, unknown>): WebhookEvent
}

// ─────────────────────────────────────────
// Paystack placeholder
// ─────────────────────────────────────────

export class PaystackProvider implements PaymentProvider {
  name = 'paystack'
  private secretKey: string

  constructor(secretKey: string) {
    this.secretKey = secretKey
  }

  async initializePayment(
    _payload: PaymentInitPayload
  ): Promise<PaymentInitResult> {
    // TODO: POST https://api.paystack.co/transaction/initialize
    throw new Error('Paystack not yet implemented')
  }

  async verifyPayment(_reference: string): Promise<PaymentVerifyResult> {
    // TODO: GET https://api.paystack.co/transaction/verify/:reference
    throw new Error('Paystack not yet implemented')
  }

  validateWebhook(_payload: string, _signature: string): boolean {
    // TODO: HMAC SHA512 validation using PAYSTACK_SECRET_KEY
    throw new Error('Paystack not yet implemented')
  }

  parseWebhookEvent(payload: Record<string, unknown>): WebhookEvent {
    return {
      event: payload['event'] as string,
      data: payload['data'] as Record<string, unknown>,
    }
  }
}

// ─────────────────────────────────────────
// Flutterwave placeholder
// ─────────────────────────────────────────

export class FlutterwaveProvider implements PaymentProvider {
  name = 'flutterwave'
  private secretKey: string

  constructor(secretKey: string) {
    this.secretKey = secretKey
  }

  async initializePayment(
    _payload: PaymentInitPayload
  ): Promise<PaymentInitResult> {
    // TODO: POST https://api.flutterwave.com/v3/payments
    throw new Error('Flutterwave not yet implemented')
  }

  async verifyPayment(_reference: string): Promise<PaymentVerifyResult> {
    // TODO: GET https://api.flutterwave.com/v3/transactions/:id/verify
    throw new Error('Flutterwave not yet implemented')
  }

  validateWebhook(_payload: string, _signature: string): boolean {
    // TODO: Compare x-flw-signature header with FLUTTERWAVE_SECRET_KEY
    throw new Error('Flutterwave not yet implemented')
  }

  parseWebhookEvent(payload: Record<string, unknown>): WebhookEvent {
    return {
      event: payload['event'] as string,
      data: payload['data'] as Record<string, unknown>,
    }
  }
}

// ─────────────────────────────────────────
// Factory — swap provider via env var
// ─────────────────────────────────────────

export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER ?? 'paystack'

  if (provider === 'flutterwave') {
    return new FlutterwaveProvider(process.env.FLUTTERWAVE_SECRET_KEY ?? '')
  }

  return new PaystackProvider(process.env.PAYSTACK_SECRET_KEY ?? '')
}
