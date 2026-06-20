// Supabase Edge Function: send-invite
// Sends a team invitation email via Resend and creates the invitation record.
// Deploy: supabase functions deploy send-invite

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvitePayload {
  email: string
  role: string
  company_id: string
  invited_by: string
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

    const payload: InvitePayload = await req.json()
    const { email, role, company_id, invited_by } = payload

    // Create the invitation record
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert({ email, role, company_id, invited_by })
      .select()
      .single()

    if (inviteError) throw inviteError

    // Fetch company name for the email
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', company_id)
      .single()

    const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') ?? 'https://app.kleenah.com'
    const inviteUrl = `${appUrl}/en/invite?token=${invitation.token}`

    // Send email via Resend
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: Deno.env.get('RESEND_FROM_EMAIL') ?? 'noreply@kleenah.com',
        to: email,
        subject: `You've been invited to join ${company?.name ?? 'a company'} on Kleenah`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563EB;">You have been invited</h2>
            <p>You have been invited to join <strong>${company?.name}</strong> on Kleenah as a <strong>${role}</strong>.</p>
            <p>Click the button below to accept the invitation. This link expires in 7 days.</p>
            <a href="${inviteUrl}"
               style="display: inline-block; background: #2563EB; color: white;
                      padding: 12px 24px; border-radius: 6px; text-decoration: none;
                      font-weight: 600; margin: 16px 0;">
              Accept Invitation
            </a>
            <p style="color: #6B7280; font-size: 14px;">
              Or copy this link: <a href="${inviteUrl}">${inviteUrl}</a>
            </p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
            <p style="color: #9CA3AF; font-size: 12px;">
              Kleenah — Built for African business.
            </p>
          </div>
        `,
      }),
    })

    if (!resendRes.ok) {
      const resendError = await resendRes.text()
      throw new Error(`Resend error: ${resendError}`)
    }

    return new Response(
      JSON.stringify({ success: true, invitation_id: invitation.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[send-invite]', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
