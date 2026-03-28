import { PatientChart } from "@/components/portal/patient-chart";
import { logAudit } from "@/lib/audit";
import { getCurrentPatientChart } from "@/lib/queries/patient-chart";

export default async function RecordsPage() {
  const chart = await getCurrentPatientChart();
  if (!chart) return null;

  await logAudit({
    action: "VIEW_HEALTH_RECORDS",
    metadata: {
      allergies: chart.allergies.length,
      conditions: chart.conditions.length,
      labResults: chart.labResults.length,
      medications: chart.prescriptions.length,
    },
    patientId: chart.patient.id,
    resourceId: chart.patient.id,
    resourceType: "health-records",
  });

  return (
    <PatientChart
      chart={chart}
      title="Electronic health record viewer"
      description="Complete medical history, medications, diagnoses, labs, allergies, and care-team context in one record view."
    />
  );
}