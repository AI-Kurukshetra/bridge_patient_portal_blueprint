import Link from "next/link";
import { LabTrendChart } from "@/components/portal/lab-trend-chart";
import { EmptyState, SectionCard, StatCard, StatusBadge } from "@/components/ui/primitives";
import { getDeniedClaimCount, getLatestClaim, getOpenClaimCount } from "@/lib/insurance";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { PatientChartData } from "@/lib/queries/patient-chart";

type TimelineItem = {
  id: string;
  kind: "condition" | "procedure" | "lab" | "medication";
  title: string;
  detail: string;
  date: string;
  status: string | null;
};

function buildTimeline(chart: PatientChartData): TimelineItem[] {
  const conditionItems = chart.conditions.map((item) => ({
    id: item.id,
    kind: "condition" as const,
    title: item.display_name,
    detail: item.icd10_code ? `ICD-10 ${item.icd10_code}` : "Diagnosis",
    date: item.onset_date ?? item.resolved_date ?? chart.patient.created_at,
    status: item.clinical_status,
  }));

  const procedureItems = chart.procedures.map((item) => ({
    id: item.id,
    kind: "procedure" as const,
    title: item.procedure_name,
    detail: item.category ?? "Procedure",
    date: item.performed_at ?? chart.patient.created_at,
    status: item.outcome,
  }));

  const labItems = chart.labResults.map((item) => ({
    id: item.id,
    kind: "lab" as const,
    title: item.test_name,
    detail: item.result_value !== null ? `${item.result_value} ${item.unit ?? ""}`.trim() : item.result_text ?? item.panel_name,
    date: item.observed_at,
    status: item.abnormal_flag ?? item.status,
  }));

  const medicationItems = chart.prescriptions.map((item) => ({
    id: item.id,
    kind: "medication" as const,
    title: item.medication_name,
    detail: `${item.dosage} - ${item.frequency}`,
    date: item.prescribed_on,
    status: item.status,
  }));

  return [...conditionItems, ...procedureItems, ...labItems, ...medicationItems]
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 12);
}

export function PatientChart({
  chart,
  title,
  description,
  showBackLink,
}: {
  chart: PatientChartData;
  title: string;
  description: string;
  showBackLink?: boolean;
}) {
  const activeConditions = chart.conditions.filter((item) => item.clinical_status === "active").length;
  const activeMedications = chart.prescriptions.filter((item) => item.status === "active").length;
  const abnormalLabs = chart.labResults.filter((item) => item.abnormal_flag && item.abnormal_flag !== "normal").length;
  const immunizations = chart.procedures.filter((item) => {
    const category = item.category?.toLowerCase() ?? "";
    return category.includes("immun") || category.includes("vaccin");
  });
  const timeline = buildTimeline(chart);
  const openClaims = getOpenClaimCount(chart.insuranceClaims);
  const deniedClaims = getDeniedClaimCount(chart.insuranceClaims);
  const latestClaim = getLatestClaim(chart.insuranceClaims);

  return (
    <div className="grid gap-6">
      <SectionCard title={title} description={description}>
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Patient</p>
              <p className="mt-3 font-serif text-2xl text-white">{chart.patientProfile?.full_name ?? "Unknown patient"}</p>
              <div className="mt-3 grid gap-2 text-sm text-slate-300">
                <p>MRN: <span className="text-white">{chart.patient.patient_mrn}</span></p>
                <p>DOB: <span className="text-white">{chart.patientProfile?.date_of_birth ? formatDate(chart.patientProfile.date_of_birth) : "Not recorded"}</span></p>
                <p>Blood type: <span className="text-white">{chart.patient.blood_type ?? "Not recorded"}</span></p>
                <p>Language: <span className="text-white">{chart.patientProfile?.preferred_lang ?? "English"}</span></p>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Emergency and coverage</p>
              <div className="mt-3 grid gap-2 text-sm text-slate-300">
                <p>Contact: <span className="text-white">{chart.patient.emergency_contact_name ?? "Not recorded"}</span></p>
                <p>Phone: <span className="text-white">{chart.patient.emergency_contact_phone ?? "Not recorded"}</span></p>
                <p>Relationship: <span className="text-white">{chart.patient.emergency_contact_rel ?? "Not recorded"}</span></p>
                <p>Insurance: <span className="text-white">{chart.patient.insurance_provider ?? "Not recorded"}</span></p>
                <p>Policy: <span className="text-white">{chart.patient.insurance_policy_no ?? "Not recorded"}</span></p>
                <p>Open claims: <span className="text-white">{openClaims}</span></p>
                <p>Denied claims: <span className="text-white">{deniedClaims}</span></p>
                <p>Latest claim: <span className="text-white">{latestClaim ? `${latestClaim.claim_number} (${latestClaim.status.replaceAll("_", " ")})` : "No claims on file"}</span></p>
              </div>
              {chart.viewerRole === "patient" ? (
                <div className="mt-4">
                  <Link href="/insurance" className="text-sm text-cyan-200 transition hover:text-cyan-100">
                    Open insurance center
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-3">
            <StatCard label="Active conditions" value={String(activeConditions)} detail="Current diagnoses in the longitudinal record" />
            <StatCard label="Active medications" value={String(activeMedications)} detail="Medications currently marked active" />
            <StatCard label="Abnormal labs" value={String(abnormalLabs)} detail="Observations needing follow-up attention" />
          </div>
        </div>
        {showBackLink ? (
          <div className="mt-4">
            <Link href="/care-team/patients" className="text-sm text-cyan-200 transition hover:text-cyan-100">
              Back to patient charts
            </Link>
          </div>
        ) : null}
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard title="Clinical timeline" description="Recent diagnoses, procedures, medications, and lab observations across the patient history.">
          <div className="grid gap-3">
            {timeline.length === 0 ? (
              <EmptyState title="No record history" body="Medical record activity will appear here once connected systems post data." />
            ) : (
              timeline.map((item) => (
                <div key={`${item.kind}-${item.id}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{item.title}</p>
                      <p className="text-sm capitalize text-slate-400">{item.kind}</p>
                    </div>
                    <StatusBadge value={item.status} />
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
                  <p className="mt-1 text-sm text-slate-500">{formatDate(item.date)}</p>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Lab trends" description="Most recent structured observations with quantitative values.">
          <LabTrendChart data={chart.labResults} />
          <div className="mt-4 grid gap-3">
            {chart.labResults.length === 0 ? <EmptyState title="No labs" body="Lab observations will appear here when available." /> : chart.labResults.slice(0, 4).map((result) => (
              <div key={result.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{result.test_name}</p>
                    <p className="text-sm text-slate-400">{result.panel_name}</p>
                  </div>
                  <StatusBadge value={result.abnormal_flag ?? result.status} />
                </div>
                <p className="mt-2 text-sm text-slate-300">{result.result_value ?? result.result_text ?? "Pending"} {result.unit ?? ""}</p>
                <p className="mt-1 text-sm text-slate-500">Observed {formatDate(result.observed_at)}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard title="Diagnoses and allergies" description="Problem list and reaction history in one view." className="xl:col-span-1">
          <div className="grid gap-3">
            {chart.conditions.slice(0, 5).map((condition) => (
              <div key={condition.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{condition.display_name}</p>
                  <StatusBadge value={condition.clinical_status} />
                </div>
                <p className="mt-2 text-sm text-slate-300">Severity: {condition.severity ?? "Not documented"}</p>
              </div>
            ))}
            {chart.conditions.length === 0 ? <EmptyState title="No diagnoses" body="Diagnoses will appear here when shared by connected clinical systems." /> : null}
            {chart.allergies.map((allergy) => (
              <div key={allergy.id} className="rounded-2xl border border-white/10 bg-rose-500/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{allergy.allergen}</p>
                  <StatusBadge value={allergy.severity ?? allergy.status} />
                </div>
                <p className="mt-2 text-sm text-slate-300">{allergy.reaction?.join(", ") ?? "Reaction not documented"}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Medication history" description="Current and recently prescribed medications." className="xl:col-span-1">
          <div className="grid gap-3">
            {chart.prescriptions.length === 0 ? <EmptyState title="No medications" body="Medication history will appear here when available." /> : chart.prescriptions.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{item.medication_name}</p>
                    <p className="text-sm text-slate-400">{item.dosage} - {item.frequency}</p>
                  </div>
                  <StatusBadge value={item.status} />
                </div>
                <p className="mt-2 text-sm text-slate-300">Prescribed {formatDate(item.prescribed_on)}</p>
                <p className="mt-1 text-sm text-slate-500">Refills remaining: {item.refill_remaining}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Care team and immunizations" description="Providers connected to this chart and vaccination history." className="xl:col-span-1">
          <div className="grid gap-3">
            {chart.primaryProvider ? (
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/70">Primary provider</p>
                <p className="mt-2 font-medium text-white">Dr. {chart.primaryProvider.first_name} {chart.primaryProvider.last_name}</p>
                <p className="text-sm text-slate-300">{chart.primaryProvider.specialty}</p>
              </div>
            ) : null}
            {chart.careTeam.filter((item) => item.id !== chart.primaryProvider?.id).slice(0, 4).map((provider) => (
              <div key={provider.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-medium text-white">Dr. {provider.first_name} {provider.last_name}</p>
                <p className="text-sm text-slate-400">{provider.specialty}</p>
              </div>
            ))}
            {immunizations.length === 0 ? (
              <EmptyState title="No immunizations" body="Vaccination history will appear here when recorded in the clinical timeline." />
            ) : (
              immunizations.slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{item.procedure_name}</p>
                    <StatusBadge value={item.outcome ?? "completed"} />
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{item.performed_at ? formatDateTime(item.performed_at) : "Date unavailable"}</p>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}