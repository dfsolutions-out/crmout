import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import {
  Users,
  Plus,
  Search,
  ArrowRight,
  UserSquare2,
  ClipboardList,
  ShieldCheck,
  
} from "lucide-react";

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
        <div className="rounded-[28px] border border-red-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Funcionários
          </h1>

          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
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
      ].join(","),
    );
  }

  const { data: funcionarios, error } = await query;
  const funcionariosTyped = (funcionarios ?? []) as EmployeeRow[];

  const totalFuncionarios = funcionariosTyped.length;
  const totalAtivos = funcionariosTyped.filter((f) => f.is_active !== false).length;
  const totalInativos = funcionariosTyped.filter((f) => f.is_active === false).length;

  return (
    <div className="space-y-8">
      <section className="rounded-[30px] border border-slate-200 bg-white px-8 py-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              <Users className="h-4 w-4" />
              Gestão de funcionários
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              Funcionários
            </h1>

            <p className="mt-3 text-base leading-7 text-slate-600">
              Gerencie a equipe, acompanhe o status dos cadastros e acesse ações
              operacionais rapidamente.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/folha-ponto"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ClipboardList className="h-4 w-4" />
              Folha de ponto
            </Link>

            <Link
              href="/funcionarios/novo"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#12325F] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
            >
              <Plus className="h-4 w-4" />
              Novo funcionário
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Total de funcionários"
          value={String(totalFuncionarios)}
          subtitle="Registros encontrados"
          icon={<UserSquare2 className="h-5 w-5" />}
        />

        <SummaryCard
          title="Funcionários ativos"
          value={String(totalAtivos)}
          subtitle="Equipe em atividade"
          icon={<ShieldCheck className="h-5 w-5" />}
        />

        <SummaryCard
          title="Funcionários inativos"
          value={String(totalInativos)}
          subtitle="Cadastros inativos"
          icon={<Users className="h-5 w-5" />}
          valueClassName={totalInativos > 0 ? "text-amber-600" : "text-slate-900"}
        />
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <form className="grid gap-4 xl:grid-cols-[1.4fr_220px_160px]">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Buscar
            </label>

            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Pesquisar por nome, CPF, RG, email, telefone, função, local..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Status
            </label>

            <select
              name="status"
              defaultValue={status}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            >
              <option value="todos">Todos</option>
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#12325F] px-4 py-3.5 text-sm font-semibold text-white transition hover:opacity-95"
            >
              Buscar
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Lista de funcionários
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Visualize os principais dados e acesse as ações operacionais.
            </p>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80">
              <tr className="text-left text-slate-600">
                <th className="px-4 py-3 font-semibold">Funcionário</th>
                <th className="px-4 py-3 font-semibold">CPF</th>
                <th className="px-4 py-3 font-semibold">Função</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>

            <tbody>
              {!error && funcionariosTyped.length > 0 ? (
                funcionariosTyped.map((funcionario) => {
                  const ativo = funcionario.is_active !== false;

                  return (
                    <tr
                      key={funcionario.id}
                      className="border-t border-slate-100 transition hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                            <UserSquare2 className="h-4 w-4" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {funcionario.full_name || "-"}
                            </p>
                            <p className="text-xs text-slate-500">
                              Cadastro de funcionário
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {funcionario.cpf || "-"}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {funcionario.job_title || "-"}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            ativo
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link
                            href={`/funcionarios/${funcionario.id}`}
                            className="inline-flex items-center rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                          >
                            Abrir
                          </Link>

                          <Link
                            href={`/funcionarios/${funcionario.id}/editar`}
                            className="inline-flex items-center rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
                          >
                            Editar
                          </Link>

                          <Link
                            href={`/funcionarios/${funcionario.id}/entregas`}
                            className="inline-flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                          >
                            Entregas
                          </Link>

                          <Link
                            href={`/funcionarios/${funcionario.id}/entregas/nova`}
                            className="inline-flex items-center rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-100"
                          >
                            Nova entrega
                          </Link>

                          <form
                            action={`/funcionarios/${funcionario.id}/excluir`}
                            method="post"
                          >
                            <button
                              type="submit"
                              className="inline-flex items-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                            >
                              Excluir
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    {error
                      ? "Erro ao carregar funcionários."
                      : "Nenhum funcionário encontrado."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  valueClassName,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p
            className={`mt-3 text-4xl font-semibold tracking-tight text-slate-900 ${
              valueClassName || ""
            }`}
          >
            {value}
          </p>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-700">
          {icon}
        </div>
      </div>
    </div>
  );
}