import { redirect } from "next/navigation";
import { MfaChallengeCard } from "@/components/auth/mfa-challenge-card";
import { createClient } from "@/lib/supabase/server";

export default async function MfaPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-12">
      <MfaChallengeCard />
    </main>
  );
}
