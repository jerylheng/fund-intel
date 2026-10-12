import type { SupabaseClient } from "@supabase/supabase-js";

/** Write metadata-only audit events. Never include client names, policy numbers or financial values. */
export async function recordAudit(
  supabase: SupabaseClient,
  adviserId: string,
  action: "create" | "update" | "delete" | "review",
  entityType: "client" | "goal" | "policy" | "review" | "asset" | "dependant" | "scenario",
  entityId: string | null,
  clientId: string | null,
  changedFields: string[] = [],
) {
  try {
    await supabase.from("adviser_audit_events").insert({
      adviser_id: adviserId,
      client_id: clientId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      changed_fields: changedFields.slice(0, 50),
    });
  } catch {
    // A transient audit insert failure must not corrupt the primary transaction.
    // Monitor audit availability before production rollout.
  }
}
