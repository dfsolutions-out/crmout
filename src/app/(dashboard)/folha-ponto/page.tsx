import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";

type SearchParams = {
  month?: string;
  year?: string;
};

type FolhaPontoPageProps = {
  searchParams: Promise<SearchParams>;
};

type EmployeeRow = {
  id: string;
  full_name: string | null;
  cpf: string | null;
  job_title: string | null;
  is_active: boolean | null;
};

function getCurrentMonth() {
  return String(new Date().getMonth() + 1).padStart(2, "0");
}

function getCurrentYear() {
  return String(new Date().getFullYear());
}

export default async function FolhaPontoPage({
  searchParams,
}: FolhaPontoPageProps) {
  const params = await searchParams;
  const month = params.month || getCurrentMonth();
  const year = params.year || getCurrentYear();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership, error: membershipError } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (membershipError || !membership) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Folha de Ponto</h1>
        <div className="rounded-2xl border bg-white p-6">
          <p className="text-red-600">
            Empresa não encontrada para este usuário.
          </p>
        </div>
      </div>
    );
  }

  const { data: employees, error } = await supabase
    .from("employees")
    .select("id, full_name, cpf, job_title, is_active")
    .eq("company_id", membership.company_id)
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  const employeesTyped = (employees ?? []) as EmployeeRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Folha de Ponto</h1>
          <p className="mt-1 text-slate-600">
            Gere folhas individuais ou de todos os funcionários ativos para
            impressão.
          </p>
        </div>

        <Link
          href="/funcionarios"
          className="rounded-xl border px-5 py-3 text-sm font-medium hover:bg-slate-50"
        >
          Voltar para Funcionários
        </Link>
      </div>

      <form className="grid gap-4 rounded-2xl border bg-white p-4 md:grid-cols-[180px_180px_1fr]">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Mês
          </label>
          <select
            name="month"
            defaultValue={month}
            className="w-full rounded-xl border px-4 py-3"
          >
            <option value="01">Janeiro</option>
            <option value="02">Fevereiro</option>
            <option value="03">Março</option>
            <option value="04">Abril</option>
            <option value="05">Maio</option>
            <option value="06">Junho</option>
            <option value="07">Julho</option>
            <option value="08">Agosto</option>
            <option value="09">Setembro</option>
            <option value="10">Outubro</option>
            <option value="11">Novembro</option>
            <option value="12">Dezembro</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Ano
          </label>
          <input
            type="number"
            name="year"
            defaultValue={year}
            className="w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            Atualizar período
          </button>
        </div>
      </form>

      <div className="rounded-2xl border bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Geração em lote</h2>
            <p className="text-sm text-slate-600">
              Gera uma folha por página para todos os funcionários ativos.
            </p>
          </div>

          <Link
            href={`/folha-ponto/imprimir/lote?month=${month}&year=${year}`}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            Gerar todas as folhas
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="border-b bg-slate-50 px-4 py-3">
          <h2 className="text-xl font-semibold">Folha individual</h2>
        </div>

        <table className="w-full">
          <thead className="border-b bg-slate-50 text-left text-sm text-slate-600">
            <tr>
              <th className="p-4">Funcionário</th>
              <th>CPF</th>
              <th>Função</th>
              <th className="w-[220px]">Ação</th>
            </tr>
          </thead>

          <tbody>
            {!error && employeesTyped.length > 0 ? (
              employeesTyped.map((employee) => (
                <tr key={employee.id} className="border-b last:border-b-0">
                  <td className="p-4">{employee.full_name || "-"}</td>
                  <td>{employee.cpf || "-"}</td>
                  <td>{employee.job_title || "-"}</td>
                  <td className="py-4 pr-4">
                    <Link
                      href={`/folha-ponto/imprimir/${employee.id}?month=${month}&year=${year}`}
                      className="text-blue-600 hover:underline"
                    >
                      Gerar folha
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-500">
                  {error
                    ? "Erro ao carregar funcionários."
                    : "Nenhum funcionário ativo encontrado."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}