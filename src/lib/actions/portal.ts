"use server";

import { revalidatePath } from "next/cache";
import { appendPortalEvent, getCurrentUserPatient } from "@/lib/actions/activity";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult } from "@/lib/utils";
import { consentSchema, type ConsentInput } from "@/lib/validations/consent";

export async function updateConsentAction(payload: ConsentInput): Promise<ActionResult> {
  const parsed = consentSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { user } = await getCurrentUserPatient(supabase);
  if (!user) {
    return { error: { _form: ["Unauthorized"] } };
  }

  const { error } = await supabase
    .from("data_consents")
    .update({
      granted: parsed.data.granted,
      granted_at: parsed.data.granted ? new Date().toISOString() : null,
      revoked_at: parsed.data.granted ? null : new Date().toISOString(),
    })
    .eq("profile_id", user.id)
    .eq("consent_type", parsed.data.consentType);

  if (error) {
    return { error: { _form: [error.message] } };
  }

  await appendPortalEvent(supabase, user.id, {
    actionHref: "/consents",
    detail: `${parsed.data.consentType.replaceAll("_", " ")} consent was ${parsed.data.granted ? "granted" : "revoked"}.`,
    notify: false,
    title: "Consent preferences updated",
    type: "consent",
  });

  revalidatePath("/consents");
  revalidatePath("/dashboard");
  return { success: true, message: "Consent updated" };
}

export async function requestRefillAction(prescriptionId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { patientId, user } = await getCurrentUserPatient(supabase);
  if (!user) {
    return { error: { _form: ["Unauthorized"] } };
  }

  if (!patientId) {
    return { error: { _form: ["Patient record not found"] } };
  }

  const { data: prescription } = await supabase
    .from("prescriptions")
    .select("id, medication_name, refill_remaining, status, last_refill_requested_at")
    .eq("id", prescriptionId)
    .eq("patient_id", patientId)
    .single();

  if (!prescription) {
    return { error: { _form: ["Prescription not found"] } };
  }

  if (prescription.status !== "active") {
    return { error: { _form: ["Only active prescriptions can be refilled"] } };
  }

  if (prescription.refill_remaining <= 0) {
    return { error: { _form: ["No refills remain on this prescription"] } };
  }

  const { error } = await supabase
    .from("prescriptions")
    .update({ last_refill_requested_at: new Date().toISOString() })
    .eq("id", prescriptionId)
    .eq("patient_id", patientId);

  if (error) {
    return { error: { _form: [error.message] } };
  }

  await appendPortalEvent(supabase, user.id, {
    actionHref: "/prescriptions",
    detail: `A refill request was sent for ${prescription.medication_name}.`,
    title: "Prescription refill requested",
    type: "prescription",
  });

  revalidatePath("/prescriptions");
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  return { success: true, message: "Refill request submitted" };
}

export async function payInvoiceAction(invoiceId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { patientId, user } = await getCurrentUserPatient(supabase);
  if (!user) {
    return { error: { _form: ["Unauthorized"] } };
  }

  if (!patientId) {
    return { error: { _form: ["Patient record not found"] } };
  }

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, amount_cents, currency, description, status")
    .eq("id", invoiceId)
    .eq("patient_id", patientId)
    .single();

  if (!invoice) {
    return { error: { _form: ["Invoice not found"] } };
  }

  if (invoice.status !== "open") {
    return { error: { _form: ["This invoice is already settled"] } };
  }

  const confirmationCode = `PMT-${Date.now()}`;
  const { error: paymentError } = await supabase.from("payments").insert({
    amount_cents: invoice.amount_cents,
    confirmation_code: confirmationCode,
    invoice_id: invoice.id,
    method: "card",
    patient_id: patientId,
    status: "completed",
  });

  const { error: invoiceError } = await supabase
    .from("invoices")
    .update({ paid_at: new Date().toISOString(), status: "paid" })
    .eq("id", invoice.id)
    .eq("patient_id", patientId);

  if (paymentError || invoiceError) {
    return { error: { _form: [paymentError?.message ?? invoiceError?.message ?? "Unable to process payment"] } };
  }

  await appendPortalEvent(supabase, user.id, {
    actionHref: "/billing",
    detail: `${invoice.description} was paid in full. Confirmation ${confirmationCode}.`,
    title: "Invoice payment recorded",
    type: "billing",
  });

  revalidatePath("/billing");
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  return { success: true, message: "Payment recorded" };
}

export async function markNotificationReadAction(notificationId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { user } = await getCurrentUserPatient(supabase);
  if (!user) {
    return { error: { _form: ["Unauthorized"] } };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("profile_id", user.id);

  if (error) {
    return { error: { _form: [error.message] } };
  }

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const { user } = await getCurrentUserPatient(supabase);
  if (!user) {
    return { error: { _form: ["Unauthorized"] } };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("profile_id", user.id)
    .eq("is_read", false);

  if (error) {
    return { error: { _form: [error.message] } };
  }

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  return { success: true, message: "All notifications marked as read" };
}
