"use server";

import { revalidatePath } from "next/cache";
import { appendPortalEvent, getCurrentUserPatient } from "@/lib/actions/activity";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult } from "@/lib/utils";
import {
  appointmentRescheduleSchema,
  appointmentSchema,
  providerAppointmentStatusSchema,
  type AppointmentInput,
  type AppointmentRescheduleInput,
  type ProviderAppointmentStatusInput,
} from "@/lib/validations/appointment";
import type { Row } from "@/types/database";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

function formatAppointmentMoment(value: string) {
  return new Date(value).toLocaleString();
}

function getProviderDisplayName(provider: Pick<Row<"providers">, "first_name" | "last_name"> | null) {
  if (!provider) {
    return "your care team";
  }

  return `Dr. ${provider.first_name} ${provider.last_name}`;
}

async function getAppointmentProvider(
  supabase: ServerSupabaseClient,
  providerId: string,
) {
  const { data: provider } = await supabase
    .from("providers")
    .select("id, first_name, last_name, profile_id")
    .eq("id", providerId)
    .single();

  return provider;
}

async function getPatientProfileId(supabase: ServerSupabaseClient, patientId: string) {
  const { data: patient } = await supabase
    .from("patients")
    .select("profile_id")
    .eq("id", patientId)
    .single();

  return patient?.profile_id ?? null;
}

async function getCurrentProviderContext(supabase: ServerSupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized", profile: null, provider: null, user: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "provider") {
    return { error: "Unauthorized", profile: profile ?? null, provider: null, user };
  }

  const { data: provider } = await supabase
    .from("providers")
    .select("*")
    .or(`profile_id.eq.${user.id},email.eq.${profile.email}`)
    .single();

  if (!provider) {
    return { error: "Provider record not found", profile, provider: null, user };
  }

  return { error: null, profile, provider, user };
}

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

  const provider = await getAppointmentProvider(supabase, parsed.data.providerId);

  await appendPortalEvent(supabase, user.id, {
    actionHref: "/appointments",
    detail: `${parsed.data.reason} with ${getProviderDisplayName(provider)} on ${formatAppointmentMoment(parsed.data.scheduledAt)}.`,
    title: "Appointment scheduled",
    type: "appointment",
  });

  revalidatePath("/appointments");
  revalidatePath("/appointments/schedule");
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  return { success: true, message: "Appointment scheduled" };
}

export async function rescheduleAppointmentAction(
  appointmentId: string,
  payload: AppointmentRescheduleInput,
): Promise<ActionResult> {
  const parsed = appointmentRescheduleSchema.safeParse(payload);
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

  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, reason, status, provider_id")
    .eq("id", appointmentId)
    .eq("patient_id", patientId)
    .single();

  if (!appointment) {
    return { error: { _form: ["Appointment not found"] } };
  }

  if (appointment.status === "cancelled" || appointment.status === "completed") {
    return { error: { _form: ["This appointment can no longer be rescheduled"] } };
  }

  const { error } = await supabase
    .from("appointments")
    .update({
      cancelled_at: null,
      duration_minutes: parsed.data.durationMinutes,
      location: parsed.data.location || null,
      notes: parsed.data.notes || null,
      scheduled_at: parsed.data.scheduledAt,
      status: "scheduled",
    })
    .eq("id", appointmentId)
    .eq("patient_id", patientId);

  if (error) {
    return { error: { _form: [error.message] } };
  }

  const provider = await getAppointmentProvider(supabase, appointment.provider_id);

  await appendPortalEvent(supabase, user.id, {
    actionHref: `/appointments/${appointmentId}`,
    detail: `${appointment.reason} with ${getProviderDisplayName(provider)} was moved to ${formatAppointmentMoment(parsed.data.scheduledAt)}.`,
    title: "Appointment rescheduled",
    type: "appointment",
  });

  revalidatePath("/appointments");
  revalidatePath(`/appointments/${appointmentId}`);
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  return { success: true, message: "Appointment rescheduled" };
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
    .select("id, reason, status, provider_id")
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

  const provider = await getAppointmentProvider(supabase, appointment.provider_id);

  await appendPortalEvent(supabase, user.id, {
    actionHref: "/appointments",
    detail: `${appointment.reason} with ${getProviderDisplayName(provider)} was cancelled from the patient portal.`,
    title: "Appointment cancelled",
    type: "appointment",
  });

  revalidatePath("/appointments");
  revalidatePath(`/appointments/${appointmentId}`);
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  return { success: true, message: "Appointment cancelled" };
}

export async function updateProviderAppointmentStatusAction(
  appointmentId: string,
  payload: ProviderAppointmentStatusInput,
): Promise<ActionResult> {
  const parsed = providerAppointmentStatusSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error: providerError, provider } = await getCurrentProviderContext(supabase);

  if (providerError || !provider) {
    return { error: { _form: [providerError ?? "Unauthorized"] } };
  }

  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, patient_id, provider_id, reason, scheduled_at, status")
    .eq("id", appointmentId)
    .eq("provider_id", provider.id)
    .single();

  if (!appointment) {
    return { error: { _form: ["Appointment not found"] } };
  }

  if (appointment.status === parsed.data.status) {
    return { success: true, message: `Appointment already marked ${parsed.data.status}` };
  }

  if (
    (appointment.status === "completed" || appointment.status === "cancelled") &&
    appointment.status !== parsed.data.status
  ) {
    return { error: { _form: ["Terminal appointment statuses cannot be changed"] } };
  }

  const updatePayload = {
    cancelled_at: parsed.data.status === "cancelled" ? new Date().toISOString() : null,
    status: parsed.data.status,
  };

  const { error } = await supabase
    .from("appointments")
    .update(updatePayload)
    .eq("id", appointmentId)
    .eq("provider_id", provider.id);

  if (error) {
    return { error: { _form: [error.message] } };
  }

  const patientProfileId = await getPatientProfileId(supabase, appointment.patient_id);
  if (patientProfileId) {
    const providerName = getProviderDisplayName(provider);
    const titleByStatus: Record<ProviderAppointmentStatusInput["status"], string> = {
      cancelled: "Appointment cancelled by care team",
      completed: "Appointment completed",
      confirmed: "Appointment confirmed",
    };
    const detailByStatus: Record<ProviderAppointmentStatusInput["status"], string> = {
      cancelled: `${providerName} cancelled your ${appointment.reason.toLowerCase()} appointment scheduled for ${formatAppointmentMoment(appointment.scheduled_at)}.`,
      completed: `${providerName} marked your ${appointment.reason.toLowerCase()} appointment as completed.`,
      confirmed: `${providerName} confirmed your appointment for ${formatAppointmentMoment(appointment.scheduled_at)}.`,
    };

    await appendPortalEvent(supabase, patientProfileId, {
      actionHref: `/appointments/${appointmentId}`,
      detail: detailByStatus[parsed.data.status],
      title: titleByStatus[parsed.data.status],
      type: "appointment",
    });
  }

  revalidatePath("/care-team");
  revalidatePath("/care-team/appointments");
  revalidatePath("/care-team/patients");
  revalidatePath("/appointments");
  revalidatePath(`/appointments/${appointmentId}`);
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  return { success: true, message: `Appointment ${parsed.data.status}` };
}