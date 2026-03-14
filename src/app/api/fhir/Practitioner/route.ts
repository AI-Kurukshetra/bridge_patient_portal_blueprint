import { getAuthContext } from "@/lib/auth/server";
import { getFhirPatientContextFromRequest, getViewerProviderRecord } from "@/lib/fhir/context";
import { buildFhirPractitioner } from "@/lib/fhir/resources";
import { fhirJson, fhirUnauthorized, makeBundle, paginate, parsePagination } from "@/lib/fhir/utils";
import { createClient } from "@/lib/supabase/server";
import type { Row } from "@/types/database";

export async function GET(request: Request) {
  const auth = await getAuthContext();
  if (!auth) {
    return fhirUnauthorized();
  }

  const url = new URL(request.url);
  let practitioners: Row<"providers">[] = [];

  if (url.searchParams.get("patient") || auth.role === "patient") {
    const resolved = await getFhirPatientContextFromRequest(request);
    if ("response" in resolved) {
      return resolved.response;
    }

    practitioners = resolved.context.careTeam;
  } else if (auth.role === "provider") {
    const provider = await getViewerProviderRecord();
    practitioners = provider ? [provider] : [];
  } else {
    const supabase = await createClient();
    const { data } = await supabase.from("providers").select("*").order("last_name");
    practitioners = data ?? [];
  }

  const idFilter = url.searchParams.get("_id");
  const nameFilter = url.searchParams.get("name")?.toLowerCase();
  const specialtyFilter = url.searchParams.get("specialty")?.toLowerCase();
  const resources = practitioners.filter((provider) => {
    const fullName = `${provider.first_name} ${provider.last_name}`.trim().toLowerCase();

    if (idFilter && provider.id !== idFilter) {
      return false;
    }

    if (nameFilter && !fullName.includes(nameFilter)) {
      return false;
    }

    if (specialtyFilter && !provider.specialty.toLowerCase().includes(specialtyFilter)) {
      return false;
    }

    return true;
  });

  const { count, offset } = parsePagination(url);
  const filtered = paginate(resources, count, offset);

  return fhirJson(makeBundle(filtered.map((provider) => ({ resource: buildFhirPractitioner(provider) })), resources.length));
}