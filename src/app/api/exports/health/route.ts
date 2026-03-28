import { NextResponse, type NextRequest } from "next/server";
import { logAudit } from "@/lib/audit";
import {
  buildHealthExportCsv,
  buildHealthExportFhirBundle,
  buildHealthExportFilename,
  buildHealthExportPdf,
  getHealthExportSectionLabels,
} from "@/lib/exports/health";
import { getPortalData } from "@/lib/queries/portal";
import {
  healthDataExportSchema,
  normalizeHealthDataExportInput,
} from "@/lib/validations/export";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const parsed = healthDataExportSchema.safeParse(
    normalizeHealthDataExportInput(Object.fromEntries(request.nextUrl.searchParams.entries())),
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = await getPortalData();
  if (!data || !data.patient || !data.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filename = buildHealthExportFilename(parsed.data.format);
  const selectedSections = getHealthExportSectionLabels(parsed.data);

  await logAudit({
    action: "EXPORT_HEALTH_DATA",
    metadata: {
      appointments: data.appointments.length,
      documents: data.documents.length,
      format: parsed.data.format,
      labResults: data.labResults.length,
      medications: data.prescriptions.length,
      sections: selectedSections,
    },
    patientId: data.patient.id,
    resourceId: parsed.data.format,
    resourceType: "health-data-export",
  });

  const baseHeaders = {
    "Cache-Control": "no-store",
    "Content-Disposition": `attachment; filename="${filename}"`,
  };

  switch (parsed.data.format) {
    case "csv": {
      const csv = buildHealthExportCsv(data, parsed.data);
      return new NextResponse(csv, {
        headers: {
          ...baseHeaders,
          "Content-Type": "text/csv; charset=utf-8",
        },
      });
    }
    case "fhir_json": {
      const bundle = buildHealthExportFhirBundle(data, parsed.data);
      return new NextResponse(JSON.stringify(bundle, null, 2), {
        headers: {
          ...baseHeaders,
          "Content-Type": "application/fhir+json; charset=utf-8",
        },
      });
    }
    default: {
      const pdf = buildHealthExportPdf(data, parsed.data);
      return new NextResponse(pdf, {
        headers: {
          ...baseHeaders,
          "Content-Type": "application/pdf",
        },
      });
    }
  }
}