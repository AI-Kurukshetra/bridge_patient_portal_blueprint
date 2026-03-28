import { getFhirPatientContextFromRequest } from "@/lib/fhir/context";
import { buildFhirMedication } from "@/lib/fhir/resources";
import { filterByLastUpdated, fhirJson, makeBundle, paginate, parseLastUpdated, parsePagination } from "@/lib/fhir/utils";

export async function GET(request: Request) {
  const resolved = await getFhirPatientContextFromRequest(request);
  if ("response" in resolved) {
    return resolved.response;
  }

  const { context, url } = resolved;
  const lastUpdated = parseLastUpdated(url.searchParams.get("_lastUpdated"));
  const resources = filterByLastUpdated(context.prescriptions, lastUpdated, (item) => item.last_refill_requested_at ?? item.prescribed_on);
  const { count, offset } = parsePagination(url);
  const filtered = paginate(resources, count, offset);

  return fhirJson(makeBundle(filtered.map((item) => ({ resource: buildFhirMedication(item) })), resources.length));
}