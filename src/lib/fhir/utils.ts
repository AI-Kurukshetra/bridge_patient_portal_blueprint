import { NextResponse } from "next/server";

export function fhirJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    headers: { "Content-Type": "application/fhir+json" },
    status,
  });
}

export function fhirUnauthorized() {
  return fhirJson({ error: "Unauthorized" }, 401);
}

export function paginate<T>(items: T[], count: number, offset: number) {
  return items.slice(offset, offset + count);
}

export function parsePagination(url: URL) {
  const count = Number(url.searchParams.get("_count") ?? 20);
  const offset = Number(url.searchParams.get("_offset") ?? 0);

  return {
    count: Number.isFinite(count) ? Math.min(Math.max(count, 1), 100) : 20,
    offset: Number.isFinite(offset) ? Math.max(offset, 0) : 0,
  };
}

export function matchesPatient(url: URL, patientId: string) {
  const requestedPatientId = url.searchParams.get("patient");
  return !requestedPatientId || requestedPatientId === patientId;
}

export function parseLastUpdated(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.startsWith("gt") ? value.slice(2) : value;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

export function filterByLastUpdated<T>(items: T[], lastUpdated: Date | null, accessor: (item: T) => string | null | undefined) {
  if (!lastUpdated) {
    return items;
  }

  return items.filter((item) => {
    const value = accessor(item);
    if (!value) {
      return false;
    }

    return new Date(value) > lastUpdated;
  });
}

export function makeBundle(entries: { resource: unknown }[]) {
  return {
    resourceType: "Bundle",
    type: "searchset",
    total: entries.length,
    entry: entries,
  };
}
