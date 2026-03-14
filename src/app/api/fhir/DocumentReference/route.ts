import { fhirJson, fhirUnauthorized, makeBundle, matchesPatient, paginate, parsePagination } from "@/lib/fhir/utils";
import { getPortalData } from "@/lib/queries/portal";

export async function GET(request: Request) {
  const data = await getPortalData();
  if (!data || !data.patient) {
    return fhirUnauthorized();
  }

  const url = new URL(request.url);
  if (!matchesPatient(url, data.patient.id)) {
    return fhirJson(makeBundle([]));
  }

  const { count, offset } = parsePagination(url);
  const filtered = paginate(data.documents, count, offset);

  return fhirJson(
    makeBundle(
      filtered.map((document) => ({
        resource: {
          resourceType: "DocumentReference",
          id: document.id,
          status: "current",
          subject: { reference: `Patient/${data.patient!.id}` },
          type: { text: document.category.replaceAll("_", " ") },
          date: document.created_at,
          description: document.title,
          content: [
            {
              attachment: {
                contentType: document.mime_type ?? undefined,
                title: document.title,
                url: document.signedUrl ?? undefined,
              },
            },
          ],
        },
      })),
    ),
  );
}
