import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Wallet, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

import { createClient } from "@/src/lib/supabase/server";
import FinanceiroTableActions from "@/src/components/financeiro/financeiro-table-actions";

type SearchParams = {
  status?: string;
  type?: string;
  q?: string;
};

type FinanceiroPageProps = {
  searchParams: Promise<SearchParams>;
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
  created_at: string;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(date: string | null) {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
}

function normalizeAmount(value: number | string) {
  return typeof value === "number" ? value : Number(value || 0);
}

function getEffectiveStatus(
  status: "PENDENTE" | "PAGO" | "VENCIDO",
  dueDate: string
): "PENDENTE" | "PAGO" | "VENCIDO" {
  if (status === "PAGO") return "PAGO";

  const today = new Date();
  const due = new Date(`${dueDate}T23:59:59`);

  if (due < today) return "VENCIDO";
  return "PENDENTE";
}

export default async function FinanceiroPage({
  searchParams,
}: FinanceiroPageProps) {
  const params = await searchParams;
  const status = params.status || "TODOS";
  const type = params.type || "TODOS";
  const q = params.q || "";

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

  let query = supabase
    .from("financial_entries")
    .select(
      "id, type, description, category, amount, due_date, status, paid_at, notes, created_at"
    )
    .eq("company_id", membership.company_id)
    .order("due_date", { ascending: true })
    .order("created_at", { ascending: false });

  if (type !== "TODOS") {
    query = query.eq("type", type);
  }

  if (status !== "TODOS") {
    query = query.eq("status", status);
  }

  if (q.trim()) {
    query = query.or(
      `description.ilike.%${q.trim()}%,category.ilike.%${q.trim()}%`
    );
  }

  const { data, error } = await query;

  const entries = (data ?? []) as FinancialEntryRow[];

  const enrichedEntries = entries.map((entry) => ({
    ...entry,
    effectiveStatus: getEffectiveStatus(entry.status, entry.due_date),
    amountNumber: normalizeAmount(entry.amount),
  }));

  // Totais dos cards:
  // PAGAR e RECEBER agora consideram apenas o que ainda está em aberto.
  const totalPagar = enrichedEntries
    .filter(
      (item) =>
        item.type === "PAGAR" &&
        item.effectiveStatus !== "PAGO"
    )
    .reduce((acc, item) => acc + item.amountNumber, 0);

  const totalReceber = enrichedEntries
    .filter(
      (item) =>
        item.type === "RECEBER" &&
        item.effectiveStatus !== "PAGO"
    )
    .reduce((acc, item) => acc + item.amountNumber, 0);

  const totalPendente = enrichedEntries
    .filter((item) => item.effectiveStatus === "PENDENTE")
    .reduce((acc, item) => acc + item.amountNumber, 0);

  const totalVencido = enrichedEntries
    .filter((item) => item.effectiveStatus === "VENCIDO")
    .reduce((acc, item) => acc + item.amountNumber, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-slate-600">
            <Wallet className="h-4 w-4" />
            Módulo Financeiro
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Financeiro
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            Controle contas a pagar e a receber da empresa.
          </p>
        </div>

        <Link
          href="/financeiro/novo"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Novo lançamento
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ArrowDownCircle className="h-4 w-4" />
            Contas a pagar
          </div>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {formatMoney(totalPagar)}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ArrowUpCircle className="h-4 w-4" />
            Contas a receber
          </div>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {formatMoney(totalReceber)}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pendentes</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {formatMoney(totalPendente)}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Vencidos</p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {formatMoney(totalVencido)}
          </p>
        </div>
      </div>

      <form className="grid gap-4 rounded-2xl border bg-white p-4 md:grid-cols-[1.3fr_220px_220px_160px]">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Buscar
          </label>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Pesquisar por descrição ou categoria..."
            className="w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Tipo
          </label>
          <select
            name="type"
            defaultValue={type}
            className="w-full rounded-xl border px-4 py-3"
          >
            <option value="TODOS">Todos</option>
            <option value="PAGAR">Pagar</option>
            <option value="RECEBER">Receber</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Status
          </label>
          <select
            name="status"
            defaultValue={status}
            className="w-full rounded-xl border px-4 py-3"
          >
            <option value="TODOS">Todos</option>
            <option value="PENDENTE">Pendente</option>
            <option value="PAGO">Pago</option>
            <option value="VENCIDO">Vencido</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            Filtrar
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b bg-slate-50 px-4 py-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Lançamentos financeiros
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b bg-slate-50 text-left text-sm text-slate-600">
              <tr>
                <th className="p-4">Tipo</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th>Pagamento</th>
                <th className="w-[250px]">Ações</th>
              </tr>
            </thead>

            <tbody>
              {!error && enrichedEntries.length > 0 ? (
                enrichedEntries.map((entry) => (
                  <tr key={entry.id} className="border-b last:border-b-0">
                    <td className="p-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          entry.type === "PAGAR"
                            ? "bg-red-50 text-red-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {entry.type}
                      </span>
                    </td>

                    <td className="font-medium text-slate-900">
                      {entry.description}
                    </td>

                    <td>{entry.category || "-"}</td>

                    <td className="font-medium">
                      {formatMoney(entry.amountNumber)}
                    </td>

                    <td>{formatDate(entry.due_date)}</td>

                    <td>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          entry.effectiveStatus === "PAGO"
                            ? "bg-emerald-50 text-emerald-700"
                            : entry.effectiveStatus === "VENCIDO"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {entry.effectiveStatus}
                      </span>
                    </td>

                    <td>
                      {entry.paid_at
                        ? formatDate(entry.paid_at.slice(0, 10))
                        : "-"}
                    </td>

                    <td className="py-4 pr-4">
                      <FinanceiroTableActions
                        id={entry.id}
                        status={entry.status}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    {error
                      ? "Erro ao carregar lançamentos."
                      : "Nenhum lançamento encontrado."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}