"use server";

import { revalidatePath } from "next/cache";
import { appendPortalEvent, getCurrentUserPatient } from "@/lib/actions/activity";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult } from "@/lib/utils";
import { appointmentSchema, type AppointmentInput } from "@/lib/validations/appointment";

export async function createAppointmentAction(payload: AppointmentInput): Promise<ActionResult> {
  const parsed = appointmentSchema.safeParse(payload);
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

  const { error } = await supabase.from("appointments").insert({
    appointment_type: parsed.data.appointmentType,
    duration_minutes: parsed.data.durationMinutes,
    location: parsed.data.location || null,
    notes: parsed.data.notes || null,
    patient_id: patientId,
    provider_id: parsed.data.providerId,
    reason: parsed.data.reason,
    scheduled_at: parsed.data.scheduledAt,
  });

  if (error) {
    return { error: { _form: [error.message] } };
  }

  await appendPortalEvent(supabase, user.id, {
    actionHref: "/appointments",
    detail: `${parsed.data.reason} on ${new Date(parsed.data.scheduledAt).toLocaleString()}.`,
    title: "Appointment scheduled",
    type: "appointment",
  });

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  return { success: true, message: "Appointment scheduled" };
}

export async function cancelAppointmentAction(appointmentId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { patientId, user } = await getCurrentUserPatient(supabase);
  if (!user) {
    return { error: { _form: ["Unauthorized"] } };
  }

  if (!patientId) {
    return { error: { _form: ["Patient record not found"] } };
  }

  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, reason, status")
    .eq("id", appointmentId)
    .eq("patient_id", patientId)
    .single();

  if (!appointment) {
    return { error: { _form: ["Appointment not found"] } };
  }

  if (appointment.status === "cancelled") {
    return { error: { _form: ["Appointment is already cancelled"] } };
  }

  const { error } = await supabase
    .from("appointments")
    .update({ cancelled_at: new Date().toISOString(), status: "cancelled" })
    .eq("id", appointmentId)
    .eq("patient_id", patientId);

  if (error) {
    return { error: { _form: [error.message] } };
  }

  await appendPortalEvent(supabase, user.id, {
    actionHref: "/appointments",
    detail: `${appointment.reason} was cancelled from the patient portal.`,
    title: "Appointment cancelled",
    type: "appointment",
  });

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  return { success: true, message: "Appointment cancelled" };
}
