"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult } from "@/lib/utils";
import { consentSchema, type ConsentInput } from "@/lib/validations/consent";

export async function updateConsentAction(payload: ConsentInput): Promise<ActionResult> {
  const parsed = consentSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) {
    return { error: { _form: ["Unauthorized"] } };
  }

  const { error } = await supabase.from("data_consents").update({
    granted: parsed.data.granted,
    granted_at: parsed.data.granted ? new Date().toISOString() : null,
    revoked_at: parsed.data.granted ? null : new Date().toISOString(),
  }).eq("profile_id", user.id).eq("consent_type", parsed.data.consentType);

  if (error) {
    return { error: { _form: [error.message] } };
  }

  revalidatePath("/consents");
  return { success: true, message: "Consent updated" };
}

export async function requestRefillAction(prescriptionId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("prescriptions").update({
    last_refill_requested_at: new Date().toISOString(),
  }).eq("id", prescriptionId);

  if (error) {
    return { error: { _form: [error.message] } };
  }

  revalidatePath("/prescriptions");
  return { success: true, message: "Refill request submitted" };
}

export async function payInvoiceAction(invoiceId: string, patientId: string, amountCents: number): Promise<ActionResult> {
  const supabase = await createClient();

  const { error: paymentError } = await supabase.from("payments").insert({
    invoice_id: invoiceId,
    patient_id: patientId,
    amount_cents: amountCents,
    method: "card",
    status: "completed",
    confirmation_code: `PMT-${Date.now()}`,
  });

  const { error: invoiceError } = await supabase.from("invoices").update({
    status: "paid",
    paid_at: new Date().toISOString(),
  }).eq("id", invoiceId);

  if (paymentError || invoiceError) {
    return { error: { _form: [paymentError?.message ?? invoiceError?.message ?? "Unable to process payment"] } };
  }

  revalidatePath("/billing");
  revalidatePath("/dashboard");
  return { success: true, message: "Payment recorded" };
}

export async function markNotificationReadAction(notificationId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId);

  if (error) {
    return { error: { _form: [error.message] } };
  }

  revalidatePath("/notifications");
  return { success: true };
}

