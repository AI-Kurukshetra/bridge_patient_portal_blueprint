import { getFhirPatientContextFromRequest } from "@/lib/fhir/context";
import { buildFhirImmunization } from "@/lib/fhir/resources";
import { filterByLastUpdated, fhirJson, makeBundle, paginate, parseLastUpdated, parsePagination } from "@/lib/fhir/utils";

export async function GET(request: Request) {
  const resolved = await getFhirPatientContextFromRequest(request);
  if ("response" in resolved) {
    return resolved.response;
  }

  const { context, url } = resolved;
  const lastUpdated = parseLastUpdated(url.searchParams.get("_lastUpdated"));
  const immunizations = context.procedures.filter((item) => {
    const category = item.category?.toLowerCase() ?? "";
    return category.includes("immun") || category.includes("vaccin");
  });
  const resources = filterByLastUpdated(immunizations, lastUpdated, (item) => item.performed_at);
  const { count, offset } = parsePagination(url);
  const filtered = paginate(resources, count, offset);

  return fhirJson(makeBundle(filtered.map((item) => ({ resource: buildFhirImmunization(item, context.patient.id) })), resources.length));
}