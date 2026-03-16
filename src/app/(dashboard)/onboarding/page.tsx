import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { CompanyOnboardingForm } from "@/src/components/company-onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships } = await supabase
    .from("company_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1);

  if (memberships && memberships.length > 0) {
    redirect("/dashboard");
  }

  return (
    <main className="max-w-2xl mx-auto py-10">
      <div className="rounded-2xl bg-white border p-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Criar primeira empresa
        </h1>
        <p className="mt-2 text-slate-600">
          Vamos começar cadastrando a empresa principal do sistema.
        </p>

        <div className="mt-8">
          <CompanyOnboardingForm />
        </div>
      </div>
    </main>
  );
}