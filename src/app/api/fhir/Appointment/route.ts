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
    filterByLastUpdated(data.appointments, lastUpdated, (item) => item.cancelled_at ?? item.scheduled_at),
    count,
    offset,
  );

  return fhirJson(
    makeBundle(
      filtered.map((item) => ({
        resource: {
          resourceType: "Appointment",
          id: item.id,
          status: item.status,
          appointmentType: { text: item.appointment_type.replaceAll("_", " ") },
          description: item.reason,
          start: item.scheduled_at,
          minutesDuration: item.duration_minutes,
          participant: [{ actor: { reference: `Patient/${data.patient!.id}` }, status: "accepted" }],
        },
      })),
    ),
  );
}
