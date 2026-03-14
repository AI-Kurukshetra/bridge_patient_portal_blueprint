"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult } from "@/lib/utils";
import { appointmentSchema, type AppointmentInput } from "@/lib/validations/appointment";

export async function createAppointmentAction(payload: AppointmentInput): Promise<ActionResult> {
  const parsed = appointmentSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) {
    return { error: { _form: ["Unauthorized"] } };
  }

  const { data: patient } = await supabase.from("patients").select("id").eq("profile_id", user.id).single();
  if (!patient) {
    return { error: { _form: ["Patient record not found"] } };
  }

  const { error } = await supabase.from("appointments").insert({
    patient_id: patient.id,
    provider_id: parsed.data.providerId,
    appointment_type: parsed.data.appointmentType,
    scheduled_at: parsed.data.scheduledAt,
    duration_minutes: parsed.data.durationMinutes,
    reason: parsed.data.reason,
    notes: parsed.data.notes || null,
    location: parsed.data.location || null,
  });

  if (error) {
    return { error: { _form: [error.message] } };
  }

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  return { success: true, message: "Appointment scheduled" };
}

export async function cancelAppointmentAction(appointmentId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", appointmentId);

  if (error) {
    return { error: { _form: [error.message] } };
  }

  revalidatePath("/appointments");
  return { success: true, message: "Appointment cancelled" };
}

