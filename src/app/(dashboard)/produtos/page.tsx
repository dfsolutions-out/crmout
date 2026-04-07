"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
  sku: string | null;
  type: "EPI" | "UNIFORME" | "OUTRO";
  unit: string | null;
  stock: number;
  min_stock: number;
  is_active: boolean;
  created_at: string;
};

export default function ProdutosPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (type) params.set("type", type);

      const res = await fetch(`/api/company/products?${params.toString()}`, {
        cache: "no-store",
      });

      const json: { items?: Product[]; error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao carregar produtos.");
      }

      setItems(json.items ?? []);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar produtos.";
      alert(message);
    } finally {
      setLoading(false);
    }
  }, [q, type]);

  useEffect(() => {
    void load();
  }, [load]);

  const lowStockIds = useMemo(() => {
    return new Set(
      items.filter((item) => item.stock <= item.min_stock).map((item) => item.id)
    );
  }, [items]);

  async function handleDelete(id: string) {
    const ok = window.confirm("Deseja realmente excluir este produto?");
    if (!ok) return;

    try {
      const res = await fetch(`/api/company/products/${id}`, {
        method: "DELETE",
      });

      const json: { ok?: boolean; error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao excluir produto.");
      }

      await load();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao excluir produto.";
      alert(message);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-sm text-slate-600">
            Cadastre e controle EPI, uniforme e outros itens.
          </p>
        </div>

        <Link
          href="/produtos/novo"
          className="rounded-xl bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700"
        >
          Novo produto
        </Link>
      </div>

      <div className="bg-white rounded-2xl border p-4 mb-6 grid md:grid-cols-4 gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome ou CA"
          className="border rounded-xl px-3 py-2"
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border rounded-xl px-3 py-2"
        >
          <option value="">Todos os tipos</option>
          <option value="EPI">EPI</option>
          <option value="UNIFORME">UNIFORME</option>
          <option value="OUTRO">OUTRO</option>
        </select>

        <button
          onClick={() => void load()}
          className="rounded-xl border px-4 py-2 font-medium hover:bg-slate-50"
        >
          Buscar
        </button>

        <button
          onClick={() => {
            setQ("");
            setType("");
          }}
          className="rounded-xl border px-4 py-2 font-medium hover:bg-slate-50"
        >
          Limpar
        </button>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        {loading ? (
          <div className="p-6 text-slate-500">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-slate-500">Nenhum produto encontrado.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3">Produto</th>
                  <th className="text-left px-4 py-3">Tipo</th>
                  <th className="text-left px-4 py-3">CA</th>
                  <th className="text-left px-4 py-3">Unidade</th>
                  <th className="text-left px-4 py-3">Estoque</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const low = lowStockIds.has(item.id);

                  return (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.name}</div>
                        {low && (
                          <div className="text-xs text-red-600">Estoque baixo</div>
                        )}
                      </td>
                      <td className="px-4 py-3">{item.type}</td>
                      <td className="px-4 py-3">{item.sku || "-"}</td>
                      <td className="px-4 py-3">{item.unit || "-"}</td>
                      <td className="px-4 py-3">
                        {item.stock} {item.unit || "UN"}
                      </td>
                      <td className="px-4 py-3">
                        {item.is_active ? "Ativo" : "Inativo"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/produtos/${item.id}`}
                            className="rounded-lg border px-3 py-1.5 hover:bg-slate-50"
                          >
                            Ver
                          </Link>
                          <Link
                            href={`/produtos/${item.id}/editar`}
                            className="rounded-lg border px-3 py-1.5 hover:bg-slate-50"
                          >
                            Editar
                          </Link>
                          <button
                            onClick={() => void handleDelete(item.id)}
                            className="rounded-lg border px-3 py-1.5 text-red-600 hover:bg-red-50"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}