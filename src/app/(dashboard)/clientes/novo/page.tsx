"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import {
  UserPlus,
  Building2,
  User,
  Mail,
  MapPin,
  Shield,
  FileText,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

type ClienteTipo = "PJ" | "PF";

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function maskCPF(value: string) {
  const v = onlyDigits(value).slice(0, 11);

  if (v.length <= 3) return v;
  if (v.length <= 6) return `${v.slice(0, 3)}.${v.slice(3)}`;
  if (v.length <= 9) return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`;
  return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9, 11)}`;
}

function maskCNPJ(value: string) {
  const v = onlyDigits(value).slice(0, 14);

  if (v.length <= 2) return v;
  if (v.length <= 5) return `${v.slice(0, 2)}.${v.slice(2)}`;
  if (v.length <= 8) return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5)}`;
  if (v.length <= 12) return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8)}`;
  return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8, 12)}-${v.slice(12, 14)}`;
}

function maskCEP(value: string) {
  const v = onlyDigits(value).slice(0, 8);
  if (v.length <= 5) return v;
  return `${v.slice(0, 5)}-${v.slice(5, 8)}`;
}

function maskPhone(value: string) {
  const v = onlyDigits(value).slice(0, 11);

  if (v.length <= 2) return v;
  if (v.length <= 6) return `(${v.slice(0, 2)})${v.slice(2)}`;
  if (v.length <= 10) return `(${v.slice(0, 2)})${v.slice(2, 6)}-${v.slice(6)}`;
  return `(${v.slice(0, 2)})${v.slice(2, 7)}-${v.slice(7, 11)}`;
}

function maskUF(value: string) {
  return value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2);
}

export default function NovoClientePage() {
  const supabase = createClient();
  const router = useRouter();

  const hoje = new Date().toISOString().split("T")[0];

  const [type, setType] = useState<ClienteTipo>("PJ");

  const [companyName, setCompanyName] = useState("");
  const [personName, setPersonName] = useState("");
  const [responsible1, setResponsible1] = useState("");
  const [responsible2, setResponsible2] = useState("");

  const [cnpj, setCnpj] = useState("");
  const [cpf, setCpf] = useState("");

  const [email1, setEmail1] = useState("");
  const [email2, setEmail2] = useState("");

  const [phone1, setPhone1] = useState("");
  const [phone2, setPhone2] = useState("");

  const [zipCode, setZipCode] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const [registrationDate, setRegistrationDate] = useState(hoje);
  const [observations, setObservations] = useState("");

  const [passwordMain, setPasswordMain] = useState("");
  const [passwordCounter, setPasswordCounter] = useState("");
  const [passwordPanic, setPasswordPanic] = useState("");

  const [loading, setLoading] = useState(false);
  const [searchingCep, setSearchingCep] = useState(false);
  const [error, setError] = useState("");

  async function handleCepBlur() {
    const cepDigits = onlyDigits(zipCode);

    if (cepDigits.length !== 8) return;

    try {
      setSearchingCep(true);

      const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await response.json();

      if (data.erro) {
        return;
      }

      setStreet(data.logradouro || "");
      setDistrict(data.bairro || "");
      setCity(data.localidade || "");
      setState((data.uf || "").toUpperCase());
      setComplement(data.complemento || "");
    } catch {
      // silêncio intencional
    } finally {
      setSearchingCep(false);
    }
  }

  function handleChangeTipo(nextType: ClienteTipo) {
    setType(nextType);

    if (nextType === "PJ") {
      setCpf("");
    } else {
      setCnpj("");
      setResponsible1("");
      setResponsible2("");
    }
  }

  async function criarCliente() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Usuário não autenticado.");
      }

      const { data: membership, error: membershipError } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (membershipError || !membership) {
        throw new Error("Empresa do usuário não encontrada.");
      }

      const nomePessoa = personName.trim();
      const nomeEmpresa = companyName.trim();

      if (type === "PJ" && !nomeEmpresa) {
        throw new Error("Informe o nome da empresa.");
      }

      if (type === "PF" && !nomePessoa) {
        throw new Error("Informe o nome completo.");
      }

      const payload = {
        company_id: membership.company_id,

        type,

        company_name: type === "PJ" ? nomeEmpresa || null : null,
        person_name: nomePessoa || null,

        responsible_1: type === "PJ" ? responsible1.trim() || null : null,
        responsible_2: type === "PJ" ? responsible2.trim() || null : null,

        cnpj: type === "PJ" ? cnpj || null : null,
        cpf: type === "PF" ? cpf || null : null,

        email_1: email1.trim() || null,
        email_2: email2.trim() || null,

        phone_1: phone1 || null,
        phone_2: phone2 || null,

        zip_code: zipCode || null,
        street: street.trim() || null,
        number: number.trim() || null,
        complement: complement.trim() || null,
        district: district.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,

        registration_date: registrationDate || null,
        observations: observations.trim() || null,

        password_main: passwordMain.trim() || null,
        password_counter: passwordCounter.trim() || null,
        password_panic: passwordPanic.trim() || null,

        is_active: true,
        created_by: user.id,
      };

      const { error: insertError } = await supabase.from("clients").insert(payload);

      if (insertError) {
        throw new Error(insertError.message);
      }

      router.push("/clientes");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar cliente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* TOPO */}
      <section className="rounded-[30px] border border-slate-200 bg-white px-8 py-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              <UserPlus className="h-4 w-4" />
              Cadastro de cliente
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              Novo Cliente
            </h1>

            <p className="mt-3 text-base leading-7 text-slate-600">
              Preencha os dados do cliente para cadastrar um novo registro no sistema.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push("/clientes")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
          </div>
        </div>
      </section>

      {/* TIPO */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Tipo de cliente
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Escolha se o cadastro será de pessoa jurídica ou física.
            </p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            {type === "PJ" ? (
              <Building2 className="h-5 w-5" />
            ) : (
              <User className="h-5 w-5" />
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => handleChangeTipo("PJ")}
            className={`rounded-2xl border px-5 py-4 text-left transition ${
              type === "PJ"
                ? "border-[#12325F] bg-[#12325F] text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5" />
              <div>
                <p className="font-semibold">Pessoa Jurídica</p>
                <p
                  className={`mt-1 text-sm ${
                    type === "PJ" ? "text-blue-100" : "text-slate-500"
                  }`}
                >
                  Empresas e organizações
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleChangeTipo("PF")}
            className={`rounded-2xl border px-5 py-4 text-left transition ${
              type === "PF"
                ? "border-[#12325F] bg-[#12325F] text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <User className="h-5 w-5" />
              <div>
                <p className="font-semibold">Pessoa Física</p>
                <p
                  className={`mt-1 text-sm ${
                    type === "PF" ? "text-blue-100" : "text-slate-500"
                  }`}
                >
                  Clientes individuais
                </p>
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* IDENTIFICAÇÃO */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Identificação"
          description="Dados principais do cliente e responsáveis."
          icon={<Building2 className="h-5 w-5" />}
        />

        <div className="grid gap-4 md:grid-cols-2">
          {type === "PJ" ? (
            <Field
              placeholder="Nome da empresa"
              value={companyName}
              onChange={setCompanyName}
            />
          ) : (
            <Field
              placeholder="Nome completo"
              value={personName}
              onChange={setPersonName}
            />
          )}

          <Field
            placeholder={
              type === "PJ"
                ? "Contato / nome de referência"
                : "Nome de referência"
            }
            value={personName}
            onChange={setPersonName}
          />

          {type === "PJ" ? (
            <Field
              placeholder="CNPJ"
              value={cnpj}
              onChange={(value) => setCnpj(maskCNPJ(value))}
              inputMode="numeric"
            />
          ) : (
            <Field
              placeholder="CPF"
              value={cpf}
              onChange={(value) => setCpf(maskCPF(value))}
              inputMode="numeric"
            />
          )}

          {type === "PJ" ? (
            <Field
              placeholder="Responsável 1"
              value={responsible1}
              onChange={setResponsible1}
            />
          ) : (
            <div />
          )}

          {type === "PJ" ? (
            <Field
              placeholder="Responsável 2"
              value={responsible2}
              onChange={setResponsible2}
            />
          ) : (
            <div />
          )}
        </div>
      </section>

      {/* CONTATO */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Contato"
          description="Emails e telefones principais do cliente."
          icon={<Mail className="h-5 w-5" />}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            placeholder="Email 1"
            value={email1}
            onChange={setEmail1}
            type="email"
          />

          <Field
            placeholder="Email 2"
            value={email2}
            onChange={setEmail2}
            type="email"
          />

          <Field
            placeholder="Telefone 1"
            value={phone1}
            onChange={(value) => setPhone1(maskPhone(value))}
            inputMode="numeric"
          />

          <Field
            placeholder="Telefone 2"
            value={phone2}
            onChange={(value) => setPhone2(maskPhone(value))}
            inputMode="numeric"
          />
        </div>
      </section>

      {/* ENDEREÇO */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Endereço"
          description="Dados de localização e preenchimento por CEP."
          icon={<MapPin className="h-5 w-5" />}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Field
              placeholder="CEP"
              value={zipCode}
              onChange={(value) => setZipCode(maskCEP(value))}
              onBlur={handleCepBlur}
              inputMode="numeric"
            />

            {searchingCep ? (
              <p className="text-xs text-slate-500">
                Buscando endereço pelo CEP...
              </p>
            ) : null}
          </div>

          <Field
            placeholder="Logradouro"
            value={street}
            onChange={setStreet}
          />

          <Field
            placeholder="Número"
            value={number}
            onChange={(value) =>
              setNumber(onlyDigits(value).slice(0, 10))
            }
            inputMode="numeric"
          />

          <Field
            placeholder="Complemento"
            value={complement}
            onChange={setComplement}
          />

          <Field
            placeholder="Bairro"
            value={district}
            onChange={setDistrict}
          />

          <Field
            placeholder="Cidade"
            value={city}
            onChange={setCity}
          />

          <Field
            placeholder="Estado"
            value={state}
            onChange={(value) => setState(maskUF(value))}
          />
        </div>
      </section>

      {/* CADASTRO E CREDENCIAIS */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Cadastro e credenciais"
          description="Data de inclusão e informações adicionais do cliente."
          icon={<Shield className="h-5 w-5" />}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Data da inclusão
            </label>
            <input
              type="date"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              value={registrationDate}
              onChange={(e) => setRegistrationDate(e.target.value)}
            />
          </div>

          <Field
            placeholder="Senha boa"
            value={passwordMain}
            onChange={setPasswordMain}
          />

          <Field
            placeholder="Contra-senha"
            value={passwordCounter}
            onChange={setPasswordCounter}
          />

          <Field
            placeholder="Senha pânico"
            value={passwordPanic}
            onChange={setPasswordPanic}
          />
        </div>
      </section>

      {/* OBSERVAÇÕES */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Observações"
          description="Notas gerais e observações importantes do cliente."
          icon={<FileText className="h-5 w-5" />}
        />

        <textarea
          className="min-h-36 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          placeholder="Observações gerais do cliente"
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
        />
      </section>

      {/* ERRO */}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {/* AÇÕES */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Finalizar cadastro
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Revise os dados e confirme para criar o cliente.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/clientes")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Cancelar
            </button>

            <button
              type="button"
              onClick={criarCliente}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#12325F] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Salvando..." : "Criar Cliente"}
              {!loading ? <ArrowRight className="h-4 w-4" /> : null}
            </button>
          </div>
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

function Field({
  placeholder,
  value,
  onChange,
  type = "text",
  inputMode,
  onBlur,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  onBlur?: () => void;
}) {
  return (
    <input
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      type={type}
      inputMode={inputMode}
      onBlur={onBlur}
    />
  );
}