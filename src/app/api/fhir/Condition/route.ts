import { getFhirPatientContextFromRequest } from "@/lib/fhir/context";
import { buildFhirCondition } from "@/lib/fhir/resources";
import { filterByLastUpdated, fhirJson, makeBundle, paginate, parseLastUpdated, parsePagination } from "@/lib/fhir/utils";

export async function GET(request: Request) {
  const resolved = await getFhirPatientContextFromRequest(request);
  if ("response" in resolved) {
    return resolved.response;
  }

  const { context, url } = resolved;
  const lastUpdated = parseLastUpdated(url.searchParams.get("_lastUpdated"));
  const resources = filterByLastUpdated(context.conditions, lastUpdated, (condition) => condition.onset_date ?? condition.resolved_date);
  const { count, offset } = parsePagination(url);
  const filtered = paginate(resources, count, offset);

  return fhirJson(makeBundle(filtered.map((condition) => ({ resource: buildFhirCondition(condition, context.patient.id) })), resources.length));
}