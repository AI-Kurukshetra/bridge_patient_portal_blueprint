import { MessageComposer } from "@/components/forms/message-form";
import { SectionCard } from "@/components/ui/primitives";

export default function ComposeMessagePage() {
  return (
    <SectionCard title="Compose secure message" description="Start a new patient communication thread.">
      <MessageComposer />
    </SectionCard>
  );
}
