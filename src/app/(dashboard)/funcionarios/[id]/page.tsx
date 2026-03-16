import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";

type FuncionarioPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function FuncionarioPage({ params }: FuncionarioPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!membership) {
    return (
      <div className="bg-white border rounded-xl p-6">
        <p className="text-red-600">Empresa não encontrada.</p>
      </div>
    );
  }

  const { data: funcionario, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .eq("company_id", membership.company_id)
    .single();

  const { data: notas } = await supabase
    .from("employee_notes")
    .select("*")
    .eq("employee_id", id)
    .eq("company_id", membership.company_id)
    .order("created_at", { ascending: false });

  const { data: documentos } = await supabase
    .from("employee_documents")
    .select("*")
    .eq("employee_id", id)
    .eq("company_id", membership.company_id)
    .order("created_at", { ascending: false });

  if (error || !funcionario) {
    return (
      <div className="bg-white border rounded-xl p-6">
        <p className="text-red-600">Não foi possível carregar o funcionário.</p>
      </div>
    );
  }

  let photoUrl: string | null = null;

  if (funcionario.photo_path) {
    const { data } = await supabase.storage
      .from("employee-photos")
      .createSignedUrl(funcionario.photo_path, 3600);

    photoUrl = data?.signedUrl || null;
  }

  const docsWithUrl =
    documentos && documentos.length > 0
      ? await Promise.all(
          documentos.map(async (doc) => {
            const { data } = await supabase.storage
              .from("employee-documents")
              .createSignedUrl(doc.file_path, 3600);

            return {
              ...doc,
              signedUrl: data?.signedUrl || null,
            };
          })
        )
      : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold">Funcionário</h1>

        <div className="flex gap-3">
          <Link
            href={`/funcionarios/${funcionario.id}/editar`}
            className="bg-amber-500 text-white px-4 py-2 rounded-xl"
          >
            Editar
          </Link>

          <form action={`/funcionarios/${funcionario.id}/excluir`} method="post">
            <button
              type="submit"
              className="bg-red-600 text-white px-4 py-2 rounded-xl"
            >
              Excluir
            </button>
          </form>

          <Link href="/funcionarios" className="border px-4 py-2 rounded-xl">
            Voltar
          </Link>
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-6 space-y-6">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="h-40 w-40 rounded-2xl border overflow-hidden bg-slate-50 flex items-center justify-center">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt="Foto do funcionário"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm text-slate-500">Sem foto</span>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4 flex-1">
            <p><b>Nome:</b> {funcionario.full_name || "-"}</p>
            <p><b>CPF:</b> {funcionario.cpf || "-"}</p>
            <p>
              <b>Data de nascimento:</b>{" "}
              {funcionario.birth_date
                ? new Date(funcionario.birth_date).toLocaleDateString("pt-BR")
                : "-"}
            </p>
            <p><b>RG:</b> {funcionario.rg || "-"}</p>
            <p><b>Email:</b> {funcionario.email || "-"}</p>
            <p><b>Telefone 1:</b> {funcionario.phone_1 || "-"}</p>
            <p><b>Telefone 2:</b> {funcionario.phone_2 || "-"}</p>
            <p><b>Status:</b> {funcionario.is_active ? "Ativo" : "Inativo"}</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Endereço</h2>
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <p><b>CEP:</b> {funcionario.zip_code || "-"}</p>
            <p><b>Logradouro:</b> {funcionario.street || "-"}</p>
            <p><b>Número:</b> {funcionario.number || "-"}</p>
            <p><b>Complemento:</b> {funcionario.complement || "-"}</p>
            <p><b>Bairro:</b> {funcionario.district || "-"}</p>
            <p><b>Cidade:</b> {funcionario.city || "-"}</p>
            <p><b>Estado:</b> {funcionario.state || "-"}</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Trabalho</h2>
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <p><b>Função:</b> {funcionario.job_title || "-"}</p>
            <p><b>Local de trabalho:</b> {funcionario.workplace || "-"}</p>
            <p>
              <b>Data de admissão:</b>{" "}
              {funcionario.start_date
                ? new Date(funcionario.start_date).toLocaleDateString("pt-BR")
                : "-"}
            </p>
            <p><b>Dias de trabalho:</b> {funcionario.work_days?.join(", ") || "-"}</p>
            <p><b>Entrada:</b> {funcionario.entry_time || "-"}</p>
            <p><b>Saída almoço:</b> {funcionario.lunch_start_time || "-"}</p>
            <p><b>Retorno almoço:</b> {funcionario.lunch_end_time || "-"}</p>
            <p><b>Saída:</b> {funcionario.exit_time || "-"}</p>
            <p><b>Insalubridade:</b> {funcionario.receives_insalubrity ? "Sim" : "Não"}</p>
            <p><b>Periculosidade:</b> {funcionario.receives_danger_pay ? "Sim" : "Não"}</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Valores</h2>
          <div className="mt-4 grid md:grid-cols-3 gap-4">
            <p><b>Salário bruto:</b> {funcionario.gross_salary}</p>
            <p><b>Salário líquido:</b> {funcionario.net_salary}</p>
            <p><b>INSS:</b> {funcionario.inss_value}</p>
            <p><b>FGTS:</b> {funcionario.fgts_value}</p>
            <p><b>Vale alimentação:</b> {funcionario.food_allowance}</p>
            <p><b>Vale transporte:</b> {funcionario.transport_allowance}</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Documentos e banco</h2>
          <div className="mt-4 grid md:grid-cols-3 gap-4">
            <p><b>CTPS:</b> {funcionario.ctps || "-"}</p>
            <p><b>PIS/NIS:</b> {funcionario.pis_nis || "-"}</p>
            <p><b>CNH:</b> {funcionario.cnh || "-"}</p>
            <p><b>Banco:</b> {funcionario.bank_name || "-"}</p>
            <p><b>Agência:</b> {funcionario.bank_agency || "-"}</p>
            <p><b>Conta:</b> {funcionario.bank_account || "-"}</p>
            <p><b>PIX:</b> {funcionario.pix_key || "-"}</p>
            <p><b>Estado civil:</b> {funcionario.marital_status || "-"}</p>
            <p><b>Escolaridade:</b> {funcionario.education_level || "-"}</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Arquivos enviados</h2>
          <div className="mt-4 space-y-3">
            {docsWithUrl.length > 0 ? (
              docsWithUrl.map((doc) => (
                <div
                  key={doc.id}
                  className="border rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-medium">{doc.file_name}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(doc.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>

                  {doc.signedUrl ? (
                    <a
                      href={doc.signedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Download
                    </a>
                  ) : (
                    <span className="text-slate-400">Indisponível</span>
                  )}
                </div>
              ))
            ) : (
              <div className="border rounded-xl p-4 text-slate-500">
                Nenhum documento enviado.
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Observações</h2>
          <div className="mt-4 space-y-3">
            {notas && notas.length > 0 ? (
              notas.map((nota) => (
                <div key={nota.id} className="border rounded-xl p-4">
                  <p>{nota.note_text}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    {new Date(nota.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
              ))
            ) : (
              <div className="border rounded-xl p-4 text-slate-500">
                Nenhuma observação registrada.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}