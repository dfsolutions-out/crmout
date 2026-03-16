import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";

type SearchParams = {
  q?: string;
  status?: string;
};

type FuncionariosPageProps = {
  searchParams: Promise<SearchParams>;
};

type EmployeeRow = {
  id: string;
  full_name: string | null;
  cpf: string | null;
  job_title: string | null;
  is_active: boolean | null;
};

export default async function FuncionariosPage({
  searchParams,
}: FuncionariosPageProps) {
  const params = await searchParams;
  const q = (params.q || "").trim();
  const status = (params.status || "todos").trim();

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
        <h1 className="text-3xl font-bold">Funcionários</h1>
        <div className="bg-white border rounded-xl p-6">
          <p className="text-red-600">
            Empresa não encontrada para este usuário.
          </p>
        </div>
      </div>
    );
  }

  let query = supabase
    .from("employees")
    .select("*")
    .eq("company_id", membership.company_id)
    .order("created_at", { ascending: false });

  if (status === "ativos") query = query.eq("is_active", true);
  if (status === "inativos") query = query.eq("is_active", false);

  if (q) {
    query = query.or(
      [
        `full_name.ilike.%${q}%`,
        `cpf.ilike.%${q}%`,
        `rg.ilike.%${q}%`,
        `email.ilike.%${q}%`,
        `phone_1.ilike.%${q}%`,
        `phone_2.ilike.%${q}%`,
        `job_title.ilike.%${q}%`,
        `workplace.ilike.%${q}%`,
        `city.ilike.%${q}%`,
        `state.ilike.%${q}%`,
      ].join(",")
    );
  }

  const { data: funcionarios, error } = await query;

  const funcionariosTyped = (funcionarios ?? []) as EmployeeRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold">Funcionários</h1>

        <Link
          href="/funcionarios/novo"
          className="bg-slate-900 text-white px-5 py-3 rounded-xl"
        >
          Novo Funcionário
        </Link>
      </div>

      <form className="bg-white border rounded-2xl p-4 grid gap-4 md:grid-cols-[1fr_220px_140px]">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Pesquisar por nome, CPF, RG, email, telefone, função, local..."
          className="w-full border rounded-xl px-4 py-3"
        />

        <select
          name="status"
          defaultValue={status}
          className="w-full border rounded-xl px-4 py-3"
        >
          <option value="todos">Todos</option>
          <option value="ativos">Ativos</option>
          <option value="inativos">Inativos</option>
        </select>

        <button
          type="submit"
          className="bg-slate-900 text-white rounded-xl px-4 py-3"
        >
          Buscar
        </button>
      </form>

      <div className="bg-white border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="border-b bg-slate-50">
            <tr className="text-left text-sm text-slate-600">
              <th className="p-4">Nome</th>
              <th>CPF</th>
              <th>Função</th>
              <th>Status</th>
              <th className="w-[420px]">Ações</th>
            </tr>
          </thead>

          <tbody>
            {!error && funcionariosTyped.length > 0 ? (
              funcionariosTyped.map((funcionario) => (
                <tr key={funcionario.id} className="border-b last:border-b-0">
                  <td className="p-4">{funcionario.full_name || "-"}</td>
                  <td>{funcionario.cpf || "-"}</td>
                  <td>{funcionario.job_title || "-"}</td>
                  <td>{funcionario.is_active ? "Ativo" : "Inativo"}</td>
                  <td className="py-4 pr-4">
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/funcionarios/${funcionario.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        Abrir
                      </Link>

                      <Link
                        href={`/funcionarios/${funcionario.id}/editar`}
                        className="text-amber-600 hover:underline"
                      >
                        Editar
                      </Link>

                      <Link
                        href={`/funcionarios/${funcionario.id}/entregas`}
                        className="text-emerald-600 hover:underline"
                      >
                        Entregas
                      </Link>

                      <Link
                        href={`/funcionarios/${funcionario.id}/entregas/nova`}
                        className="text-violet-600 hover:underline"
                      >
                        Nova entrega
                      </Link>

                      <form
                        action={`/funcionarios/${funcionario.id}/excluir`}
                        method="post"
                      >
                        <button
                          type="submit"
                          className="text-red-600 hover:underline"
                        >
                          Excluir
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500">
                  {error
                    ? "Erro ao carregar funcionários."
                    : "Nenhum funcionário encontrado."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}