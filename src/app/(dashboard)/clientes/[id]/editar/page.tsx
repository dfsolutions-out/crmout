import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FilePenLine,
  Building2,
  Mail,
  MapPin,
  Shield,
  FileText,
  ArrowLeft,
  ArrowRight,
  
} from "lucide-react";

type EditarClientePageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function atualizarCliente(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const id = String(formData.get("id") || "");
  const companyName = String(formData.get("company_name") || "");
  const personName = String(formData.get("person_name") || "");
  const responsible1 = String(formData.get("responsible_1") || "");
  const responsible2 = String(formData.get("responsible_2") || "");
  const email1 = String(formData.get("email_1") || "");
  const email2 = String(formData.get("email_2") || "");
  const phone1 = String(formData.get("phone_1") || "");
  const phone2 = String(formData.get("phone_2") || "");
  const cnpj = String(formData.get("cnpj") || "");
  const cpf = String(formData.get("cpf") || "");
  const zipCode = String(formData.get("zip_code") || "");
  const street = String(formData.get("street") || "");
  const number = String(formData.get("number") || "");
  const complement = String(formData.get("complement") || "");
  const district = String(formData.get("district") || "");
  const city = String(formData.get("city") || "");
  const state = String(formData.get("state") || "");
  const registrationDate = String(formData.get("registration_date") || "");
  const observations = String(formData.get("observations") || "");
  const passwordMain = String(formData.get("password_main") || "");
  const passwordCounter = String(formData.get("password_counter") || "");
  const passwordPanic = String(formData.get("password_panic") || "");
  const isActive = String(formData.get("is_active") || "") === "true";

  const { error } = await supabase
    .from("clients")
    .update({
      company_name: companyName || null,
      person_name: personName || null,
      responsible_1: responsible1 || null,
      responsible_2: responsible2 || null,
      email_1: email1 || null,
      email_2: email2 || null,
      phone_1: phone1 || null,
      phone_2: phone2 || null,
      cnpj: cnpj || null,
      cpf: cpf || null,
      zip_code: zipCode || null,
      street: street || null,
      number: number || null,
      complement: complement || null,
      district: district || null,
      city: city || null,
      state: state || null,
      registration_date: registrationDate || null,
      observations: observations || null,
      password_main: passwordMain || null,
      password_counter: passwordCounter || null,
      password_panic: passwordPanic || null,
      is_active: isActive,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  redirect(`/clientes/${id}`);
}

export default async function EditarClientePage({
  params,
}: EditarClientePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: cliente, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !cliente) {
    return (
      <div className="space-y-6">
        <div className="rounded-[28px] border border-red-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Editar Cliente
          </h1>

          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            Não foi possível carregar o cliente.
          </p>
        </div>
      </div>
    );
  }

  const clientName = cliente.company_name || cliente.person_name || "Cliente";

  return (
    <div className="space-y-8">
      {/* TOPO */}
      <section className="rounded-[30px] border border-slate-200 bg-white px-8 py-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              <FilePenLine className="h-4 w-4" />
              Atualização de cadastro
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              Editar Cliente
            </h1>

            <p className="mt-3 text-base leading-7 text-slate-600">
              Atualize os dados do cliente <span className="font-semibold text-slate-800">{clientName}</span>.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/clientes/${cliente.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </div>
        </div>
      </section>

      <form action={atualizarCliente} className="space-y-8">
        <input type="hidden" name="id" defaultValue={cliente.id} />

        {/* IDENTIFICAÇÃO */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Identificação"
            description="Dados principais do cliente e responsáveis."
            icon={<Building2 className="h-5 w-5" />}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              name="company_name"
              defaultValue={cliente.company_name || ""}
              placeholder="Nome da empresa"
            />

            <Field
              name="person_name"
              defaultValue={cliente.person_name || ""}
              placeholder="Contato / nome"
            />

            <Field
              name="cnpj"
              defaultValue={cliente.cnpj || ""}
              placeholder="CNPJ"
            />

            <Field
              name="cpf"
              defaultValue={cliente.cpf || ""}
              placeholder="CPF"
            />

            <Field
              name="responsible_1"
              defaultValue={cliente.responsible_1 || ""}
              placeholder="Responsável 1"
            />

            <Field
              name="responsible_2"
              defaultValue={cliente.responsible_2 || ""}
              placeholder="Responsável 2"
            />
          </div>
        </section>

        {/* CONTATO */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Contato"
            description="Emails e telefones principais."
            icon={<Mail className="h-5 w-5" />}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              name="email_1"
              defaultValue={cliente.email_1 || ""}
              placeholder="Email 1"
              type="email"
            />

            <Field
              name="email_2"
              defaultValue={cliente.email_2 || ""}
              placeholder="Email 2"
              type="email"
            />

            <Field
              name="phone_1"
              defaultValue={cliente.phone_1 || ""}
              placeholder="Telefone 1"
            />

            <Field
              name="phone_2"
              defaultValue={cliente.phone_2 || ""}
              placeholder="Telefone 2"
            />
          </div>
        </section>

        {/* ENDEREÇO */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Endereço"
            description="Informações de localização do cliente."
            icon={<MapPin className="h-5 w-5" />}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              name="zip_code"
              defaultValue={cliente.zip_code || ""}
              placeholder="CEP"
            />

            <Field
              name="street"
              defaultValue={cliente.street || ""}
              placeholder="Logradouro"
            />

            <Field
              name="number"
              defaultValue={cliente.number || ""}
              placeholder="Número"
            />

            <Field
              name="complement"
              defaultValue={cliente.complement || ""}
              placeholder="Complemento"
            />

            <Field
              name="district"
              defaultValue={cliente.district || ""}
              placeholder="Bairro"
            />

            <Field
              name="city"
              defaultValue={cliente.city || ""}
              placeholder="Cidade"
            />

            <Field
              name="state"
              defaultValue={cliente.state || ""}
              placeholder="Estado"
            />
          </div>
        </section>

        {/* CADASTRO E CREDENCIAIS */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Cadastro e credenciais"
            description="Status do cadastro, data de inclusão e senhas."
            icon={<Shield className="h-5 w-5" />}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Data da inclusão
              </label>
              <input
                type="date"
                name="registration_date"
                defaultValue={cliente.registration_date || ""}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                name="is_active"
                defaultValue={cliente.is_active ? "true" : "false"}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>

            <Field
              name="password_main"
              defaultValue={cliente.password_main || ""}
              placeholder="Senha boa"
            />

            <Field
              name="password_counter"
              defaultValue={cliente.password_counter || ""}
              placeholder="Contra-senha"
            />

            <Field
              name="password_panic"
              defaultValue={cliente.password_panic || ""}
              placeholder="Senha pânico"
            />
          </div>
        </section>

        {/* OBSERVAÇÕES */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Observações"
            description="Notas e informações gerais sobre o cliente."
            icon={<FileText className="h-5 w-5" />}
          />

          <textarea
            name="observations"
            defaultValue={cliente.observations || ""}
            placeholder="Observações"
            className="min-h-36 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          />
        </section>

        {/* AÇÕES */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Salvar alterações
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Revise os campos e confirme a atualização do cadastro.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/clientes/${cliente.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Cancelar
              </Link>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#12325F] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95"
              >
                Salvar alterações
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </form>
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

function Field({
  name,
  defaultValue,
  placeholder,
  type = "text",
}: {
  name: string;
  defaultValue: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <input
      name={name}
      defaultValue={defaultValue}
      placeholder={placeholder}
      type={type}
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
    />
  );
}