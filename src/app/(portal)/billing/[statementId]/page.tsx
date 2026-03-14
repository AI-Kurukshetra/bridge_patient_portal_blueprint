import { notFound } from "next/navigation";
import { payInvoiceAction } from "@/lib/actions/portal";
import { SectionCard, StatusBadge } from "@/components/ui/primitives";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getPortalData } from "@/lib/queries/portal";

export default async function BillingStatementDetailPage({ params }: { params: Promise<{ statementId: string }> }) {
  const { statementId } = await params;
  const data = await getPortalData();
  if (!data) return null;

  const invoice = data.invoices.find((item) => item.id === statementId);
  if (!invoice) notFound();

  return (
    <SectionCard title={invoice.description} description={`Statement ${invoice.invoice_number}`}>
      <div className="grid gap-4 text-sm text-slate-300">
        <div className="flex items-center justify-between gap-3"><p>Status</p><StatusBadge value={invoice.status} /></div>
        <div className="flex items-center justify-between gap-3"><p>Issued</p><p className="text-white">{formatDate(invoice.issued_at)}</p></div>
        <div className="flex items-center justify-between gap-3"><p>Due date</p><p className="text-white">{invoice.due_date ? formatDate(invoice.due_date) : "N/A"}</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="font-medium text-white">Outstanding amount</p><p className="mt-2 text-xl text-white">{formatCurrency(invoice.amount_cents, invoice.currency)}</p></div>
        {invoice.status === "open" ? (
          <form action={async () => { "use server"; await payInvoiceAction(invoice.id); }}>
            <button className="rounded-2xl bg-emerald-400 px-4 py-2 font-medium text-slate-950 transition hover:bg-emerald-300">Pay now</button>
          </form>
        ) : null}
      </div>
    </SectionCard>
  );
}
