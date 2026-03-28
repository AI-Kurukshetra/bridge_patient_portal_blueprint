import Link from "next/link";
import { ClaimAppealForm } from "@/components/forms/claim-appeal-form";
import { EmptyState, SectionCard, StatCard, StatusBadge } from "@/components/ui/primitives";
import { logAudit } from "@/lib/audit";
import { getClaimBalance, getCoverageRatio, getDeniedClaimCount, getLatestClaim, getOpenClaimCount, isAppealableClaim } from "@/lib/insurance";
import { getPortalData } from "@/lib/queries/portal";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export default async function InsurancePage() {
  const data = await getPortalData();
  if (!data || !data.patient || !data.profile) return null;

  const patient = data.patient;
  const insuranceDocuments = data.documents.filter((document) => document.category === "insurance");
  const primaryProvider = data.providers.find((provider) => provider.id === patient.primary_provider_id) ?? null;
  const openClaims = getOpenClaimCount(data.insuranceClaims);
  const deniedClaims = getDeniedClaimCount(data.insuranceClaims);
  const latestClaim = getLatestClaim(data.insuranceClaims);
  const totalPatientResponsibility = data.insuranceClaims.reduce((sum, claim) => sum + getClaimBalance(claim), 0);
  const openBalance = data.invoices.filter((invoice) => invoice.status === "open").reduce((sum, invoice) => sum + invoice.amount_cents, 0);

  await logAudit({
    action: "VIEW_INSURANCE_CENTER",
    metadata: {
      claims: data.insuranceClaims.length,
      documents: insuranceDocuments.length,
      hasCoverage: Boolean(patient.insurance_provider),
    },
    patientId: patient.id,
    resourceId: patient.id,
    resourceType: "insurance-center",
  });

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Open claims" value={String(openClaims)} detail="Submitted, under-review, or appealed claims needing payer follow-up." />
        <StatCard label="Denied claims" value={String(deniedClaims)} detail="Claims that may need additional documentation or appeal action." />
        <StatCard label="Patient responsibility" value={formatCurrency(totalPatientResponsibility)} detail="Estimated out-of-pocket balance across current claims." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <SectionCard title="Coverage summary" description="Current payer, policy, and care-team context used across claims and billing workflows.">
          <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/70">Primary coverage</p>
                <p className="mt-2 font-serif text-2xl text-white">{patient.insurance_provider ?? "Coverage pending"}</p>
                <p className="mt-1 text-sm text-slate-200">Policy {patient.insurance_policy_no ?? "Not recorded"}</p>
              </div>
              <StatusBadge value={patient.insurance_provider ? "active" : "low"} />
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-200">
              <p>Group number: <span className="text-white">{patient.insurance_group_no ?? "Not recorded"}</span></p>
              <p>Coverage valid until: <span className="text-white">{patient.insurance_valid_until ? formatDate(patient.insurance_valid_until) : "Not recorded"}</span></p>
              <p>Preferred pharmacy: <span className="text-white">{patient.preferred_pharmacy ?? "Not recorded"}</span></p>
              <p>Primary provider: <span className="text-white">{primaryProvider ? `Dr. ${primaryProvider.first_name} ${primaryProvider.last_name}` : "Not assigned"}</span></p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <Link href="/profile" className="rounded-2xl border border-white/10 px-4 py-2 transition hover:border-cyan-300 hover:text-cyan-100">
                Update coverage details
              </Link>
              <Link href="/documents/upload" className="rounded-2xl border border-white/10 px-4 py-2 transition hover:border-cyan-300 hover:text-cyan-100">
                Upload insurance document
              </Link>
              <Link href="/billing" className="rounded-2xl border border-white/10 px-4 py-2 transition hover:border-cyan-300 hover:text-cyan-100">
                Open billing center
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
            <p className="font-medium text-white">Coverage workflow</p>
            <ul className="mt-3 grid gap-2">
              <li>Use Profile to keep payer, policy, and group information current.</li>
              <li>Upload updated insurance cards or prior authorization letters through Documents.</li>
              <li>Track payer decisions here, then review any residual balances in Billing.</li>
            </ul>
          </div>
        </SectionCard>

        <SectionCard title="Claims center" description="Review payer status, reimbursement amounts, and claim-specific follow-up actions.">
          <div className="grid gap-3">
            {data.insuranceClaims.length === 0 ? (
              <EmptyState title="No claims yet" body="Insurance claims will appear here after visits, reimbursements, or pharmacy submissions are processed." />
            ) : (
              data.insuranceClaims.map((claim) => (
                <div key={claim.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{claim.service_description}</p>
                      <p className="mt-1 text-sm text-slate-400">{claim.claim_number} - Submitted {formatDate(claim.submitted_at)}</p>
                    </div>
                    <StatusBadge value={claim.status} />
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
                    <p>Payer: <span className="text-white">{claim.payer_name}</span></p>
                    <p>Plan: <span className="text-white">{claim.plan_name ?? "Not recorded"}</span></p>
                    <p>Claim type: <span className="text-white capitalize">{claim.claim_type.replaceAll("_", " ")}</span></p>
                    <p>Reference: <span className="text-white">{claim.reference_number ?? "Pending"}</span></p>
                    <p>Service date: <span className="text-white">{claim.service_start ? formatDate(claim.service_start) : "Not recorded"}</span></p>
                    <p>Processed: <span className="text-white">{claim.processed_at ? formatDate(claim.processed_at) : "Awaiting payer decision"}</span></p>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Billed</p>
                      <p className="mt-2 text-lg text-white">{formatCurrency(claim.billed_amount_cents)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Allowed</p>
                      <p className="mt-2 text-lg text-white">{formatCurrency(claim.allowed_amount_cents ?? 0)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Covered</p>
                      <p className="mt-2 text-lg text-white">{formatCurrency(claim.covered_amount_cents ?? 0)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Patient owes</p>
                      <p className="mt-2 text-lg text-white">{formatCurrency(getClaimBalance(claim))}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                    <span>Coverage ratio <span className="text-white">{getCoverageRatio(claim)}%</span></span>
                    {claim.denial_reason ? <span>Denial reason <span className="text-rose-200">{claim.denial_reason}</span></span> : null}
                  </div>

                  {claim.notes ? (
                    <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-300">
                      <p className="font-medium text-white">Claim notes</p>
                      <p className="mt-2 whitespace-pre-line">{claim.notes}</p>
                    </div>
                  ) : null}

                  {isAppealableClaim(claim) ? (
                    <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/5 p-4">
                      <p className="font-medium text-white">Appeal denied claim</p>
                      <p className="mt-2 text-sm text-slate-300">Submit a justification and the claim will move back into active review for follow-up.</p>
                      <div className="mt-4">
                        <ClaimAppealForm claimId={claim.id} />
                      </div>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <SectionCard title="Insurance documents" description="Cards, prior authorization letters, and payer files linked to your portal account.">
          <div className="grid gap-3">
            {insuranceDocuments.length === 0 ? (
              <EmptyState title="No insurance files" body="Upload front and back card images or payer letters to keep the coverage record complete." />
            ) : (
              insuranceDocuments.map((document) => (
                <div key={document.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-medium text-white">{document.title}</p>
                  <p className="mt-2 text-sm text-slate-300">Added {formatDateTime(document.created_at)}</p>
                  <p className="mt-1 text-sm text-slate-500">{document.mime_type ?? "Unknown type"}{document.file_size ? ` - ${Math.max(1, Math.round(document.file_size / 1024))} KB` : ""}</p>
                  {document.signedUrl ? (
                    <a href={document.signedUrl} className="mt-3 inline-flex text-sm text-cyan-200 transition hover:text-cyan-100">
                      Open secure file
                    </a>
                  ) : null}
                </div>
              ))
            )}
          </div>
          <div className="mt-4">
            <Link href="/documents/upload" className="text-sm text-cyan-200 transition hover:text-cyan-100">Upload new insurance file</Link>
          </div>
        </SectionCard>

        <SectionCard title="Connected financial context" description="See how claims, invoices, and recent portal activity line up for follow-up.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Latest claim</p>
              {latestClaim ? (
                <>
                  <p className="mt-2 font-medium text-white">{latestClaim.claim_number}</p>
                  <p className="mt-1 text-sm text-slate-300">{latestClaim.service_description}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <StatusBadge value={latestClaim.status} />
                    <span className="text-sm text-slate-400">Submitted {formatDate(latestClaim.submitted_at)}</span>
                  </div>
                </>
              ) : (
                <EmptyState title="No claim activity" body="Recent payer updates will appear here once claims are generated." />
              )}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Billing relationship</p>
              <p className="mt-2 font-medium text-white">Open invoice balance {formatCurrency(openBalance)}</p>
              <p className="mt-2 text-sm text-slate-300">Claim decisions can change what appears in the billing center, but patient responsibility and posted invoices remain visible in parallel for transparency.</p>
              <Link href="/billing" className="mt-4 inline-flex text-sm text-cyan-200 transition hover:text-cyan-100">
                Review billing statements
              </Link>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}