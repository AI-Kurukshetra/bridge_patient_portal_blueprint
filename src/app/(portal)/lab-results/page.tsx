import { LabTrendChart } from "@/components/portal/lab-trend-chart";
import { EmptyState, SectionCard, StatusBadge } from "@/components/ui/primitives";
import { logAudit } from "@/lib/audit";
import { formatDate } from "@/lib/utils";
import { getPortalData } from "@/lib/queries/portal";

export default async function LabResultsPage() {
  const data = await getPortalData();
  if (!data) return null;

  if (data.patient) {
    await logAudit({
      action: "VIEW_LAB_RESULTS",
      metadata: { resultsViewed: data.labResults.length },
      patientId: data.patient.id,
      resourceType: "lab-results",
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <SectionCard title="Trend chart" description="Most recent quantitative result values.">
        <LabTrendChart data={data.labResults} />
      </SectionCard>
      <SectionCard title="Lab results" description="Latest observations across finalized panels">
        <div className="grid gap-3">
          {data.labResults.length === 0 ? <EmptyState title="No lab results" body="Lab panels will appear here when available." /> : data.labResults.map((result) => (
            <div key={result.id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-medium text-white">{result.test_name}</p><p className="text-sm text-slate-400">{result.panel_name}</p></div><StatusBadge value={result.abnormal_flag ?? result.status} /></div><p className="mt-2 text-sm text-slate-200">{result.result_value ?? result.result_text ?? "Pending"} {result.unit ?? ""}</p><p className="mt-1 text-sm text-slate-400">Observed {formatDate(result.observed_at)}</p></div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
