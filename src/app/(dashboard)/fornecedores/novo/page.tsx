"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Save, Truck } from "lucide-react";

type SupplierForm = {
  type: "PF" | "PJ";
  name: string;
  document: string;
  contact_name: string;
  phone: string;
  email: string;
  zip_code: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  notes: string;
  is_active: boolean;
};

export default function NovoFornecedorPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<SupplierForm>({
    type: "PJ",
    name: "",
    document: "",
    contact_name: "",
    phone: "",
    email: "",
    zip_code: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
    notes: "",
    is_active: true,
  });

  function maskCPF(value: string) {
    return value
      .replace(/\D/g, "")
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  function maskCNPJ(value: string) {
    return value
      .replace(/\D/g, "")
      .slice(0, 14)
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  function maskPhone(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    if (digits.length <= 10) {
      return digits
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  function maskCEP(value: string) {
    return value.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
  }

  function handleDocument(value: string) {
    return form.type === "PJ" ? maskCNPJ(value) : maskCPF(value);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setSaving(true);

      const res = await fetch("/api/company/suppliers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: form.type,
          name: form.name,
          document: form.document,
          contact_name: form.contact_name,
          phone: form.phone,
          email: form.email,
          zip_code: form.zip_code,
          street: form.street,
          number: form.number,
          complement: form.complement,
          district: form.district,
          city: form.city,
          state: form.state,
          notes: form.notes,
          is_active: form.is_active,
        }),
      });

      const json: { item?: { id: string }; error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao criar fornecedor.");
      }

      router.push("/fornecedores");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao criar fornecedor.";
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[30px] border border-slate-200 bg-white px-8 py-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              <Truck className="h-4 w-4" />
              Cadastro de fornecedor
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              Novo fornecedor
            </h1>

            <p className="mt-3 text-base leading-7 text-slate-600">
              Cadastro completo de fornecedor, com dados de contato e endereço.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/fornecedores")}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Tipo de fornecedor
            </label>
            <select
              value={form.type}
              onChange={(e) =>
                setForm((old) => ({
                  ...old,
                  type: e.target.value as "PF" | "PJ",
                  document: "",
                }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            >
              <option value="PJ">Pessoa Jurídica</option>
              <option value="PF">Pessoa Física</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              {form.type === "PJ" ? "CNPJ" : "CPF"}
            </label>
            <input
              value={form.document}
              onChange={(e) =>
                setForm((old) => ({
                  ...old,
                  document: handleDocument(e.target.value),
                }))
              }
              placeholder={form.type === "PJ" ? "00.000.000/0000-00" : "000.000.000-00"}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              {form.type === "PJ" ? "Razão social / Nome fantasia" : "Nome completo"}
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((old) => ({ ...old, name: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Nome do contato
            </label>
            <input
              value={form.contact_name}
              onChange={(e) =>
                setForm((old) => ({ ...old, contact_name: e.target.value }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Telefone
            </label>
            <input
              value={form.phone}
              onChange={(e) =>
                setForm((old) => ({ ...old, phone: maskPhone(e.target.value) }))
              }
              placeholder="(00) 00000-0000"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              E-mail
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((old) => ({ ...old, email: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="md:col-span-2 pt-2">
            <h2 className="text-lg font-semibold text-slate-900">Endereço</h2>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              CEP
            </label>
            <input
              value={form.zip_code}
              onChange={(e) =>
                setForm((old) => ({ ...old, zip_code: maskCEP(e.target.value) }))
              }
              placeholder="00000-000"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="md:col-span-1">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Rua
            </label>
            <input
              value={form.street}
              onChange={(e) => setForm((old) => ({ ...old, street: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Número
            </label>
            <input
              value={form.number}
              onChange={(e) => setForm((old) => ({ ...old, number: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Complemento
            </label>
            <input
              value={form.complement}
              onChange={(e) =>
                setForm((old) => ({ ...old, complement: e.target.value }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Bairro
            </label>
            <input
              value={form.district}
              onChange={(e) =>
                setForm((old) => ({ ...old, district: e.target.value }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Cidade
            </label>
            <input
              value={form.city}
              onChange={(e) => setForm((old) => ({ ...old, city: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Estado (UF)
            </label>
            <input
              maxLength={2}
              value={form.state}
              onChange={(e) =>
                setForm((old) => ({
                  ...old,
                  state: e.target.value.toUpperCase(),
                }))
              }
              placeholder="UF"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm uppercase outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Observações
            </label>
            <textarea
              rows={5}
              value={form.notes}
              onChange={(e) => setForm((old) => ({ ...old, notes: e.target.value }))}
              placeholder="Ex.: fornecedor principal, prazo médio, condições comerciais, observações internas..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="md:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm((old) => ({ ...old, is_active: e.target.checked }))
                }
              />
              Fornecedor ativo
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#12325F] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar fornecedor"}
          </button>
        </div>
      </form>
    </div>
  );
}