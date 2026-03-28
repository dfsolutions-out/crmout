import { redirect } from "next/navigation";

import { createClient } from "@/src/lib/supabase/server";
import FinanceiroForm from "@/src/components/financeiro/financeiro-form";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type FinancialEntryRow = {
  id: string;
  type: "PAGAR" | "RECEBER";
  description: string;
  category: string | null;
  amount: number | string;
  due_date: string;
  status: "PENDENTE" | "PAGO" | "VENCIDO";
  paid_at: string | null;
  notes: string | null;
};

export default async function EditarLancamentoFinanceiroPage({
  params,
}: PageProps) {
  const { id } = await params;

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

  const { data, error } = await supabase
    .from("financial_entries")
    .select("id, type, description, category, amount, due_date, status, paid_at, notes")
    .eq("company_id", membership.company_id)
    .eq("id", id)
    .single();

  if (error || !data) {
    redirect("/financeiro");
  }

  const entry = data as FinancialEntryRow;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Editar lançamento financeiro
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Atualize os dados do lançamento selecionado.
        </p>
      </div>

      <FinanceiroForm
        mode="edit"
        entry={{
          id: entry.id,
          type: entry.type,
          description: entry.description,
          category: entry.category || "",
          amount: typeof entry.amount === "number" ? entry.amount : Number(entry.amount || 0),
          due_date: entry.due_date,
          status: entry.status,
          paid_at: entry.paid_at,
          notes: entry.notes || "",
        }}
      />
    </div>
  );
}