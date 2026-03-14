import { createClient } from "@/lib/supabase/server";
import type { Row } from "@/types/database";

export type ConversationWithMessages = Row<"conversations"> & {
  messages: Row<"messages">[];
};

export type PortalData = {
  profile: Row<"profiles"> | null;
  patient: Row<"patients"> | null;
  providers: Row<"providers">[];
  appointments: Row<"appointments">[];
  conditions: Row<"conditions">[];
  allergies: Row<"allergies">[];
  procedures: Row<"procedures">[];
  labResults: Row<"lab_results">[];
  prescriptions: Row<"prescriptions">[];
  conversations: ConversationWithMessages[];
  documents: Row<"documents">[];
  invoices: Row<"invoices">[];
  payments: Row<"payments">[];
  notifications: Row<"notifications">[];
  consents: Row<"data_consents">[];
  recentActivities: Row<"recent_activities">[];
};

export async function getPortalData(): Promise<PortalData | null> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return null;
  }

  await supabase.rpc("seed_demo_data_for_current_user");

  const [{ data: profile }, { data: patient }, { data: providers }, { data: notifications }, { data: consents }, { data: recentActivities }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("patients").select("*").eq("profile_id", user.id).single(),
    supabase.from("providers").select("*").order("last_name"),
    supabase.from("notifications").select("*").order("created_at", { ascending: false }),
    supabase.from("data_consents").select("*").eq("profile_id", user.id).order("consent_type"),
    supabase.from("recent_activities").select("*").eq("profile_id", user.id).order("occurred_at", { ascending: false }),
  ]);

  if (!patient) {
    return {
      profile: profile ?? null,
      patient: null,
      providers: providers ?? [],
      appointments: [],
      conditions: [],
      allergies: [],
      procedures: [],
      labResults: [],
      prescriptions: [],
      conversations: [],
      documents: [],
      invoices: [],
      payments: [],
      notifications: notifications ?? [],
      consents: consents ?? [],
      recentActivities: recentActivities ?? [],
    };
  }

  const patientId = patient.id;

  const [appointmentsRes, conditionsRes, allergiesRes, proceduresRes, labsRes, prescriptionsRes, documentsRes, invoicesRes, paymentsRes, conversationsRes, messagesRes] = await Promise.all([
    supabase.from("appointments").select("*").eq("patient_id", patientId).order("scheduled_at"),
    supabase.from("conditions").select("*").eq("patient_id", patientId).order("onset_date", { ascending: false }),
    supabase.from("allergies").select("*").eq("patient_id", patientId).order("allergen"),
    supabase.from("procedures").select("*").eq("patient_id", patientId).order("performed_at", { ascending: false }),
    supabase.from("lab_results").select("*").eq("patient_id", patientId).order("observed_at", { ascending: false }),
    supabase.from("prescriptions").select("*").eq("patient_id", patientId).order("prescribed_on", { ascending: false }),
    supabase.from("documents").select("*").eq("patient_id", patientId).order("created_at", { ascending: false }),
    supabase.from("invoices").select("*").eq("patient_id", patientId).order("issued_at", { ascending: false }),
    supabase.from("payments").select("*").eq("patient_id", patientId).order("processed_at", { ascending: false }),
    supabase.from("conversations").select("*").order("updated_at", { ascending: false }),
    supabase.from("messages").select("*").order("created_at"),
  ]);

  const messages = messagesRes.data ?? [];
  const conversations = (conversationsRes.data ?? []).map((conversation) => ({
    ...conversation,
    messages: messages.filter((message) => message.conversation_id === conversation.id),
  }));

  return {
    profile: profile ?? null,
    patient,
    providers: providers ?? [],
    appointments: appointmentsRes.data ?? [],
    conditions: conditionsRes.data ?? [],
    allergies: allergiesRes.data ?? [],
    procedures: proceduresRes.data ?? [],
    labResults: labsRes.data ?? [],
    prescriptions: prescriptionsRes.data ?? [],
    conversations,
    documents: documentsRes.data ?? [],
    invoices: invoicesRes.data ?? [],
    payments: paymentsRes.data ?? [],
    notifications: notifications ?? [],
    consents: consents ?? [],
    recentActivities: recentActivities ?? [],
  };
}

