import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import {
  Users,
  Plus,
  Search,
  ArrowRight,
  Building2,
  Mail,
  Phone,
} from "lucide-react";

type SearchParams = {
  q?: string;
  status?: string;
};

type ClientesPageProps = {
  searchParams: Promise<SearchParams>;
};

type ClienteRow = {
  id: string;
  company_name: string | null;
  person_name: string | null;
  email_1: string | null;
  phone_1: string | null;
  is_active: boolean | null;
};

export default async function ClientesPage({
  searchParams,
}: ClientesPageProps) {
  const params = await searchParams;
  const q = (params.q || "").trim();
  const status = (params.status || "todos").trim();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

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
            Clientes
          </h1>

          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            Empresa não encontrada para este usuário.
          </p>
        </div>
      </div>
    );
  }

  let query = supabase
    .from("clients")
    .select("*")
    .eq("company_id", membership.company_id)
    .order("created_at", { ascending: false });

  if (status === "ativos") {
    query = query.eq("is_active", true);
  }

  if (status === "inativos") {
    query = query.eq("is_active", false);
  }

  if (q) {
    query = query.or(
      [
        `company_name.ilike.%${q}%`,
        `person_name.ilike.%${q}%`,
        `cnpj.ilike.%${q}%`,
        `cpf.ilike.%${q}%`,
        `email_1.ilike.%${q}%`,
        `email_2.ilike.%${q}%`,
        `phone_1.ilike.%${q}%`,
        `phone_2.ilike.%${q}%`,
        `street.ilike.%${q}%`,
        `district.ilike.%${q}%`,
        `city.ilike.%${q}%`,
        `state.ilike.%${q}%`,
        `responsible_1.ilike.%${q}%`,
        `responsible_2.ilike.%${q}%`,
      ].join(",")
    );
  }

  const { data: clientes, error } = await query;

  const clientesTyped = (clientes ?? []) as ClienteRow[];
  const totalClientes = clientesTyped.length;
  const totalAtivos = clientesTyped.filter((c) => c.is_active !== false).length;
  const totalInativos = clientesTyped.filter((c) => c.is_active === false).length;

  return (
    <div className="space-y-8">
      {/* HERO */}
      <section className="rounded-[30px] border border-slate-200 bg-white px-8 py-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              <Users className="h-4 w-4" />
              Gestão de clientes
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              Clientes
            </h1>

            <p className="mt-3 text-base leading-7 text-slate-600">
              Consulte, pesquise e gerencie a base de clientes cadastrados da
              empresa.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/clientes/novo"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#12325F] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
            >
              <Plus className="h-4 w-4" />
              Novo cliente
            </Link>
          </div>
        </div>
      </section>

      {/* CARDS RESUMO */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Total de clientes"
          value={String(totalClientes)}
          subtitle="Registros encontrados"
          icon={<Building2 className="h-5 w-5" />}
        />

        <SummaryCard
          title="Clientes ativos"
          value={String(totalAtivos)}
          subtitle="Base ativa"
          icon={<Users className="h-5 w-5" />}
        />

        <SummaryCard
          title="Clientes inativos"
          value={String(totalInativos)}
          subtitle="Registros inativos"
          icon={<Users className="h-5 w-5" />}
          valueClassName={totalInativos > 0 ? "text-amber-600" : "text-slate-900"}
        />
      </section>

      {/* FILTRO */}
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
                placeholder="Pesquisar por nome, CNPJ, CPF, email, telefone, endereço..."
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

      {/* TABELA */}
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Lista de clientes
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Visualize os principais dados e acesse as ações disponíveis.
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
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold">Contato</th>
                <th className="px-4 py-3 font-semibold">Telefone</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>

            <tbody>
              {!error && clientesTyped.length > 0 ? (
                clientesTyped.map((cliente) => {
                  const nome = cliente.company_name || cliente.person_name || "-";
                  const ativo = cliente.is_active !== false;

                  return (
                    <tr
                      key={cliente.id}
                      className="border-t border-slate-100 transition hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                            <Building2 className="h-4 w-4" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {nome}
                            </p>
                            <p className="text-xs text-slate-500">
                              Cadastro de cliente
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="inline-flex items-center gap-2 text-slate-600">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <span>{cliente.email_1 || "-"}</span>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="inline-flex items-center gap-2 text-slate-600">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <span>{cliente.phone_1 || "-"}</span>
                        </div>
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
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/clientes/${cliente.id}`}
                            className="inline-flex items-center rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                          >
                            Abrir
                          </Link>

                          <Link
                            href={`/clientes/${cliente.id}/editar`}
                            className="inline-flex items-center rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
                          >
                            Editar
                          </Link>

                          <form
                            action={`/clientes/${cliente.id}/excluir`}
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
                      ? "Erro ao carregar clientes."
                      : "Nenhum cliente encontrado."}
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