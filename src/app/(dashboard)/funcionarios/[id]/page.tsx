import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import {
  ArrowLeft,
  FilePenLine,
  Trash2,
  UserCircle2,
  MapPin,
  BriefcaseBusiness,
  Wallet,
  FolderOpen,
  FileText,
  Shield,
} from "lucide-react";

type FuncionarioPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type EmployeeNoteRow = {
  id: string;
  note_text: string | null;
  created_at: string | null;
};

type EmployeeDocumentRow = {
  id: string;
  file_name: string | null;
  file_path: string | null;
  created_at: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("pt-BR");
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR");
}

function money(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return "-";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);
}

function text(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

export default async function FuncionarioPage({
  params,
}: FuncionarioPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="rounded-[28px] border border-red-200 bg-white p-8 shadow-sm">
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          Usuário não autenticado.
        </p>
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
      <div className="rounded-[28px] border border-red-200 bg-white p-8 shadow-sm">
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          Empresa não encontrada.
        </p>
      </div>
    );
  }

  const { data: funcionario, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .eq("company_id", membership.company_id)
    .single();

  if (error || !funcionario) {
    return (
      <div className="rounded-[28px] border border-red-200 bg-white p-8 shadow-sm">
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          Não foi possível carregar o funcionário.
        </p>
      </div>
    );
  }

  const { data: notasRaw } = await supabase
    .from("employee_notes")
    .select("id, note_text, created_at")
    .eq("employee_id", id)
    .eq("company_id", membership.company_id)
    .order("created_at", { ascending: false });

  const { data: documentosRaw } = await supabase
    .from("employee_documents")
    .select("id, file_name, file_path, created_at")
    .eq("employee_id", id)
    .eq("company_id", membership.company_id)
    .order("created_at", { ascending: false });

  const notas = (notasRaw ?? []) as EmployeeNoteRow[];
  const documentos = (documentosRaw ?? []) as EmployeeDocumentRow[];

  let photoUrl: string | null = null;

  if (funcionario.photo_path) {
    const { data } = await supabase.storage
      .from("employee-photos")
      .createSignedUrl(funcionario.photo_path, 3600);

    photoUrl = data?.signedUrl || null;
  }

  const docsWithUrl = await Promise.all(
    documentos.map(async (doc) => {
      if (!doc.file_path) {
        return {
          ...doc,
          signedUrl: null,
        };
      }

      const { data } = await supabase.storage
        .from("employee-documents")
        .createSignedUrl(doc.file_path, 3600);

      return {
        ...doc,
        signedUrl: data?.signedUrl || null,
      };
    }),
  );

  const ativo = funcionario.is_active !== false;
  const nomeFuncionario = funcionario.full_name || "Funcionário";

  return (
    <div className="space-y-8">
      <section className="rounded-[30px] border border-slate-200 bg-white px-8 py-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
           <div className="flex h-60 w-60 shrink-0 items-center justify-center overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 p-2 shadow-sm md:h-48 md:w-48">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt="Foto do funcionário"
                  className="h-full w-full object-contain object-center"
                />
              ) : (
                <span className="px-3 text-center text-sm text-slate-500">
                  Sem foto
                </span>
              )}
            </div>

            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                <UserCircle2 className="h-4 w-4" />
                Cadastro do funcionário
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                {nomeFuncionario}
              </h1>

              <div className="mt-4 flex flex-wrap gap-3">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    ativo
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {ativo ? "Ativo" : "Inativo"}
                </span>

                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {funcionario.job_title || "Sem função"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/funcionarios/${funcionario.id}/editar`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
            >
              <FilePenLine className="h-4 w-4" />
              Editar
            </Link>

            <form
              action={`/funcionarios/${funcionario.id}/excluir`}
              method="post"
            >
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </button>
            </form>

            <Link
              href="/funcionarios"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Dados pessoais"
          description="Informações básicas e contato do funcionário."
          icon={<UserCircle2 className="h-5 w-5" />}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InfoItem label="Nome" value={text(funcionario.full_name)} />
          <InfoItem label="CPF" value={text(funcionario.cpf)} />
          <InfoItem
            label="Data de nascimento"
            value={formatDate(funcionario.birth_date)}
          />
          <InfoItem label="RG" value={text(funcionario.rg)} />
          <InfoItem label="Email" value={text(funcionario.email)} />
          <InfoItem label="Telefone 1" value={text(funcionario.phone_1)} />
          <InfoItem label="Telefone 2" value={text(funcionario.phone_2)} />
          <InfoItem label="Status" value={ativo ? "Ativo" : "Inativo"} />
          <InfoItem
            label="Estado civil"
            value={text(funcionario.marital_status)}
          />
          <InfoItem
            label="Escolaridade"
            value={text(funcionario.education_level)}
          />
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Endereço"
          description="Informações de localização."
          icon={<MapPin className="h-5 w-5" />}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InfoItem label="CEP" value={text(funcionario.zip_code)} />
          <InfoItem label="Logradouro" value={text(funcionario.street)} />
          <InfoItem label="Número" value={text(funcionario.number)} />
          <InfoItem label="Complemento" value={text(funcionario.complement)} />
          <InfoItem label="Bairro" value={text(funcionario.district)} />
          <InfoItem label="Cidade" value={text(funcionario.city)} />
          <InfoItem label="Estado" value={text(funcionario.state)} />
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Trabalho"
          description="Função, local, jornada e adicionais."
          icon={<BriefcaseBusiness className="h-5 w-5" />}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InfoItem label="Função" value={text(funcionario.job_title)} />
          <InfoItem
            label="Local de trabalho"
            value={text(funcionario.workplace)}
          />
          <InfoItem
            label="Data de admissão"
            value={formatDate(funcionario.start_date)}
          />
          <InfoItem
            label="Dias de trabalho"
            value={
              Array.isArray(funcionario.work_days)
                ? funcionario.work_days.join(", ")
                : "-"
            }
          />
          <InfoItem label="Entrada" value={text(funcionario.entry_time)} />
          <InfoItem
            label="Saída almoço"
            value={text(funcionario.lunch_start_time)}
          />
          <InfoItem
            label="Retorno almoço"
            value={text(funcionario.lunch_end_time)}
          />
          <InfoItem label="Saída" value={text(funcionario.exit_time)} />
          <InfoItem
            label="Insalubridade"
            value={funcionario.receives_insalubrity ? "Sim" : "Não"}
          />
          <InfoItem
            label="Periculosidade"
            value={funcionario.receives_danger_pay ? "Sim" : "Não"}
          />
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Valores"
          description="Resumo salarial e benefícios."
          icon={<Wallet className="h-5 w-5" />}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InfoItem
            label="Salário bruto"
            value={money(funcionario.gross_salary)}
          />
          <InfoItem
            label="Salário líquido"
            value={money(funcionario.net_salary)}
          />
          <InfoItem label="INSS" value={money(funcionario.inss_value)} />
          <InfoItem label="FGTS" value={money(funcionario.fgts_value)} />
          <InfoItem
            label="Vale alimentação"
            value={money(funcionario.food_allowance)}
          />
          <InfoItem
            label="Vale transporte"
            value={money(funcionario.transport_allowance)}
          />
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Documentos e banco"
          description="Dados documentais e bancários."
          icon={<Shield className="h-5 w-5" />}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InfoItem label="CTPS" value={text(funcionario.ctps)} />
          <InfoItem label="PIS/NIS" value={text(funcionario.pis_nis)} />
          <InfoItem label="CNH" value={text(funcionario.cnh)} />
          <InfoItem label="Banco" value={text(funcionario.bank_name)} />
          <InfoItem label="Agência" value={text(funcionario.bank_agency)} />
          <InfoItem label="Conta" value={text(funcionario.bank_account)} />
          <InfoItem label="PIX" value={text(funcionario.pix_key)} />
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Arquivos enviados"
          description="Documentos anexados ao cadastro."
          icon={<FolderOpen className="h-5 w-5" />}
        />

        <div className="space-y-3">
          {docsWithUrl.length > 0 ? (
            docsWithUrl.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {doc.file_name || "Documento"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDateTime(doc.created_at)}
                  </p>
                </div>

                {doc.signedUrl ? (
                  <a
                    href={doc.signedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                  >
                    Download
                  </a>
                ) : (
                  <span className="text-sm text-slate-400">Indisponível</span>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-500">
              Nenhum documento enviado.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Observações"
          description="Histórico de anotações do funcionário."
          icon={<FileText className="h-5 w-5" />}
        />

        <div className="space-y-3">
          {notas.length > 0 ? (
            notas.map((nota) => (
              <div
                key={nota.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <p className="text-sm leading-7 text-slate-800">
                  {nota.note_text || "-"}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {formatDateTime(nota.created_at)}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-500">
              Nenhuma observação registrada.
            </div>
          )}
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

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-medium leading-6 text-slate-900">
        {value}
      </p>
    </div>
  );
}
