export type Database = {
  public: {
    Tables: {
      profiles: { Row: { id: string; full_name: string; email: string; phone: string | null; date_of_birth: string | null; gender: string | null; avatar_url: string | null; role: string; is_mfa_enabled: boolean; preferred_lang: string; timezone: string; created_at: string; updated_at: string } };
      patients: { Row: { id: string; profile_id: string; patient_mrn: string; blood_type: string | null; height_cm: number | null; weight_kg: number | null; emergency_contact_name: string | null; emergency_contact_phone: string | null; emergency_contact_rel: string | null; primary_provider_id: string | null; insurance_provider: string | null; insurance_policy_no: string | null; insurance_group_no: string | null; insurance_valid_until: string | null; advance_directive: boolean; organ_donor: boolean; preferred_pharmacy: string | null; created_at: string; updated_at: string } };
      providers: { Row: { id: string; profile_id: string | null; first_name: string; last_name: string; specialty: string; sub_specialty: string | null; organization: string | null; department: string | null; phone: string | null; email: string | null; city: string | null; state: string | null; accepting_patients: boolean; bio: string | null; languages: string[] | null } };
      appointments: { Row: { id: string; appointment_type: string; status: string; scheduled_at: string; duration_minutes: number; reason: string; notes: string | null; location: string | null; meeting_url: string | null; provider_id: string; patient_id: string; cancelled_at?: string | null } };
      conditions: { Row: { id: string; display_name: string; clinical_status: string; severity: string | null; onset_date: string | null; resolved_date: string | null; notes: string | null; provider_id: string | null; icd10_code: string | null; fhir_id: string | null; patient_id: string } };
      allergies: { Row: { id: string; allergen: string; allergen_type: string | null; reaction: string[] | null; severity: string | null; status: string; onset_date: string | null; notes: string | null; patient_id: string } };
      procedures: { Row: { id: string; procedure_name: string; category: string | null; performed_at: string | null; outcome: string | null; notes: string | null; provider_id: string | null; patient_id: string } };
      lab_results: { Row: { id: string; panel_name: string; test_name: string; result_value: number | null; result_text: string | null; unit: string | null; reference_range: string | null; status: string; observed_at: string; abnormal_flag: string | null; provider_id: string | null; fhir_id: string | null; patient_id: string } };
      prescriptions: { Row: { id: string; medication_name: string; dosage: string; frequency: string; route: string | null; status: string; prescribed_on: string; expires_on: string | null; refill_remaining: number; pharmacy_name: string | null; instructions: string | null; last_refill_requested_at: string | null; provider_id: string | null; patient_id: string } };
      conversations: { Row: { id: string; subject: string; category: string; created_by: string | null; created_at: string; updated_at: string } };
      conversation_participants: { Row: { id: string; conversation_id: string; profile_id: string; joined_at: string } };
      messages: { Row: { id: string; conversation_id: string; sender_id: string; body: string; is_read: boolean; created_at: string; updated_at: string } };
      documents: { Row: { id: string; title: string; category: string; storage_path: string | null; mime_type: string | null; file_size: number | null; created_at: string; patient_id: string; uploaded_by: string | null } };
      invoices: { Row: { id: string; invoice_number: string; description: string; amount_cents: number; currency: string; status: string; due_date: string | null; issued_at: string; paid_at: string | null; patient_id: string } };
      payments: { Row: { id: string; invoice_id: string; patient_id: string; amount_cents: number; method: string; status: string; processed_at: string; confirmation_code: string | null } };
      notifications: { Row: { id: string; profile_id: string; title: string; body: string; type: string; action_href: string | null; is_read: boolean; created_at: string } };
      data_consents: { Row: { id: string; profile_id: string; consent_type: string; granted: boolean; granted_at: string | null; revoked_at: string | null; updated_at: string } };
      recent_activities: { Row: { id: string; profile_id: string; title: string; detail: string; occurred_at: string } };
      audit_logs: { Row: { id: string; actor_id: string; patient_id: string | null; action: string; resource_type: string; resource_id: string | null; outcome: string; metadata: Record<string, unknown>; created_at: string } };
    };
    Functions: {
      seed_demo_data_for_current_user: { Args: Record<string, never>; Returns: void };
    };
  };
};

export type TableName = keyof Database["public"]["Tables"];
export type Row<T extends TableName> = Database["public"]["Tables"][T]["Row"];
