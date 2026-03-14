import { requestRefillAction } from "@/lib/actions/portal";
import { EmptyState, SectionCard, StatusBadge } from "@/components/ui/primitives";
import { formatDate, formatDateTime } from "@/lib/utils";
import { getPortalData } from "@/lib/queries/portal";

export default async function PrescriptionsPage() {
  const data = await getPortalData();
  if (!data) return null;

  return (
    <SectionCard title="Prescriptions" description="Medication list with refill requests.">
      <div className="grid gap-3">
        {data.prescriptions.length === 0 ? (
          <EmptyState title="No prescriptions" body="Active medications will appear here." />
        ) : (
          data.prescriptions.map((item) => {
            const canRequestRefill = item.status === "active" && item.refill_remaining > 0;

            return (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{item.medication_name}</p>
                    <p className="text-sm text-slate-400">{item.dosage} • {item.frequency}</p>
                  </div>
                  <StatusBadge value={item.status} />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-300">Prescribed {formatDate(item.prescribed_on)} • Refills left: {item.refill_remaining}</p>
                    {item.last_refill_requested_at ? (
                      <p className="mt-1 text-xs text-slate-500">Last requested {formatDateTime(item.last_refill_requested_at)}</p>
                    ) : null}
                  </div>
                  {canRequestRefill ? (
                    <form
                      action={async () => {
                        "use server";
                        await requestRefillAction(item.id);
                      }}
                    >
                      <button className="rounded-2xl border border-white/10 px-4 py-2 text-sm transition hover:border-cyan-400 hover:text-cyan-200">
                        Request refill
                      </button>
                    </form>
                  ) : (
                    <p className="text-sm text-slate-500">Refill requests unavailable for this prescription.</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </SectionCard>
  );
}
