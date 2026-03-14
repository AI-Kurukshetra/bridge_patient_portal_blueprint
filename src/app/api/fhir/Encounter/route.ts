import { getFhirPatientContextFromRequest } from "@/lib/fhir/context";
import { buildFhirEncounter } from "@/lib/fhir/resources";
import { filterByLastUpdated, fhirJson, makeBundle, paginate, parseLastUpdated, parsePagination } from "@/lib/fhir/utils";

export async function GET(request: Request) {
  const resolved = await getFhirPatientContextFromRequest(request);
  if ("response" in resolved) {
    return resolved.response;
  }

  const { context, url } = resolved;
  const lastUpdated = parseLastUpdated(url.searchParams.get("_lastUpdated"));
  const resources = filterByLastUpdated(context.appointments, lastUpdated, (item) => item.cancelled_at ?? item.scheduled_at);
  const { count, offset } = parsePagination(url);
  const filtered = paginate(resources, count, offset);

  return fhirJson(makeBundle(filtered.map((item) => ({ resource: buildFhirEncounter(item, context.patient.id) })), resources.length));
}