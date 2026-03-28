import { notFound } from "next/navigation";
import { PortalShell } from "@/components/layout/portal-shell";
import { PatientChart } from "@/components/portal/patient-chart";
import { logAudit } from "@/lib/audit";
import { getRoleLabel } from "@/lib/auth/roles";
import { getAuthorizedPatientChart } from "@/lib/queries/patient-chart";

export default async function CareTeamPatientChartPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const chart = await getAuthorizedPatientChart(patientId);

  if (!chart) {
    notFound();
  }

  await logAudit({
    action: "VIEW_PATIENT_CHART",
    metadata: {
      labResults: chart.labResults.length,
      medications: chart.prescriptions.length,
      viewerRole: chart.viewerRole,
    },
    patientId: chart.patient.id,
    resourceId: chart.patient.id,
    resourceType: "patient-chart",
  });

  return (
    <PortalShell
      profileName={chart.viewerProfile.full_name}
      roleLabel={getRoleLabel(chart.viewerRole)}
      subtitle="Care team workspace"
      variant={chart.viewerRole === "admin" ? "admin" : "provider"}
    >
      <PatientChart
        chart={chart}
        title="Electronic health record viewer"
        description="Complete longitudinal chart view for clinically authorized care team access."
        showBackLink
      />
    </PortalShell>
  );
}