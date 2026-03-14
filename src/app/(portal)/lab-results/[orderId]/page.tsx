import { notFound } from "next/navigation";
import { SectionCard, StatusBadge } from "@/components/ui/primitives";
import { formatDate } from "@/lib/utils";
import { getPortalData } from "@/lib/queries/portal";

export default async function LabResultDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const data = await getPortalData();
  if (!data) return null;

  const result = data.labResults.find((item) => item.id === orderId || item.fhir_id === orderId);
  if (!result) notFound();

  return (
    <SectionCard title={result.test_name} description={result.panel_name}>
      <div className="grid gap-4 text-sm text-slate-300">
        <div className="flex items-center justify-between gap-3"><p>Status</p><StatusBadge value={result.abnormal_flag ?? result.status} /></div>
        <div className="flex items-center justify-between gap-3"><p>Observed</p><p className="text-white">{formatDate(result.observed_at)}</p></div>
        <div className="flex items-center justify-between gap-3"><p>Reference range</p><p className="text-white">{result.reference_range ?? "Not supplied"}</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="font-medium text-white">Result value</p><p className="mt-2">{result.result_value ?? result.result_text ?? "Pending"} {result.unit ?? ""}</p></div>
      </div>
    </SectionCard>
  );
}
