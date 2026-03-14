import { getAuthContext, type AuthContext } from "@/lib/auth/server";
import { canRoleAccessPatientRecord } from "@/lib/auth/patient-access";
import { createClient } from "@/lib/supabase/server";
import { fhirBadRequest, fhirJson, fhirUnauthorized, makeBundle } from "@/lib/fhir/utils";
import type { Row } from "@/types/database";

export type FhirPatientDocument = Row<"documents"> & { signedUrl: string | null };

export type FhirPatientContext = {
  auth: AuthContext;
  patient: Row<"patients">;
  profile: Row<"profiles"> | null;
  careTeam: Row<"providers">[];
  appointments: Row<"appointments">[];
  conditions: Row<"conditions">[];
  allergies: Row<"allergies">[];
  procedures: Row<"procedures">[];
  labResults: Row<"lab_results">[];
  prescriptions: Row<"prescriptions">[];
  documents: FhirPatientDocument[];
  consents: Row<"data_consents">[];
};

export type AccessibleFhirPatient = {
  patient: Row<"patients">;
  profile: Row<"profiles"> | null;
};

async function getViewerProvider(auth: AuthContext) {
  const supabase = await createClient();
  const { data: provider } = await supabase
    .from("providers")
    .select("*")
    .or(`profile_id.eq.${auth.userId},email.eq.${auth.profile.email}`)
    .single();

  return provider ?? null;
}

async function getViewerPatient(auth: AuthContext) {
  const supabase = await createClient();
  const { data: patient } = await supabase.from("patients").select("*").eq("profile_id", auth.userId).single();
  return patient ?? null;
}

async function hasProviderRelationship(providerId: string, patient: Row<"patients">) {
  const supabase = await createClient();
  const [appointmentLinkRes, conditionLinkRes, labLinkRes, procedureLinkRes, prescriptionLinkRes] = await Promise.all([
    supabase.from("appointments").select("id").eq("patient_id", patient.id).eq("provider_id", providerId).limit(1),
    supabase.from("conditions").select("id").eq("patient_id", patient.id).eq("provider_id", providerId).limit(1),
    supabase.from("lab_results").select("id").eq("patient_id", patient.id).eq("provider_id", providerId).limit(1),
    supabase.from("procedures").select("id").eq("patient_id", patient.id).eq("provider_id", providerId).limit(1),
    supabase.from("prescriptions").select("id").eq("patient_id", patient.id).eq("provider_id", providerId).limit(1),
  ]);

  return {
    isPrimaryProvider: patient.primary_provider_id === providerId,
    hasAppointment: (appointmentLinkRes.data?.length ?? 0) > 0,
    hasClinicalRelationship:
      (conditionLinkRes.data?.length ?? 0) > 0 ||
      (labLinkRes.data?.length ?? 0) > 0 ||
      (procedureLinkRes.data?.length ?? 0) > 0 ||
      (prescriptionLinkRes.data?.length ?? 0) > 0,
  };
}

async function buildPatientContext(auth: AuthContext, patient: Row<"patients">): Promise<FhirPatientContext> {
  const supabase = await createClient();

  const [profileRes, appointmentsRes, conditionsRes, allergiesRes, proceduresRes, labsRes, prescriptionsRes, documentsRes, consentsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", patient.profile_id).single(),
    supabase.from("appointments").select("*").eq("patient_id", patient.id).order("scheduled_at"),
    supabase.from("conditions").select("*").eq("patient_id", patient.id).order("onset_date", { ascending: false }),
    supabase.from("allergies").select("*").eq("patient_id", patient.id).order("allergen"),
    supabase.from("procedures").select("*").eq("patient_id", patient.id).order("performed_at", { ascending: false }),
    supabase.from("lab_results").select("*").eq("patient_id", patient.id).order("observed_at", { ascending: false }),
    supabase.from("prescriptions").select("*").eq("patient_id", patient.id).order("prescribed_on", { ascending: false }),
    supabase.from("documents").select("*").eq("patient_id", patient.id).order("created_at", { ascending: false }),
    supabase.from("data_consents").select("*").eq("profile_id", patient.profile_id).order("consent_type"),
  ]);

  const providerIds = [...new Set([
    patient.primary_provider_id,
    ...(appointmentsRes.data ?? []).map((item) => item.provider_id),
    ...(conditionsRes.data ?? []).map((item) => item.provider_id),
    ...(proceduresRes.data ?? []).map((item) => item.provider_id),
    ...(labsRes.data ?? []).map((item) => item.provider_id),
    ...(prescriptionsRes.data ?? []).map((item) => item.provider_id),
  ].filter((value): value is string => Boolean(value)))];

  const { data: careTeam } = providerIds.length > 0
    ? await supabase.from("providers").select("*").in("id", providerIds)
    : { data: [] as Row<"providers">[] };

  const documents = await Promise.all(
    (documentsRes.data ?? []).map(async (document) => {
      if (!document.storage_path) {
        return { ...document, signedUrl: null };
      }

      const { data } = await supabase.storage.from("patient-documents").createSignedUrl(document.storage_path, 3600);
      return {
        ...document,
        signedUrl: data?.signedUrl ?? null,
      };
    }),
  );

  return {
    auth,
    patient,
    profile: profileRes.data ?? null,
    careTeam: careTeam ?? [],
    appointments: appointmentsRes.data ?? [],
    conditions: conditionsRes.data ?? [],
    allergies: allergiesRes.data ?? [],
    procedures: proceduresRes.data ?? [],
    labResults: labsRes.data ?? [],
    prescriptions: prescriptionsRes.data ?? [],
    documents,
    consents: consentsRes.data ?? [],
  };
}

export async function getAccessibleFhirPatients() {
  const auth = await getAuthContext();
  if (!auth) {
    return { status: "unauthorized" as const };
  }

  const supabase = await createClient();

  if (auth.role === "patient") {
    const patient = await getViewerPatient(auth);

    return {
      status: "ok" as const,
      auth,
      patients: patient ? [{ patient, profile: auth.profile }] : [] as AccessibleFhirPatient[],
    };
  }

  if (auth.role === "provider") {
    const provider = await getViewerProvider(auth);

    if (!provider) {
      return { status: "ok" as const, auth, patients: [] as AccessibleFhirPatient[] };
    }

    const [primaryPatientsRes, appointmentsRes] = await Promise.all([
      supabase.from("patients").select("*").eq("primary_provider_id", provider.id),
      supabase.from("appointments").select("*").eq("provider_id", provider.id).order("scheduled_at"),
    ]);

    const patientMap = new Map<string, Row<"patients">>();

    for (const patient of primaryPatientsRes.data ?? []) {
      patientMap.set(patient.id, patient);
    }

    const appointmentPatientIds = [...new Set((appointmentsRes.data ?? []).map((item) => item.patient_id))];
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
      status: "ok" as const,
      auth,
      patients: patients.map((patient) => ({
        patient,
        profile: (profiles ?? []).find((profile) => profile.id === patient.profile_id) ?? null,
      })),
    };
  }

  const { data: patients } = await supabase.from("patients").select("*").order("created_at", { ascending: false });
  const profileIds = (patients ?? []).map((patient) => patient.profile_id);
  const { data: profiles } = profileIds.length > 0
    ? await supabase.from("profiles").select("*").in("id", profileIds)
    : { data: [] as Row<"profiles">[] };

  return {
    status: "ok" as const,
    auth,
    patients: (patients ?? []).map((patient) => ({
      patient,
      profile: (profiles ?? []).find((profile) => profile.id === patient.profile_id) ?? null,
    })),
  };
}

export async function getFhirPatientContextById(patientId: string) {
  const auth = await getAuthContext();
  if (!auth) {
    return { status: "unauthorized" as const };
  }

  const supabase = await createClient();
  const { data: patient } = await supabase.from("patients").select("*").eq("id", patientId).single();

  if (!patient) {
    return { status: "not_found" as const };
  }

  if (auth.role === "patient") {
    if (patient.profile_id !== auth.userId) {
      return { status: "forbidden" as const };
    }
  } else if (auth.role === "provider") {
    const provider = await getViewerProvider(auth);

    if (!provider) {
      return { status: "forbidden" as const };
    }

    const signals = await hasProviderRelationship(provider.id, patient);
    const allowed = canRoleAccessPatientRecord(auth.role, false, signals);

    if (!allowed) {
      return { status: "forbidden" as const };
    }
  }

  return {
    status: "ok" as const,
    context: await buildPatientContext(auth, patient),
  };
}

export async function getFhirPatientContextFromRequest(
  request: Request,
  options: {
    patientSearchParam?: string;
    allowImplicitPatient?: boolean;
    requirePatientForPrivilegedViewer?: boolean;
  } = {},
) {
  const auth = await getAuthContext();
  if (!auth) {
    return { response: fhirUnauthorized() };
  }

  const url = new URL(request.url);
  const patientSearchParam = options.patientSearchParam ?? "patient";
  let patientId = url.searchParams.get(patientSearchParam);

  if (!patientId && auth.role === "patient" && options.allowImplicitPatient !== false) {
    const patient = await getViewerPatient(auth);
    patientId = patient?.id ?? null;
  }

  if (!patientId) {
    if (auth.role !== "patient" && options.requirePatientForPrivilegedViewer !== false) {
      return { response: fhirBadRequest("The patient search parameter is required for provider and admin FHIR requests.") };
    }

    return { response: fhirJson(makeBundle([])) };
  }

  const result = await getFhirPatientContextById(patientId);

  if (result.status === "ok") {
    return {
      url,
      context: result.context,
    };
  }

  if (result.status === "unauthorized") {
    return { response: fhirUnauthorized() };
  }

  if (result.status === "not_found" || result.status === "forbidden") {
    return { response: fhirJson(makeBundle([])) };
  }

  return { response: fhirBadRequest("The requested patient context could not be resolved.") };
}

export async function getViewerProviderRecord() {
  const auth = await getAuthContext();
  if (!auth) {
    return null;
  }

  if (auth.role !== "provider") {
    return null;
  }

  return getViewerProvider(auth);
}