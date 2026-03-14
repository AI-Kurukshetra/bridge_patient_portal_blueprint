"use server";

import { revalidatePath } from "next/cache";
import { appendPortalEvent, getCurrentUserPatient } from "@/lib/actions/activity";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult } from "@/lib/utils";
import { claimAppealSchema, type ClaimAppealInput } from "@/lib/validations/insurance";

export async function requestClaimAppealAction(payload: ClaimAppealInput): Promise<ActionResult> {
  const parsed = claimAppealSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { patientId, user } = await getCurrentUserPatient(supabase);

  if (!user) {
    return { error: { _form: ["Unauthorized"] } };
  }

  if (!patientId) {
    return { error: { _form: ["Patient record not found"] } };
  }

  const { data: claim } = await supabase
    .from("insurance_claims")
    .select("id, claim_number, notes, payer_name, service_description, status")
    .eq("id", parsed.data.claimId)
    .eq("patient_id", patientId)
    .single();

  if (!claim) {
    return { error: { _form: ["Insurance claim not found"] } };
  }

  if (claim.status !== "denied") {
    return { error: { _form: ["Only denied claims can be appealed from the portal"] } };
  }

  const timestamp = new Date().toISOString();
  const appealEntry = `[${timestamp}] Appeal requested by patient: ${parsed.data.appealReason}`;
  const nextNotes = claim.notes ? `${claim.notes}\n\n${appealEntry}` : appealEntry;

  const { error } = await supabase
    .from("insurance_claims")
    .update({ notes: nextNotes, status: "appealed", updated_at: timestamp })
    .eq("id", claim.id)
    .eq("patient_id", patientId);

  if (error) {
    return { error: { _form: [error.message] } };
  }

  await appendPortalEvent(supabase, user.id, {
    actionHref: "/insurance",
    detail: `Appeal review requested for claim ${claim.claim_number} with ${claim.payer_name}.`,
    title: "Insurance claim appeal requested",
    type: "insurance",
  });

  revalidatePath("/insurance");
  revalidatePath("/dashboard");
  revalidatePath("/records");
  return { success: true, message: `Appeal submitted for ${claim.service_description}` };
}