import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, ReceiptText } from "lucide-react";

import { createClient } from "@/src/lib/supabase/server";

type CompanyMemberRow = {
  company_id: string;
};

type EmployeeRow = {
  id: string;
  name: string;
  is_active: boolean | null;
};

export default async function ContrachequesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: member, error: memberError } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id)
    .single<CompanyMemberRow>();

  if (memberError || !member?.company_id) {
    redirect("/login");
  }

  const { data: employees } = await supabase
    .from("employees")
    .select("id, name, is_active")
    .eq("company_id", member.company_id)
    .order("name", { ascending: true })
    .returns<EmployeeRow[]>();

  const activeEmployees = (employees ?? []).filter((emp) => emp.is_active !== false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-slate-600">
            <ReceiptText className="h-4 w-4" />
            Módulo de Contracheques
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Contracheques
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            Gere contracheques manualmente e imprima em formato A4.
          </p>
        </div>

        <Link
          href="/contracheques/novo"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Novo contracheque
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Funcionários ativos</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {activeEmployees.length}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Status do módulo</p>
          <p className="mt-2 text-lg font-semibold text-emerald-600">
            Estrutura inicial pronta
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Próxima evolução</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            Salvar histórico no banco
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            Estrutura inicial
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Nesta etapa, o contracheque é gerado manualmente e impresso na hora.
          </p>
        </div>

        <div className="p-6">
          {activeEmployees.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="text-sm text-slate-600">
                Nenhum funcionário ativo encontrado para gerar contracheque.
              </p>
              <Link
                href="/funcionarios"
                className="mt-4 inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Ir para funcionários
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Funcionário
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activeEmployees.map((employee) => (
                    <tr key={employee.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {employee.name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          Ativo
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/contracheques/novo?employeeId=${employee.id}`}
                          className="inline-flex items-center rounded-xl border px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Gerar contracheque
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}