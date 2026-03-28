"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult } from "@/lib/utils";
import { profileSchema, type ProfileInput } from "@/lib/validations/profile";

export async function updateProfileAction(payload: ProfileInput): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return { error: { _form: ["Unauthorized"] } };
  }

  const profileUpdate = {
    full_name: parsed.data.fullName,
    phone: parsed.data.phone || null,
    date_of_birth: parsed.data.dateOfBirth || null,
    gender: parsed.data.gender ?? null,
    preferred_lang: parsed.data.preferredLang,
    timezone: parsed.data.timezone,
  };

  const patientUpdate = {
    blood_type: parsed.data.bloodType ?? null,
    height_cm: parsed.data.heightCm ?? null,
    weight_kg: parsed.data.weightKg ?? null,
    emergency_contact_name: parsed.data.emergencyContactName || null,
    emergency_contact_phone: parsed.data.emergencyContactPhone || null,
    emergency_contact_rel: parsed.data.emergencyContactRel || null,
    preferred_pharmacy: parsed.data.preferredPharmacy || null,
    insurance_provider: parsed.data.insuranceProvider || null,
    insurance_policy_no: parsed.data.insurancePolicyNo || null,
    insurance_group_no: parsed.data.insuranceGroupNo || null,
    insurance_valid_until: parsed.data.insuranceValidUntil || null,
    advance_directive: parsed.data.advanceDirective,
    organ_donor: parsed.data.organDonor,
  };

  const [{ error: profileError }, { error: patientError }] = await Promise.all([
    supabase.from("profiles").update(profileUpdate).eq("id", user.id),
    supabase.from("patients").update(patientUpdate).eq("profile_id", user.id),
  ]);

  if (profileError || patientError) {
    return { error: { _form: [profileError?.message ?? patientError?.message ?? "Unable to save profile"] } };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true, message: "Profile updated" };
}

export async function syncMfaStatusAction(isEnabled: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return { error: { _form: ["Unauthorized"] } };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_mfa_enabled: isEnabled })
    .eq("id", user.id);

  if (error) {
    return { error: { _form: [error.message] } };
  }

  revalidatePath("/profile");
  revalidatePath("/mfa");
  return { success: true };
}
