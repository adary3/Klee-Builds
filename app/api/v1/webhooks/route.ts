import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/v1/webhooks
 * Receives payment webhooks from Paystack / Flutterwave.
 * Architecture placeholder — not active until payments are implemented.
 *
 * AI_HOOK: Future — webhook events can trigger AI reconciliation
 * to auto-match payments to outstanding invoices.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature')
      ?? request.headers.get('x-flw-signature')
      ?? ''

    // TODO: Validate webhook signature before processing
    // const provider = getPaymentProvider()
    // const isValid = provider.validateWebhook(body, signature)
    // if (!isValid) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })

    const payload = JSON.parse(body) as Record<string, unknown>
    const event = payload['event'] as string

    // Log webhook receipt for debugging
    console.log('[webhook] Received event:', event)

    const supabase = await createAdminClient()

    // TODO: Handle charge.success / payment.completed events
    // const provider = getPaymentProvider()
    // const parsed = provider.parseWebhookEvent(payload)
    // if (parsed.event === 'charge.success') { ... mark invoice paid ... }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[webhook] Error:', err)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Paystack and Flutterwave send POST only
export async function GET() {
  return NextResponse.json({ status: 'Kleenah webhook endpoint active' })
}
