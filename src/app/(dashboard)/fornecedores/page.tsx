"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Truck, Plus, Search, Pencil, Trash2 } from "lucide-react";

type Supplier = {
  id: string;
  name: string;
  cnpj: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
};

export default function FornecedoresPage() {
  const [items, setItems] = useState<Supplier[]>([]);
  const [q, setQ] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (activeFilter) params.set("active", activeFilter);

      const res = await fetch(`/api/company/suppliers?${params.toString()}`, {
        cache: "no-store",
      });

      const json: { items?: Supplier[]; error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao carregar fornecedores.");
      }

      setItems(json.items ?? []);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar fornecedores.";
      alert(message);
    } finally {
      setLoading(false);
    }
  }, [q, activeFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(id: string) {
    const ok = window.confirm("Deseja realmente excluir este fornecedor?");
    if (!ok) return;

    try {
      const res = await fetch(`/api/company/suppliers/${id}`, {
        method: "DELETE",
      });

      const json: { ok?: boolean; error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao excluir fornecedor.");
      }

      await load();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao excluir fornecedor.";
      alert(message);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[30px] border border-slate-200 bg-white px-8 py-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              <Truck className="h-4 w-4" />
              Cadastro de fornecedores
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              Fornecedores
            </h1>

            <p className="mt-3 text-base leading-7 text-slate-600">
              Cadastre e organize os fornecedores da empresa para compras,
              reposições e controle interno.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/fornecedores/novo"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#12325F] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
            >
              <Plus className="h-4 w-4" />
              Novo fornecedor
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Buscar
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nome, CNPJ, contato ou e-mail"
                className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Todos</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>
          </div>

          <div className="flex items-end gap-3">
            <button
              onClick={() => void load()}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Buscar
            </button>

            <button
              onClick={() => {
                setQ("");
                setActiveFilter("");
              }}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Limpar
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Lista de fornecedores
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Gerencie os fornecedores cadastrados no sistema.
            </p>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <Truck className="h-5 w-5" />
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80">
              <tr className="text-left text-slate-600">
                <th className="px-4 py-3 font-semibold">Fornecedor</th>
                <th className="px-4 py-3 font-semibold">CNPJ</th>
                <th className="px-4 py-3 font-semibold">Contato</th>
                <th className="px-4 py-3 font-semibold">Telefone</th>
                <th className="px-4 py-3 font-semibold">E-mail</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Carregando fornecedores...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Nenhum fornecedor encontrado.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-slate-100 transition hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-4 font-medium text-slate-900">
                      {item.name}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{item.cnpj || "-"}</td>
                    <td className="px-4 py-4 text-slate-600">
                      {item.contact_name || "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{item.phone || "-"}</td>
                    <td className="px-4 py-4 text-slate-600">{item.email || "-"}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          item.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/fornecedores/${item.id}/editar`}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </Link>

                        <button
                          onClick={() => void handleDelete(item.id)}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}