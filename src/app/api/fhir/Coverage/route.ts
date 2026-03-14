import { getFhirPatientContextFromRequest } from "@/lib/fhir/context";
import { buildFhirCoverage } from "@/lib/fhir/resources";
import { fhirJson, makeBundle } from "@/lib/fhir/utils";

export async function GET(request: Request) {
  const resolved = await getFhirPatientContextFromRequest(request);
  if ("response" in resolved) {
    return resolved.response;
  }

  const coverage = resolved.context.patient.insurance_provider ? [{ resource: buildFhirCoverage(resolved.context.patient) }] : [];
  return fhirJson(makeBundle(coverage, coverage.length));
}