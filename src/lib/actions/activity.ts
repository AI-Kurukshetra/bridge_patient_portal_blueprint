import { createClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type PortalEventInput = {
  actionHref?: string | null;
  detail: string;
  notify?: boolean;
  title: string;
  type?: string;
};

export async function getCurrentUserPatient(supabase: ServerSupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { patientId: null, user: null };
  }

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  return {
    patientId: patient?.id ?? null,
    user,
  };
}

export async function appendPortalEvent(
  supabase: ServerSupabaseClient,
  profileId: string,
  input: PortalEventInput,
) {
  const occurredAt = new Date().toISOString();
  const operations = [
    Promise.resolve(
      supabase.from("recent_activities").insert({
        detail: input.detail,
        occurred_at: occurredAt,
        profile_id: profileId,
        title: input.title,
      }),
    ),
  ];

  if (input.notify ?? true) {
    operations.push(
      Promise.resolve(
        supabase.from("notifications").insert({
          action_href: input.actionHref ?? null,
          body: input.detail,
          profile_id: profileId,
          title: input.title,
          type: input.type ?? "general",
        }),
      ),
    );
  }

  await Promise.allSettled(operations);
}
