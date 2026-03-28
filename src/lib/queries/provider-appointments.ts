import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import type { Row } from "@/types/database";

export type ProviderAppointmentEntry = Row<"appointments"> & {
  patient: Row<"patients"> | null;
  profile: Row<"profiles"> | null;
};

export async function getProviderAppointmentsWorkspace() {
  const auth = await requireRole(["provider"]);
  const supabase = await createClient();
  const { data: provider } = await supabase
    .from("providers")
    .select("*")
    .or(`profile_id.eq.${auth.userId},email.eq.${auth.profile.email}`)
    .single();

  if (!provider) {
    return { auth, provider: null, appointments: [] as ProviderAppointmentEntry[] };
  }

  const { data: appointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("provider_id", provider.id)
    .order("scheduled_at");

  const patientIds = [...new Set((appointments ?? []).map((item) => item.patient_id))];

  const { data: patients } = patientIds.length > 0
    ? await supabase.from("patients").select("*").in("id", patientIds)
    : { data: [] as Row<"patients">[] };

  const profileIds = [...new Set((patients ?? []).map((patient) => patient.profile_id))];

  const { data: profiles } = profileIds.length > 0
    ? await supabase.from("profiles").select("*").in("id", profileIds)
    : { data: [] as Row<"profiles">[] };

  const patientMap = new Map((patients ?? []).map((patient) => [patient.id, patient]));
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return {
    auth,
    provider,
    appointments: (appointments ?? []).map((appointment) => {
      const patient = patientMap.get(appointment.patient_id) ?? null;

      return {
        ...appointment,
        patient,
        profile: patient ? profileMap.get(patient.profile_id) ?? null : null,
      };
    }),
  };
}