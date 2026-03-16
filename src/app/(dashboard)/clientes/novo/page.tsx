"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";

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
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Novo Cliente</h1>
        <p className="text-slate-600 mt-2">Cadastre um novo cliente no sistema.</p>
      </div>

      <div className="bg-white border rounded-2xl p-6 space-y-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Tipo de cliente</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleChangeTipo("PJ")}
              className={`rounded-xl border px-4 py-3 text-left ${
                type === "PJ"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-900"
              }`}
            >
              Pessoa Jurídica
            </button>

            <button
              type="button"
              onClick={() => handleChangeTipo("PF")}
              className={`rounded-xl border px-4 py-3 text-left ${
                type === "PF"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-900"
              }`}
            >
              Pessoa Física
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Identificação</h2>

          <div className="grid md:grid-cols-2 gap-4">
            {type === "PJ" ? (
              <input
                className="w-full border rounded-xl px-4 py-3"
                placeholder="Nome da empresa"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            ) : (
              <input
                className="w-full border rounded-xl px-4 py-3"
                placeholder="Nome completo"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
              />
            )}

            <input
              className="w-full border rounded-xl px-4 py-3"
              placeholder={type === "PJ" ? "Contato / nome de referência" : "Nome de referência"}
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
            />

            {type === "PJ" ? (
              <input
                className="w-full border rounded-xl px-4 py-3"
                placeholder="CNPJ"
                value={cnpj}
                onChange={(e) => setCnpj(maskCNPJ(e.target.value))}
                inputMode="numeric"
              />
            ) : (
              <input
                className="w-full border rounded-xl px-4 py-3"
                placeholder="CPF"
                value={cpf}
                onChange={(e) => setCpf(maskCPF(e.target.value))}
                inputMode="numeric"
              />
            )}

            {type === "PJ" ? (
              <input
                className="w-full border rounded-xl px-4 py-3"
                placeholder="Responsável 1"
                value={responsible1}
                onChange={(e) => setResponsible1(e.target.value)}
              />
            ) : (
              <div />
            )}

            {type === "PJ" ? (
              <input
                className="w-full border rounded-xl px-4 py-3"
                placeholder="Responsável 2"
                value={responsible2}
                onChange={(e) => setResponsible2(e.target.value)}
              />
            ) : (
              <div />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Contato</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              className="w-full border rounded-xl px-4 py-3"
              placeholder="Email 1"
              value={email1}
              onChange={(e) => setEmail1(e.target.value)}
              type="email"
            />

            <input
              className="w-full border rounded-xl px-4 py-3"
              placeholder="Email 2"
              value={email2}
              onChange={(e) => setEmail2(e.target.value)}
              type="email"
            />

            <input
              className="w-full border rounded-xl px-4 py-3"
              placeholder="Telefone 1"
              value={phone1}
              onChange={(e) => setPhone1(maskPhone(e.target.value))}
              inputMode="numeric"
            />

            <input
              className="w-full border rounded-xl px-4 py-3"
              placeholder="Telefone 2"
              value={phone2}
              onChange={(e) => setPhone2(maskPhone(e.target.value))}
              inputMode="numeric"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Endereço</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <input
                className="w-full border rounded-xl px-4 py-3"
                placeholder="CEP"
                value={zipCode}
                onChange={(e) => setZipCode(maskCEP(e.target.value))}
                onBlur={handleCepBlur}
                inputMode="numeric"
              />
              {searchingCep ? (
                <p className="text-xs text-slate-500">Buscando endereço pelo CEP...</p>
              ) : null}
            </div>

            <input
              className="w-full border rounded-xl px-4 py-3"
              placeholder="Logradouro"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />

            <input
              className="w-full border rounded-xl px-4 py-3"
              placeholder="Número"
              value={number}
              onChange={(e) => setNumber(onlyDigits(e.target.value).slice(0, 10))}
              inputMode="numeric"
            />

            <input
              className="w-full border rounded-xl px-4 py-3"
              placeholder="Complemento"
              value={complement}
              onChange={(e) => setComplement(e.target.value)}
            />

            <input
              className="w-full border rounded-xl px-4 py-3"
              placeholder="Bairro"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            />

            <input
              className="w-full border rounded-xl px-4 py-3"
              placeholder="Cidade"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />

            <input
              className="w-full border rounded-xl px-4 py-3"
              placeholder="Estado"
              value={state}
              onChange={(e) => setState(maskUF(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Cadastro e credenciais</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-700">Data da inclusão</label>
              <input
                type="date"
                className="w-full border rounded-xl px-4 py-3"
                value={registrationDate}
                onChange={(e) => setRegistrationDate(e.target.value)}
              />
            </div>

            <input
              className="w-full border rounded-xl px-4 py-3"
              placeholder="Senha boa"
              value={passwordMain}
              onChange={(e) => setPasswordMain(e.target.value)}
            />

            <input
              className="w-full border rounded-xl px-4 py-3"
              placeholder="Contra-senha"
              value={passwordCounter}
              onChange={(e) => setPasswordCounter(e.target.value)}
            />

            <input
              className="w-full border rounded-xl px-4 py-3"
              placeholder="Senha pânico"
              value={passwordPanic}
              onChange={(e) => setPasswordPanic(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Observações</h2>

          <textarea
            className="w-full border rounded-xl px-4 py-3 min-h-32"
            placeholder="Observações gerais do cliente"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
          />
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={criarCliente}
            disabled={loading}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl disabled:opacity-60"
          >
            {loading ? "Salvando..." : "Criar Cliente"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/clientes")}
            className="border px-6 py-3 rounded-xl"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}