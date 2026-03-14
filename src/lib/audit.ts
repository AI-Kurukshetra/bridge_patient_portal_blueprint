import { createClient } from "@/lib/supabase/server";

type AuditInput = {
  action: string;
  metadata?: Record<string, unknown>;
  outcome?: "success" | "failure" | "denied";
  patientId?: string | null;
  resourceId?: string;
  resourceType: string;
};

export async function logAudit({
  action,
  metadata = {},
  outcome = "success",
  patientId = null,
  resourceId,
  resourceType,
}: AuditInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await supabase.from("audit_logs").insert({
    action,
    actor_id: user.id,
    metadata,
    outcome,
    patient_id: patientId,
    resource_id: resourceId ?? null,
    resource_type: resourceType,
  });
}
