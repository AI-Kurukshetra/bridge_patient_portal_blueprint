"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateConsentAction } from "@/lib/actions/portal";
import type { Row } from "@/types/database";

export function ConsentControls({ consents }: { consents: Row<"data_consents">[] }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="grid gap-3">
      {consents.map((consent) => (
        <div key={consent.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
          <div>
            <p className="font-medium capitalize text-white">{consent.consent_type.replaceAll("_", " ")}</p>
            <p className="text-sm text-slate-400">{consent.granted ? "Granted" : "Revoked"}</p>
          </div>
          <button
            disabled={isPending}
            onClick={() => startTransition(async () => {
              const result = await updateConsentAction({ consentType: consent.consent_type as "treatment" | "hipaa" | "research" | "sms" | "email", granted: !consent.granted });
              if (result.error) {
                toast.error(result.error._form?.[0] ?? "Unable to update consent");
                return;
              }
              toast.success(result.message ?? "Consent updated");
            })}
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-100 transition hover:border-cyan-400 hover:text-cyan-200 disabled:opacity-60"
          >
            {consent.granted ? "Revoke" : "Grant"}
          </button>
        </div>
      ))}
    </div>
  );
}

