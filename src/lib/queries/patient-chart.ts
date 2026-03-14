import { redirect } from "next/navigation";
import { canRoleAccessPatientRecord } from "@/lib/auth/patient-access";
import { getDefaultRouteForRole } from "@/lib/auth/roles";
import { getAuthContext, requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/auth/roles";
import type { Row } from "@/types/database";

export type PatientChartData = {
  viewerRole: AppRole;
  viewerProfile: Row<"profiles">;
  patient: Row<"patients">;
  patientProfile: Row<"profiles"> | null;
  primaryProvider: Row<"providers"> | null;
  careTeam: Row<"providers">[];
  appointments: Row<"appointments">[];
  conditions: Row<"conditions">[];
  allergies: Row<"allergies">[];
  procedures: Row<"procedures">[];
  labResults: Row<"lab_results">[];
  prescriptions: Row<"prescriptions">[];
  documents: Row<"documents">[];
};

export type ProviderPatientDirectoryEntry = {
  patient: Row<"patients">;
  profile: Row<"profiles"> | null;
  nextAppointment: Row<"appointments"> | null;
  lastAppointment: Row<"appointments"> | null;
};

async function getProviderForCurrentUser() {
  const auth = await requireRole(["provider"]);
  const supabase = await createClient();
  const { data: provider } = await supabase
    .from("providers")
    .select("*")
    .or(`profile_id.eq.${auth.userId},email.eq.${auth.profile.email}`)
    .single();

  return { auth, provider, supabase };
}

export async function getProviderPatientDirectory() {
  const { auth, provider, supabase } = await getProviderForCurrentUser();

  if (!provider) {
    return { auth, provider: null, patients: [] as ProviderPatientDirectoryEntry[] };
  }

  const [primaryPatientsRes, appointmentsRes] = await Promise.all([
    supabase.from("patients").select("*").eq("primary_provider_id", provider.id),
    supabase.from("appointments").select("*").eq("provider_id", provider.id).order("scheduled_at"),
  ]);

  const patientMap = new Map<string, Row<"patients">>();

  for (const patient of primaryPatientsRes.data ?? []) {
    patientMap.set(patient.id, patient);
  }

  const appointments = appointmentsRes.data ?? [];
  const appointmentPatientIds = [...new Set(appointments.map((item) => item.patient_id))];

  if (appointmentPatientIds.length > 0) {
    const { data: appointmentPatients } = await supabase.from("patients").select("*").in("id", appointmentPatientIds);

    for (const patient of appointmentPatients ?? []) {
      patientMap.set(patient.id, patient);
    }
  }

  const patients = [...patientMap.values()];
  const profileIds = patients.map((patient) => patient.profile_id);
  const { data: profiles } = profileIds.length > 0
    ? await supabase.from("profiles").select("*").in("id", profileIds)
    : { data: [] as Row<"profiles">[] };

  return {
    auth,
    provider,
    patients: patients.map((patient) => {
      const patientAppointments = appointments.filter((item) => item.patient_id === patient.id);
      const nextAppointment = patientAppointments.find((item) => new Date(item.scheduled_at) >= new Date()) ?? null;
      const lastAppointment = [...patientAppointments].reverse().find((item) => new Date(item.scheduled_at) < new Date()) ?? null;

      return {
        patient,
        profile: (profiles ?? []).find((profile) => profile.id === patient.profile_id) ?? null,
        nextAppointment,
        lastAppointment,
      };
    }),
  };
}

export async function getCurrentPatientChart() {
  const auth = await requireRole(["patient"]);
  const supabase = await createClient();
  const { data: patient } = await supabase.from("patients").select("*").eq("profile_id", auth.userId).single();

  if (!patient) {
    return null;
  }

  return getAuthorizedPatientChart(patient.id);
}

export async function getAuthorizedPatientChart(patientId: string): Promise<PatientChartData | null> {
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: patient } = await supabase.from("patients").select("*").eq("id", patientId).single();

  if (!patient) {
    return null;
  }

  let providerId: string | null = null;

  if (auth.role === "provider") {
    const { data: provider } = await supabase
      .from("providers")
      .select("*")
      .or(`profile_id.eq.${auth.userId},email.eq.${auth.profile.email}`)
      .single();

    if (!provider) {
      redirect("/care-team");
    }

    const resolvedProvider = provider;
    providerId = resolvedProvider.id;

    const [appointmentLinkRes, conditionLinkRes, labLinkRes, procedureLinkRes, prescriptionLinkRes] = await Promise.all([
      supabase.from("appointments").select("id").eq("patient_id", patient.id).eq("provider_id", resolvedProvider.id).limit(1),
      supabase.from("conditions").select("id").eq("patient_id", patient.id).eq("provider_id", resolvedProvider.id).limit(1),
      supabase.from("lab_results").select("id").eq("patient_id", patient.id).eq("provider_id", resolvedProvider.id).limit(1),
      supabase.from("procedures").select("id").eq("patient_id", patient.id).eq("provider_id", resolvedProvider.id).limit(1),
      supabase.from("prescriptions").select("id").eq("patient_id", patient.id).eq("provider_id", resolvedProvider.id).limit(1),
    ]);

    const canAccess = canRoleAccessPatientRecord(auth.role, false, {
      isPrimaryProvider: patient.primary_provider_id === resolvedProvider.id,
      hasAppointment: (appointmentLinkRes.data?.length ?? 0) > 0,
      hasClinicalRelationship:
        (conditionLinkRes.data?.length ?? 0) > 0 ||
        (labLinkRes.data?.length ?? 0) > 0 ||
        (procedureLinkRes.data?.length ?? 0) > 0 ||
        (prescriptionLinkRes.data?.length ?? 0) > 0,
    });

    if (!canAccess) {
      redirect("/care-team");
    }
  } else {
    const canAccess = canRoleAccessPatientRecord(auth.role, patient.profile_id === auth.userId);

    if (!canAccess) {
      redirect(getDefaultRouteForRole(auth.role));
    }
  }

  const [patientProfileRes, appointmentsRes, conditionsRes, allergiesRes, proceduresRes, labsRes, prescriptionsRes, documentsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", patient.profile_id).single(),
    supabase.from("appointments").select("*").eq("patient_id", patient.id).order("scheduled_at"),
    supabase.from("conditions").select("*").eq("patient_id", patient.id).order("onset_date", { ascending: false }),
    supabase.from("allergies").select("*").eq("patient_id", patient.id).order("allergen"),
    supabase.from("procedures").select("*").eq("patient_id", patient.id).order("performed_at", { ascending: false }),
    supabase.from("lab_results").select("*").eq("patient_id", patient.id).order("observed_at", { ascending: false }),
    supabase.from("prescriptions").select("*").eq("patient_id", patient.id).order("prescribed_on", { ascending: false }),
    supabase.from("documents").select("*").eq("patient_id", patient.id).order("created_at", { ascending: false }),
  ]);

  const providerIds = [...new Set([
    patient.primary_provider_id,
    providerId,
    ...(appointmentsRes.data ?? []).map((item) => item.provider_id),
    ...(conditionsRes.data ?? []).map((item) => item.provider_id),
    ...(proceduresRes.data ?? []).map((item) => item.provider_id),
    ...(labsRes.data ?? []).map((item) => item.provider_id),
    ...(prescriptionsRes.data ?? []).map((item) => item.provider_id),
  ].filter((value): value is string => Boolean(value)))];

  const { data: careTeam } = providerIds.length > 0
    ? await supabase.from("providers").select("*").in("id", providerIds)
    : { data: [] as Row<"providers">[] };

  return {
    viewerRole: auth.role,
    viewerProfile: auth.profile,
    patient,
    patientProfile: patientProfileRes.data ?? null,
    primaryProvider: (careTeam ?? []).find((item) => item.id === patient.primary_provider_id) ?? null,
    careTeam: careTeam ?? [],
    appointments: appointmentsRes.data ?? [],
    conditions: conditionsRes.data ?? [],
    allergies: allergiesRes.data ?? [],
    procedures: proceduresRes.data ?? [],
    labResults: labsRes.data ?? [],
    prescriptions: prescriptionsRes.data ?? [],
    documents: documentsRes.data ?? [],
  };
}