"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult } from "@/lib/utils";
import { messageSchema, type MessageInput } from "@/lib/validations/message";

export async function sendMessageAction(payload: MessageInput): Promise<ActionResult> {
  const parsed = messageSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) {
    return { error: { _form: ["Unauthorized"] } };
  }

  let conversationId = parsed.data.conversationId;

  if (!conversationId) {
    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({
        subject: parsed.data.subject,
        category: parsed.data.category,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (conversationError || !conversation) {
      return { error: { _form: [conversationError?.message ?? "Unable to create conversation"] } };
    }

    conversationId = conversation.id;
    await supabase.from("conversation_participants").insert({
      conversation_id: conversationId,
      profile_id: user.id,
    });
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body: parsed.data.body,
  });

  if (error) {
    return { error: { _form: [error.message] } };
  }

  revalidatePath("/messaging");
  revalidatePath("/dashboard");
  return { success: true, message: "Message sent" };
}

