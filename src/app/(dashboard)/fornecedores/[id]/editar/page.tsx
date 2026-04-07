"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Truck } from "lucide-react";

type SupplierResponse = {
  item?: {
    id: string;
    name: string;
    cnpj: string | null;
    contact_name: string | null;
    phone: string | null;
    email: string | null;
    notes: string | null;
    is_active: boolean;
  };
  error?: string;
};

type SupplierForm = {
  name: string;
  cnpj: string;
  contact_name: string;
  phone: string;
  email: string;
  notes: string;
  is_active: boolean;
};

export default function EditarFornecedorPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = String(params.id || "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<SupplierForm>({
    name: "",
    cnpj: "",
    contact_name: "",
    phone: "",
    email: "",
    notes: "",
    is_active: true,
  });

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        setLoading(true);

        const res = await fetch(`/api/company/suppliers/${id}`, {
          cache: "no-store",
        });

        const json: SupplierResponse = await res.json();

        if (!res.ok || !json.item) {
          throw new Error(json.error || "Erro ao carregar fornecedor.");
        }

        setForm({
          name: json.item.name || "",
          cnpj: json.item.cnpj || "",
          contact_name: json.item.contact_name || "",
          phone: json.item.phone || "",
          email: json.item.email || "",
          notes: json.item.notes || "",
          is_active: Boolean(json.item.is_active),
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao carregar fornecedor.";
        alert(message);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [id]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);

      const res = await fetch(`/api/company/suppliers/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const json: { item?: { id: string }; error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao salvar fornecedor.");
      }

      router.push("/fornecedores");
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao salvar fornecedor.";
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <section className="rounded-[30px] border border-slate-200 bg-white px-8 py-8 shadow-sm">
          <p className="text-sm text-slate-500">Carregando fornecedor...</p>
        </section>
      </div>
    );
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
              Editar fornecedor
            </h1>

            <p className="mt-3 text-base leading-7 text-slate-600">
              Atualize os dados do fornecedor selecionado.
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
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Nome do fornecedor
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
              CNPJ
            </label>
            <input
              value={form.cnpj}
              onChange={(e) => setForm((old) => ({ ...old, cnpj: e.target.value }))}
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
              onChange={(e) => setForm((old) => ({ ...old, phone: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
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

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Observações
            </label>
            <textarea
              rows={5}
              value={form.notes}
              onChange={(e) => setForm((old) => ({ ...old, notes: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              placeholder="Ex.: fornecedor principal de uniformes, prazo médio, condições comerciais..."
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
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}