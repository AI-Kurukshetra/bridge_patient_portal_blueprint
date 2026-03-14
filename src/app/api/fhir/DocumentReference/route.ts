import { getFhirPatientContextFromRequest } from "@/lib/fhir/context";
import { buildFhirDocumentReference } from "@/lib/fhir/resources";
import { filterByLastUpdated, fhirJson, makeBundle, paginate, parseLastUpdated, parsePagination } from "@/lib/fhir/utils";

export async function GET(request: Request) {
  const resolved = await getFhirPatientContextFromRequest(request);
  if ("response" in resolved) {
    return resolved.response;
  }

  const { context, url } = resolved;
  const lastUpdated = parseLastUpdated(url.searchParams.get("_lastUpdated"));
  const resources = filterByLastUpdated(context.documents, lastUpdated, (document) => document.created_at);
  const { count, offset } = parsePagination(url);
  const filtered = paginate(resources, count, offset);

  return fhirJson(makeBundle(filtered.map((document) => ({ resource: buildFhirDocumentReference(document, context.patient.id) })), resources.length));
}