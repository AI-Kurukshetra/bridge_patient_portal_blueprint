import { MfaEnrollmentCard } from "@/components/auth/mfa-enrollment-card";
import { ProfileForm } from "@/components/forms/profile-form";
import { SectionCard } from "@/components/ui/primitives";
import { getPortalData } from "@/lib/queries/portal";

export default async function ProfilePage() {
  const data = await getPortalData();
  if (!data || !data.profile || !data.patient) return null;

  return (
    <div className="grid gap-6">
      <SectionCard title="Patient profile" description="Demographics, emergency contacts, insurance, preferences, and security settings.">
        <ProfileForm
          initialValues={{
            fullName: data.profile.full_name,
            phone: data.profile.phone ?? "",
            dateOfBirth: data.profile.date_of_birth ?? "",
            gender: (data.profile.gender as "male" | "female" | "other" | "prefer_not_to_say" | undefined) ?? undefined,
            bloodType: (data.patient.blood_type as "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | undefined) ?? undefined,
            heightCm: data.patient.height_cm ?? undefined,
            weightKg: data.patient.weight_kg ?? undefined,
            emergencyContactName: data.patient.emergency_contact_name ?? "",
            emergencyContactPhone: data.patient.emergency_contact_phone ?? "",
            emergencyContactRel: data.patient.emergency_contact_rel ?? "",
            preferredPharmacy: data.patient.preferred_pharmacy ?? "",
            insuranceProvider: data.patient.insurance_provider ?? "",
            insurancePolicyNo: data.patient.insurance_policy_no ?? "",
            insuranceGroupNo: data.patient.insurance_group_no ?? "",
            insuranceValidUntil: data.patient.insurance_valid_until ?? "",
            preferredLang: data.profile.preferred_lang,
            timezone: data.profile.timezone,
            advanceDirective: data.patient.advance_directive,
            organDonor: data.patient.organ_donor,
          }}
        />
      </SectionCard>
      <MfaEnrollmentCard enabled={data.profile.is_mfa_enabled} />
    </div>
  );
}
