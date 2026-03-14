import { payInvoiceAction } from "@/lib/actions/portal";
import { EmptyState, SectionCard, StatusBadge } from "@/components/ui/primitives";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getPortalData } from "@/lib/queries/portal";

export default async function BillingPage() {
  const data = await getPortalData();
  if (!data || !data.patient) return null;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <SectionCard title="Invoices" description="Outstanding and paid statements">
        <div className="grid gap-3">
          {data.invoices.length === 0 ? <EmptyState title="No invoices" body="Billing statements will appear here." /> : data.invoices.map((invoice) => (
            <div key={invoice.id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-medium text-white">{invoice.description}</p><p className="text-sm text-slate-400">Due {invoice.due_date ? formatDate(invoice.due_date) : "N/A"}</p></div><StatusBadge value={invoice.status} /></div><div className="mt-4 flex items-center justify-between gap-3"><p className="text-lg text-white">{formatCurrency(invoice.amount_cents, invoice.currency)}</p>{invoice.status === "open" ? <form action={async () => { "use server"; await payInvoiceAction(invoice.id, data.patient!.id, invoice.amount_cents); }}><button className="rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-300">Mark paid</button></form> : null}</div></div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Payment history" description="Recorded payment transactions">
        <div className="grid gap-3">
          {data.payments.length === 0 ? <EmptyState title="No payments" body="Payments will appear after invoices are settled." /> : data.payments.map((payment) => (
            <div key={payment.id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex items-center justify-between gap-3"><p className="font-medium text-white">{formatCurrency(payment.amount_cents)}</p><StatusBadge value={payment.status} /></div><p className="mt-2 text-sm text-slate-300">{payment.method.replaceAll("_", " ")} • {payment.confirmation_code ?? "Pending confirmation"}</p></div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

