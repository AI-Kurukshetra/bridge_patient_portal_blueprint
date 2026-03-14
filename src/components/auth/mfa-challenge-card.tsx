"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { FormError } from "@/components/ui/primitives";

type TotpFactor = {
  id: string;
  friendly_name?: string | null;
  status?: string;
};

export function MfaChallengeCard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [factor, setFactor] = useState<TotpFactor | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void (async () => {
        const supabase = createClient();
        const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aalError) {
          setError(aalError.message);
          setLoading(false);
          return;
        }

        if (aalData.currentLevel === "aal2" || aalData.nextLevel !== "aal2") {
          router.replace("/dashboard");
          router.refresh();
          return;
        }

        const { data, error: factorError } = await supabase.auth.mfa.listFactors();
        if (factorError) {
          setError(factorError.message);
        } else {
          const verifiedFactor = (data.totp ?? []).find((item) => item.status === "verified") ?? null;
          setFactor(verifiedFactor);
          if (!verifiedFactor) {
            setError("No verified authenticator factor found for this account.");
          }
        }
        setLoading(false);
      })();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [router]);

  const verifyChallenge = () => {
    if (!factor) {
      setError("No verified authenticator factor found for this account.");
      return;
    }

    setError("");
    startTransition(async () => {
      const supabase = createClient();
      const challenge = await supabase.auth.mfa.challenge({ factorId: factor.id });
      if (challenge.error) {
        setError(challenge.error.message);
        return;
      }

      const verify = await supabase.auth.mfa.verify({
        factorId: factor.id,
        challengeId: challenge.data.id,
        code: code.trim(),
      });
      if (verify.error) {
        setError(verify.error.message);
        return;
      }

      toast.success("MFA verification complete");
      router.replace("/dashboard");
      router.refresh();
    });
  };

  const signOut = () => {
    startTransition(async () => {
      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        setError(signOutError.message);
        return;
      }

      router.replace("/login");
      router.refresh();
    });
  };

  if (loading) {
    return <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-8 text-slate-200">Checking your authenticator status...</div>;
  }

  return (
    <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-[0_30px_120px_-60px_rgba(34,211,238,0.8)]">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">Verification required</p>
        <h1 className="mt-3 font-serif text-4xl text-white">Enter the code from your authenticator app.</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">This account has a verified TOTP factor enrolled. To continue into MedConnect Pro, complete the challenge with your six-digit code.</p>
      </div>
      <label className="grid gap-2 text-sm text-slate-200">
        <span>Authenticator code</span>
        <input value={code} onChange={(event) => setCode(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" placeholder="123456" />
      </label>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={verifyChallenge} disabled={isPending || !factor} className="rounded-2xl bg-cyan-400 px-4 py-3 font-medium text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60">{isPending ? "Verifying..." : "Verify and continue"}</button>
        <button type="button" onClick={signOut} disabled={isPending} className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 transition hover:border-white/30 disabled:opacity-60">Sign out</button>
      </div>
      <FormError message={error} />
    </div>
  );
}
