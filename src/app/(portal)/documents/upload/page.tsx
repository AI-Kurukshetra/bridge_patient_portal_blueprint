import { DocumentForm } from "@/components/forms/document-form";
import { SectionCard } from "@/components/ui/primitives";

export default function UploadDocumentPage() {
  return (
    <SectionCard title="Upload document" description="Add a PDF, image, Word, or text file to the secure document library.">
      <DocumentForm />
    </SectionCard>
  );
}
