import { ConsentControls } from "@/components/forms/consent-controls";
import { SectionCard } from "@/components/ui/primitives";
import { getPortalData } from "@/lib/queries/portal";

export default async function ConsentsPage() {
  const data = await getPortalData();
  if (!data) return null;

  return (
    <SectionCard title="Data consent management" description="Review and manage treatment, HIPAA, communications, and research preferences.">
      <ConsentControls consents={data.consents} />
    </SectionCard>
  );
}

