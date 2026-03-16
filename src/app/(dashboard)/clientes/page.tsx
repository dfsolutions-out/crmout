import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";

type SearchParams = {
  q?: string;
  status?: string;
};

type ClientesPageProps = {
  searchParams: Promise<SearchParams>;
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
        <h1 className="text-3xl font-bold">Clientes</h1>
        <div className="bg-white border rounded-xl p-6">
          <p className="text-red-600">Empresa não encontrada para este usuário.</p>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold">Clientes</h1>

        <Link
          href="/clientes/novo"
          className="bg-slate-900 text-white px-5 py-3 rounded-xl"
        >
          Novo Cliente
        </Link>
      </div>

      <form className="bg-white border rounded-2xl p-4 grid gap-4 md:grid-cols-[1fr_220px_140px]">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Pesquisar por nome, CNPJ, CPF, email, telefone, endereço..."
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
              <th>Email</th>
              <th>Telefone</th>
              <th>Status</th>
              <th className="w-[220px]">Ações</th>
            </tr>
          </thead>

          <tbody>
            {!error && clientes && clientes.length > 0 ? (
              clientes.map((cliente) => (
                <tr key={cliente.id} className="border-b last:border-b-0">
                  <td className="p-4">
                    {cliente.company_name || cliente.person_name || "-"}
                  </td>
                  <td>{cliente.email_1 || "-"}</td>
                  <td>{cliente.phone_1 || "-"}</td>
                  <td>{cliente.is_active ? "Ativo" : "Inativo"}</td>
                  <td>
                    <div className="flex gap-3">
                      <Link
                        href={`/clientes/${cliente.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        Abrir
                      </Link>

                      <Link
                        href={`/clientes/${cliente.id}/editar`}
                        className="text-amber-600 hover:underline"
                      >
                        Editar
                      </Link>

                      <form action={`/clientes/${cliente.id}/excluir`} method="post">
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
                  {error ? "Erro ao carregar clientes." : "Nenhum cliente encontrado."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}