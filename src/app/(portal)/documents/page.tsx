import { DocumentForm } from "@/components/forms/document-form";
import { EmptyState, SectionCard, StatusBadge } from "@/components/ui/primitives";
import { formatDate } from "@/lib/utils";
import { getPortalData } from "@/lib/queries/portal";

export default async function DocumentsPage() {
  const data = await getPortalData();
  if (!data) return null;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <SectionCard
        title="Upload a document"
        description="Files are stored in Supabase Storage and linked to your patient record with signed access URLs."
      >
        <DocumentForm />
      </SectionCard>
      <SectionCard title="Documents" description="Uploaded and generated files tied to your account.">
        <div className="grid gap-3">
          {data.documents.length === 0 ? (
            <EmptyState title="No documents" body="Upload a file to populate this list." />
          ) : (
            data.documents.map((doc) => (
              <div key={doc.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{doc.title}</p>
                    <p className="mt-2 text-sm text-slate-300">{doc.mime_type ?? "Unknown file type"}</p>
                    <p className="mt-1 text-sm text-slate-400">Added {formatDate(doc.created_at)}</p>
                  </div>
                  <StatusBadge value={doc.category} />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {doc.signedUrl ? (
                    <a
                      href={doc.signedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-2xl border border-cyan-400/30 px-3 py-2 text-sm text-cyan-100 transition hover:border-cyan-300 hover:text-cyan-50"
                    >
                      View file
                    </a>
                  ) : (
                    <p className="text-sm text-slate-500">Signed download unavailable for this file.</p>
                  )}
                  <p className="text-xs text-slate-500">{doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : "Size unavailable"}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </SectionCard>
    </div>
  );
}
