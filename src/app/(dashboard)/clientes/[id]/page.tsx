import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";

type ClientePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ClientePage({ params }: ClientePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Cliente</h1>
        <div className="bg-white border rounded-xl p-6">
          <p className="text-red-600">Usuário não autenticado.</p>
        </div>
      </div>
    );
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
        <h1 className="text-3xl font-bold">Cliente</h1>
        <div className="bg-white border rounded-xl p-6">
          <p className="text-red-600">Empresa do usuário não encontrada.</p>
        </div>
      </div>
    );
  }

  const { data: cliente, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("company_id", membership.company_id)
    .single();

  if (error || !cliente) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Cliente</h1>
          <Link href="/clientes" className="border px-4 py-2 rounded-xl">
            Voltar
          </Link>
        </div>

        <div className="bg-white border rounded-xl p-6">
          <p className="text-red-600">
            Não foi possível carregar o cliente.
          </p>
        </div>
      </div>
    );
  }

  const nomeExibicao = cliente.company_name || cliente.person_name || "-";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold">Cliente</h1>

        <div className="flex gap-3">
          <Link
            href={`/clientes/${cliente.id}/editar`}
            className="bg-amber-500 text-white px-4 py-2 rounded-xl"
          >
            Editar
          </Link>

          <form action={`/clientes/${cliente.id}/excluir`} method="post">
            <button
              type="submit"
              className="bg-red-600 text-white px-4 py-2 rounded-xl"
            >
              Excluir
            </button>
          </form>

          <Link href="/clientes" className="border px-4 py-2 rounded-xl">
            Voltar
          </Link>
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Identificação</h2>
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <p><b>Tipo:</b> {cliente.type || "-"}</p>
            <p><b>Status:</b> {cliente.is_active ? "Ativo" : "Inativo"}</p>
            <p><b>Nome:</b> {nomeExibicao}</p>
            <p><b>Contato:</b> {cliente.person_name || "-"}</p>
            <p><b>CNPJ:</b> {cliente.cnpj || "-"}</p>
            <p><b>CPF:</b> {cliente.cpf || "-"}</p>
            <p><b>Responsável 1:</b> {cliente.responsible_1 || "-"}</p>
            <p><b>Responsável 2:</b> {cliente.responsible_2 || "-"}</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Contato</h2>
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <p><b>Email 1:</b> {cliente.email_1 || "-"}</p>
            <p><b>Email 2:</b> {cliente.email_2 || "-"}</p>
            <p><b>Telefone 1:</b> {cliente.phone_1 || "-"}</p>
            <p><b>Telefone 2:</b> {cliente.phone_2 || "-"}</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Endereço</h2>
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <p><b>CEP:</b> {cliente.zip_code || "-"}</p>
            <p><b>Logradouro:</b> {cliente.street || "-"}</p>
            <p><b>Número:</b> {cliente.number || "-"}</p>
            <p><b>Complemento:</b> {cliente.complement || "-"}</p>
            <p><b>Bairro:</b> {cliente.district || "-"}</p>
            <p><b>Cidade:</b> {cliente.city || "-"}</p>
            <p><b>Estado:</b> {cliente.state || "-"}</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Cadastro e credenciais</h2>
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <p>
              <b>Data da inclusão:</b>{" "}
              {cliente.registration_date
                ? new Date(cliente.registration_date).toLocaleDateString("pt-BR")
                : "-"}
            </p>
            <p><b>Senha boa:</b> {cliente.password_main || "-"}</p>
            <p><b>Contra-senha:</b> {cliente.password_counter || "-"}</p>
            <p><b>Senha pânico:</b> {cliente.password_panic || "-"}</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Observações</h2>
          <div className="mt-4 border rounded-xl p-4 min-h-24">
            {cliente.observations || "-"}
          </div>
        </div>
      </div>
    </div>
  );
}