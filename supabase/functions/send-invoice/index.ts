// Supabase Edge Function: send-invoice
// Sends an invoice email to the customer via Resend.
// Deploy: supabase functions deploy send-invoice

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendInvoicePayload {
  invoice_id: string
  company_id: string
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const payload: SendInvoicePayload = await req.json()
    const { invoice_id, company_id } = payload

    // Fetch invoice with customer and company details
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select('*, customer:customers(*), items:invoice_items(*)')
      .eq('id', invoice_id)
      .single()

    if (invError || !invoice) throw new Error('Invoice not found')

    const { data: company } = await supabase
      .from('companies')
      .select('name, currency')
      .eq('id', company_id)
      .single()

    const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') ?? 'https://app.kleenah.com'
    const invoiceUrl = `${appUrl}/en/finance/invoices/${invoice_id}`

    // Build line items HTML table
    const itemRows = invoice.items
      .map(
        (item: { description: string; quantity: number; unit_price: number; amount: number }) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #E5E7EB;">${item.description}</td>
          <td style="padding: 8px; border-bottom: 1px solid #E5E7EB; text-align: right;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #E5E7EB; text-align: right;">${invoice.currency} ${item.unit_price.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #E5E7EB; text-align: right;">${invoice.currency} ${item.amount.toFixed(2)}</td>
        </tr>
      `
      )
      .join('')

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: Deno.env.get('RESEND_FROM_EMAIL') ?? 'noreply@kleenah.com',
        to: invoice.customer.email,
        subject: `Invoice ${invoice.number} from ${company?.name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto; color: #111827;">
            <h2 style="color: #2563EB;">Invoice ${invoice.number}</h2>
            <p>Dear ${invoice.customer.name},</p>
            <p>Please find your invoice from <strong>${company?.name}</strong> below.</p>

            <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
              <thead>
                <tr style="background: #F9FAFB;">
                  <th style="padding: 8px; text-align: left; border-bottom: 2px solid #E5E7EB;">Description</th>
                  <th style="padding: 8px; text-align: right; border-bottom: 2px solid #E5E7EB;">Qty</th>
                  <th style="padding: 8px; text-align: right; border-bottom: 2px solid #E5E7EB;">Unit Price</th>
                  <th style="padding: 8px; text-align: right; border-bottom: 2px solid #E5E7EB;">Amount</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding: 8px; text-align: right; font-weight: 600;">Subtotal</td>
                  <td style="padding: 8px; text-align: right;">${invoice.currency} ${invoice.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="3" style="padding: 8px; text-align: right; font-weight: 600;">Tax</td>
                  <td style="padding: 8px; text-align: right;">${invoice.currency} ${invoice.tax_amount.toFixed(2)}</td>
                </tr>
                <tr style="background: #EFF6FF;">
                  <td colspan="3" style="padding: 12px 8px; text-align: right; font-weight: 700; font-size: 16px;">Total</td>
                  <td style="padding: 12px 8px; text-align: right; font-weight: 700; font-size: 16px; color: #2563EB;">${invoice.currency} ${invoice.total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>

            <p><strong>Due date:</strong> ${invoice.due_date}</p>
            ${invoice.notes ? `<p><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
            ${invoice.terms ? `<p><strong>Terms:</strong> ${invoice.terms}</p>` : ''}

            <a href="${invoiceUrl}"
               style="display: inline-block; background: #2563EB; color: white;
                      padding: 12px 24px; border-radius: 6px; text-decoration: none;
                      font-weight: 600; margin: 16px 0;">
              View Invoice Online
            </a>

            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
            <p style="color: #9CA3AF; font-size: 12px;">
              Sent via Kleenah — Built for African business.
            </p>
          </div>
        `,
      }),
    })

    if (!resendRes.ok) {
      throw new Error(`Resend error: ${await resendRes.text()}`)
    }

    // Mark invoice as sent
    await supabase
      .from('invoices')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', invoice_id)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[send-invoice]', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
