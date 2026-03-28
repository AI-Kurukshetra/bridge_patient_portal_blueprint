"use server";

import { revalidatePath } from "next/cache";
import { appendPortalEvent, getCurrentUserPatient } from "@/lib/actions/activity";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult } from "@/lib/utils";
import { documentSchema, type DocumentInput } from "@/lib/validations/document";

export async function createDocumentAction(payload: DocumentInput): Promise<ActionResult> {
  const parsed = documentSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { patientId, user } = await getCurrentUserPatient(supabase);
  if (!user) {
    return { error: { _form: ["Unauthorized"] } };
  }

  if (!patientId) {
    return { error: { _form: ["Patient record not found"] } };
  }

  const { error } = await supabase.from("documents").insert({
    category: parsed.data.category,
    file_size: parsed.data.fileSize ?? null,
    mime_type: parsed.data.mimeType || null,
    patient_id: patientId,
    storage_path: parsed.data.storagePath,
    title: parsed.data.title,
    uploaded_by: user.id,
  });

  if (error) {
    return { error: { _form: [error.message] } };
  }

  await appendPortalEvent(supabase, user.id, {
    actionHref: "/documents",
    detail: `${parsed.data.title} was uploaded to your secure records vault.`,
    title: "Document uploaded",
    type: "document",
  });

  revalidatePath("/documents");
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  return { success: true, message: "Document uploaded" };
}
