import { createClient } from '@/lib/supabase/client'

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'send'
  | 'pay'
  | 'invite'
  | 'login'
  | 'logout'

interface AuditPayload {
  companyId: string
  entity: string
  entityId?: string
  action: AuditAction
  before?: Record<string, unknown>
  after?: Record<string, unknown>
}

/**
 * Write an entry to the audit_logs table.
 * Call this after any significant mutation.
 * Failures are swallowed — audit logging must never break the main flow.
 */
export async function writeAuditLog(payload: AuditPayload): Promise<void> {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase.from('audit_logs').insert({
      company_id: payload.companyId,
      user_id: user?.id,
      entity: payload.entity,
      entity_id: payload.entityId,
      action: payload.action,
      before: payload.before ?? null,
      after: payload.after ?? null,
    })
  } catch (err) {
    // Audit log failures must never surface to the user
    console.warn('[AuditLog] Failed to write audit entry:', err)
  }
}
