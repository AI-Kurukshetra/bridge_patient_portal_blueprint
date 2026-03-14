import { DocumentForm } from "@/components/forms/document-form";
import { EmptyState, SectionCard, StatusBadge } from "@/components/ui/primitives";
import { formatDate } from "@/lib/utils";
import { getPortalData } from "@/lib/queries/portal";

export default async function DocumentsPage() {
  const data = await getPortalData();
  if (!data) return null;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <SectionCard title="Add document metadata" description="Storage wiring can be layered on later; the portal already tracks document records in Supabase.">
        <DocumentForm />
      </SectionCard>
      <SectionCard title="Documents" description="Uploaded and generated files tied to your account.">
        <div className="grid gap-3">
          {data.documents.length === 0 ? <EmptyState title="No documents" body="Add a document to populate this list." /> : data.documents.map((doc) => (
            <div key={doc.id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex items-center justify-between gap-3"><p className="font-medium text-white">{doc.title}</p><StatusBadge value={doc.category} /></div><p className="mt-2 text-sm text-slate-300">{doc.mime_type ?? "Unknown file type"}</p><p className="mt-1 text-sm text-slate-400">Added {formatDate(doc.created_at)}</p></div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

