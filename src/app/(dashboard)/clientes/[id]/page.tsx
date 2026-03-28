import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import {
  Building2,
  Mail,
  MapPin,
  Shield,
  FileText,
  ArrowLeft,
  FilePenLine,
  Trash2,
  UserCircle2,
} from "lucide-react";

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
        <div className="rounded-[28px] border border-red-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Cliente
          </h1>

          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            Usuário não autenticado.
          </p>
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
        <div className="rounded-[28px] border border-red-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Cliente
          </h1>

          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            Empresa do usuário não encontrada.
          </p>
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
        <section className="rounded-[30px] border border-slate-200 bg-white px-8 py-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
                Cliente
              </h1>
              <p className="mt-3 text-base text-slate-600">
                Visualização do cadastro do cliente.
              </p>
            </div>

            <Link
              href="/clientes"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </div>
        </section>

        <div className="rounded-[28px] border border-red-200 bg-white p-8 shadow-sm">
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            Não foi possível carregar o cliente.
          </p>
        </div>
      </div>
    );
  }

  const nomeExibicao = cliente.company_name || cliente.person_name || "-";
  const statusAtivo = cliente.is_active !== false;

  return (
    <div className="space-y-8">
      {/* TOPO */}
      <section className="rounded-[30px] border border-slate-200 bg-white px-8 py-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              <Building2 className="h-4 w-4" />
              Cadastro do cliente
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              {nomeExibicao}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  statusAtivo
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {statusAtivo ? "Ativo" : "Inativo"}
              </span>

              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {cliente.type || "-"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/clientes/${cliente.id}/editar`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
            >
              <FilePenLine className="h-4 w-4" />
              Editar
            </Link>

            <form action={`/clientes/${cliente.id}/excluir`} method="post">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </button>
            </form>

            <Link
              href="/clientes"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </div>
        </div>
      </section>

      {/* IDENTIFICAÇÃO */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Identificação"
          description="Informações principais do cadastro e responsáveis."
          icon={<UserCircle2 className="h-5 w-5" />}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InfoItem label="Tipo" value={cliente.type || "-"} />
          <InfoItem label="Status" value={statusAtivo ? "Ativo" : "Inativo"} />
          <InfoItem label="Nome" value={nomeExibicao} />
          <InfoItem label="Contato" value={cliente.person_name || "-"} />
          <InfoItem label="CNPJ" value={cliente.cnpj || "-"} />
          <InfoItem label="CPF" value={cliente.cpf || "-"} />
          <InfoItem label="Responsável 1" value={cliente.responsible_1 || "-"} />
          <InfoItem label="Responsável 2" value={cliente.responsible_2 || "-"} />
        </div>
      </section>

      {/* CONTATO */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Contato"
          description="Emails e telefones cadastrados."
          icon={<Mail className="h-5 w-5" />}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InfoItem label="Email 1" value={cliente.email_1 || "-"} />
          <InfoItem label="Email 2" value={cliente.email_2 || "-"} />
          <InfoItem label="Telefone 1" value={cliente.phone_1 || "-"} />
          <InfoItem label="Telefone 2" value={cliente.phone_2 || "-"} />
        </div>
      </section>

      {/* ENDEREÇO */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Endereço"
          description="Informações completas de localização."
          icon={<MapPin className="h-5 w-5" />}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InfoItem label="CEP" value={cliente.zip_code || "-"} />
          <InfoItem label="Logradouro" value={cliente.street || "-"} />
          <InfoItem label="Número" value={cliente.number || "-"} />
          <InfoItem label="Complemento" value={cliente.complement || "-"} />
          <InfoItem label="Bairro" value={cliente.district || "-"} />
          <InfoItem label="Cidade" value={cliente.city || "-"} />
          <InfoItem label="Estado" value={cliente.state || "-"} />
        </div>
      </section>

      {/* CADASTRO E CREDENCIAIS */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Cadastro e credenciais"
          description="Data de inclusão e dados adicionais do cliente."
          icon={<Shield className="h-5 w-5" />}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InfoItem
            label="Data da inclusão"
            value={
              cliente.registration_date
                ? new Date(cliente.registration_date).toLocaleDateString("pt-BR")
                : "-"
            }
          />
          <InfoItem label="Senha boa" value={cliente.password_main || "-"} />
          <InfoItem label="Contra-senha" value={cliente.password_counter || "-"} />
          <InfoItem label="Senha pânico" value={cliente.password_panic || "-"} />
        </div>
      </section>

      {/* OBSERVAÇÕES */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Observações"
          description="Notas e observações registradas no cadastro."
          icon={<FileText className="h-5 w-5" />}
        />

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700 min-h-28">
          {cliente.observations || "-"}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
        {icon}
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-900 break-words">
        {value}
      </p>
    </div>
  );
}