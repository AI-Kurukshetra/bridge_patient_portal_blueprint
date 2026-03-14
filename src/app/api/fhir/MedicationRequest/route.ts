import { filterByLastUpdated, fhirJson, fhirUnauthorized, makeBundle, matchesPatient, paginate, parseLastUpdated, parsePagination } from "@/lib/fhir/utils";
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
  const lastUpdated = parseLastUpdated(url.searchParams.get("_lastUpdated"));
  const filtered = paginate(
    filterByLastUpdated(data.prescriptions, lastUpdated, (item) => item.last_refill_requested_at ?? item.prescribed_on),
    count,
    offset,
  );

  return fhirJson(
    makeBundle(
      filtered.map((item) => ({
        resource: {
          resourceType: "MedicationRequest",
          id: item.id,
          status: item.status,
          intent: "order",
          subject: { reference: `Patient/${data.patient!.id}` },
          medicationCodeableConcept: { text: item.medication_name },
          authoredOn: item.prescribed_on,
          dosageInstruction: [{ text: `${item.dosage} ${item.frequency}`.trim() }],
          dispenseRequest: {
            numberOfRepeatsAllowed: item.refill_remaining,
            performer: item.pharmacy_name ? { display: item.pharmacy_name } : undefined,
          },
        },
      })),
    ),
  );
}
