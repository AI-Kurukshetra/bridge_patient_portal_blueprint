"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { syncMfaStatusAction } from "@/lib/actions/profile";
import { FormError } from "@/components/ui/primitives";

type TotpFactor = {
  id: string;
  friendly_name?: string | null;
  status?: string;
};

export function MfaEnrollmentCard({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [factors, setFactors] = useState<TotpFactor[]>([]);
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void (async () => {
        const supabase = createClient();
        const { data, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) {
          setError(factorsError.message);
          return;
        }

        setFactors(data.totp ?? []);
      })();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const loadFactors = async () => {
    const supabase = createClient();
    const { data, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) {
      setError(factorsError.message);
      return;
    }

    setFactors(data.totp ?? []);
  };

  const startEnrollment = () => {
    setError("");
    startTransition(async () => {
      const supabase = createClient();
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "MedConnect Pro",
      });

      if (enrollError) {
        setError(enrollError.message);
        return;
      }

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setIsEnrolling(true);
    });
  };

  const verifyEnrollment = () => {
    setError("");
    startTransition(async () => {
      const supabase = createClient();
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) {
        setError(challenge.error.message);
        return;
      }

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: code.trim(),
      });

      if (verify.error) {
        setError(verify.error.message);
        return;
      }

      await syncMfaStatusAction(true);
      toast.success("Multi-factor authentication enabled");
      setCode("");
      setIsEnrolling(false);
      setQrCode("");
      setSecret("");
      await loadFactors();
      router.refresh();
    });
  };

  const disableMfa = () => {
    setError("");
    startTransition(async () => {
      const supabase = createClient();
      for (const factor of factors) {
        const result = await supabase.auth.mfa.unenroll({ factorId: factor.id });
        if (result.error) {
          setError(result.error.message);
          return;
        }
      }
      await supabase.auth.refreshSession();
      await syncMfaStatusAction(false);
      toast.success("Multi-factor authentication disabled");
      setFactors([]);
      router.refresh();
    });
  };

  const verifiedCount = factors.filter((factor) => factor.status === "verified").length;

  return (
    <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/70 p-6">
      <div>
        <h2 className="font-serif text-2xl text-white">Multi-factor authentication</h2>
        <p className="mt-2 text-sm text-slate-400">TOTP-based MFA using an authenticator app. If you enroll a factor, MedConnect will challenge for it before protected access when the session assurance level needs to be upgraded.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
        <p>Status: <span className="font-medium text-white">{enabled || verifiedCount > 0 ? "Enabled" : "Not enabled"}</span></p>
        <p className="mt-1 text-slate-400">Verified factors: {verifiedCount}</p>
      </div>

      {isEnrolling ? (
        <div className="grid gap-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4">
          <p className="text-sm text-slate-300">Scan this QR code with your authenticator app, or enter the secret manually if scanning is unavailable.</p>
          {qrCode ? (
            <Image
              alt="MFA QR code"
              className="rounded-2xl bg-white p-3"
              height={192}
              src={`data:image/svg+xml;utf8,${encodeURIComponent(qrCode)}`}
              unoptimized
              width={192}
            />
          ) : null}
          <p className="text-xs text-slate-400">Secret: <span className="break-all text-slate-200">{secret}</span></p>
          <label className="grid gap-2 text-sm text-slate-200">
            <span>Authenticator code</span>
            <input value={code} onChange={(event) => setCode(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" placeholder="123456" />
          </label>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={verifyEnrollment} disabled={isPending} className="rounded-2xl bg-cyan-400 px-4 py-2 font-medium text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60">{isPending ? "Verifying..." : "Verify and enable"}</button>
            <button type="button" onClick={() => { setIsEnrolling(false); setQrCode(""); setSecret(""); setCode(""); setError(""); }} className="rounded-2xl border border-white/10 px-4 py-2 text-slate-200 transition hover:border-white/30">Cancel</button>
          </div>
        </div>
      ) : null}

      {!isEnrolling ? (
        <div className="flex flex-wrap gap-3">
          {verifiedCount === 0 ? (
            <button type="button" onClick={startEnrollment} disabled={isPending} className="rounded-2xl bg-emerald-400 px-4 py-2 font-medium text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60">{isPending ? "Preparing..." : "Set up MFA"}</button>
          ) : (
            <button type="button" onClick={disableMfa} disabled={isPending} className="rounded-2xl border border-rose-400/30 px-4 py-2 text-rose-200 transition hover:border-rose-300 hover:text-rose-100 disabled:opacity-60">{isPending ? "Disabling..." : "Disable MFA"}</button>
          )}
        </div>
      ) : null}

      <FormError message={error} />
    </div>
  );
}
