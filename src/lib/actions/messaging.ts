"use server";

import { revalidatePath } from "next/cache";
import { appendPortalEvent } from "@/lib/actions/activity";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult } from "@/lib/utils";
import { messageSchema, type MessageInput } from "@/lib/validations/message";

export async function sendMessageAction(payload: MessageInput): Promise<ActionResult> {
  const parsed = messageSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: { _form: ["Unauthorized"] } };
  }

  let conversationId = parsed.data.conversationId;

  if (!conversationId) {
    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({
        category: parsed.data.category,
        created_by: user.id,
        subject: parsed.data.subject,
      })
      .select("id")
      .single();

    if (conversationError || !conversation) {
      return { error: { _form: [conversationError?.message ?? "Unable to create conversation"] } };
    }

    conversationId = conversation.id;
  } else {
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .single();

    if (!conversation) {
      return { error: { _form: ["Conversation not found"] } };
    }
  }

  const { data: participant } = await supabase
    .from("conversation_participants")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!participant) {
    const { error: participantError } = await supabase.from("conversation_participants").insert({
      conversation_id: conversationId,
      profile_id: user.id,
    });

    if (participantError) {
      return { error: { _form: [participantError.message] } };
    }
  }

  const { error } = await supabase.from("messages").insert({
    body: parsed.data.body,
    conversation_id: conversationId,
    sender_id: user.id,
  });

  if (error) {
    return { error: { _form: [error.message] } };
  }

  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  await appendPortalEvent(supabase, user.id, {
    actionHref: "/messaging",
    detail: parsed.data.conversationId
      ? `You replied to ${parsed.data.subject}.`
      : `A new ${parsed.data.category.replaceAll("_", " ")} conversation was started.`,
    title: parsed.data.conversationId ? "Message reply sent" : "Secure message sent",
    type: "message",
  });

  revalidatePath("/messaging");
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  return { success: true, message: parsed.data.conversationId ? "Reply sent" : "Message sent" };
}
