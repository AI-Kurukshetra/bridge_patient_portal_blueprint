"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult } from "@/lib/utils";
import { documentSchema, type DocumentInput } from "@/lib/validations/document";

export async function createDocumentAction(payload: DocumentInput): Promise<ActionResult> {
  const parsed = documentSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) {
    return { error: { _form: ["Unauthorized"] } };
  }

  const { data: patient } = await supabase.from("patients").select("id").eq("profile_id", user.id).single();
  if (!patient) {
    return { error: { _form: ["Patient record not found"] } };
  }

  const { error } = await supabase.from("documents").insert({
    patient_id: patient.id,
    uploaded_by: user.id,
    title: parsed.data.title,
    category: parsed.data.category,
    mime_type: parsed.data.mimeType || null,
    file_size: parsed.data.fileSize ?? null,
  });

  if (error) {
    return { error: { _form: [error.message] } };
  }

  revalidatePath("/documents");
  return { success: true, message: "Document metadata saved" };
}

