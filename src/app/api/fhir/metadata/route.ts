import { buildFhirCapabilityStatement } from "@/lib/fhir/resources";
import { fhirJson } from "@/lib/fhir/utils";

export async function GET() {
  return fhirJson(buildFhirCapabilityStatement());
}