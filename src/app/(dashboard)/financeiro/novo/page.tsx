import { redirect } from "next/navigation";

import { createClient } from "@/src/lib/supabase/server";
import FinanceiroForm from "@/src/components/financeiro/financeiro-form";

export default async function NovoLancamentoFinanceiroPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (membershipError || !membership?.company_id) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Novo lançamento financeiro
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Cadastre contas a pagar e a receber da empresa.
        </p>
      </div>

      <FinanceiroForm mode="create" />
    </div>
  );
}