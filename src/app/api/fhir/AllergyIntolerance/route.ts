import { getFhirPatientContextFromRequest } from "@/lib/fhir/context";
import { buildFhirAllergy } from "@/lib/fhir/resources";
import { fhirJson, makeBundle, paginate, parsePagination } from "@/lib/fhir/utils";

export async function GET(request: Request) {
  const resolved = await getFhirPatientContextFromRequest(request);
  if ("response" in resolved) {
    return resolved.response;
  }

  const { context, url } = resolved;
  const { count, offset } = parsePagination(url);
  const filtered = paginate(context.allergies, count, offset);

  return fhirJson(makeBundle(filtered.map((allergy) => ({ resource: buildFhirAllergy(allergy, context.patient.id) })), context.allergies.length));
}