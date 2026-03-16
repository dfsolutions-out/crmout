"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Movement = {
  id: string;
  type: string;
  quantity: number;
  note: string | null;
  created_at: string;
};

type Delivery = {
  id: string;
  quantity: number;
  note: string | null;
  created_at: string;
  employee?: {
    id: string;
    name: string;
  };
};

type ProductDetailsResponse = {
  item: {
    id: string;
    name: string;
    sku: string | null;
    type: string;
    unit: string | null;
    stock: number;
    min_stock: number;
    is_active: boolean;
  };
  movements: Movement[];
  deliveries: Delivery[];
};

type StockForm = {
  action: "IN" | "OUT" | "ADJUST";
  quantity: number;
  note: string;
};

export default function ProdutoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProductDetailsResponse | null>(null);

  const [stockForm, setStockForm] = useState<StockForm>({
    action: "IN",
    quantity: 1,
    note: "",
  });

  useEffect(() => {
    void params.then((value) => setId(value.id));
  }, [params]);

  const load = useCallback(async (productId: string) => {
    try {
      setLoading(true);

      const res = await fetch(`/api/company/products/${productId}`, {
        cache: "no-store",
      });

      const json: ProductDetailsResponse & { error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao carregar produto.");
      }

      setData(json);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar produto.";
      alert(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    void load(id);
  }, [id, load]);

  async function handleStockSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const res = await fetch(`/api/company/products/${id}/stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: stockForm.action,
          quantity: Number(stockForm.quantity),
          note: stockForm.note,
        }),
      });

      const json: { item?: unknown; error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao ajustar estoque.");
      }

      setStockForm({
        action: "IN",
        quantity: 1,
        note: "",
      });

      await load(id);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao ajustar estoque.";
      alert(message);
    }
  }

  if (loading) {
    return <div className="max-w-7xl mx-auto px-6 py-8">Carregando...</div>;
  }

  if (!data) {
    return <div className="max-w-7xl mx-auto px-6 py-8">Produto não encontrado.</div>;
  }

  const { item, movements, deliveries } = data;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{item.name}</h1>
          <p className="text-sm text-slate-600">
            {item.type} • Estoque atual: {item.stock} {item.unit || "UN"}
          </p>
        </div>

        <Link
          href={`/produtos/${item.id}/editar`}
          className="rounded-xl border px-4 py-2 hover:bg-slate-50"
        >
          Editar produto
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border p-5 space-y-3">
          <h2 className="font-semibold text-lg">Informações</h2>
          <div><strong>SKU:</strong> {item.sku || "-"}</div>
          <div><strong>Tipo:</strong> {item.type}</div>
          <div><strong>Unidade:</strong> {item.unit || "-"}</div>
          <div><strong>Estoque:</strong> {item.stock}</div>
          <div><strong>Estoque mínimo:</strong> {item.min_stock}</div>
          <div><strong>Status:</strong> {item.is_active ? "Ativo" : "Inativo"}</div>
        </div>

        <div className="bg-white rounded-2xl border p-5 lg:col-span-2">
          <h2 className="font-semibold text-lg mb-4">Ajuste de estoque</h2>

          <form onSubmit={handleStockSubmit} className="grid md:grid-cols-4 gap-3">
            <select
              value={stockForm.action}
              onChange={(e) =>
                setStockForm((old) => ({
                  ...old,
                  action: e.target.value as StockForm["action"],
                }))
              }
              className="border rounded-xl px-3 py-2"
            >
              <option value="IN">Entrada</option>
              <option value="OUT">Saída</option>
              <option value="ADJUST">Ajuste</option>
            </select>

            <input
              type="number"
              min={1}
              value={stockForm.quantity}
              onChange={(e) =>
                setStockForm((old) => ({
                  ...old,
                  quantity: Number(e.target.value),
                }))
              }
              className="border rounded-xl px-3 py-2"
            />

            <input
              value={stockForm.note}
              onChange={(e) =>
                setStockForm((old) => ({ ...old, note: e.target.value }))
              }
              placeholder="Observação"
              className="border rounded-xl px-3 py-2"
            />

            <button
              type="submit"
              className="rounded-xl bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700"
            >
              Salvar ajuste
            </button>
          </form>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-lg">Movimentações</h2>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3">Data</th>
                  <th className="text-left px-4 py-3">Tipo</th>
                  <th className="text-left px-4 py-3">Qtd</th>
                  <th className="text-left px-4 py-3">Obs</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id} className="border-t">
                    <td className="px-4 py-3">
                      {new Date(movement.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">{movement.type}</td>
                    <td className="px-4 py-3">{movement.quantity}</td>
                    <td className="px-4 py-3">{movement.note || "-"}</td>
                  </tr>
                ))}

                {movements.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-slate-500" colSpan={4}>
                      Nenhuma movimentação registrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-lg">Entregas do produto</h2>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3">Data</th>
                  <th className="text-left px-4 py-3">Funcionário</th>
                  <th className="text-left px-4 py-3">Qtd</th>
                  <th className="text-left px-4 py-3">Obs</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((delivery) => (
                  <tr key={delivery.id} className="border-t">
                    <td className="px-4 py-3">
                      {new Date(delivery.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">{delivery.employee?.name || "-"}</td>
                    <td className="px-4 py-3">{delivery.quantity}</td>
                    <td className="px-4 py-3">{delivery.note || "-"}</td>
                  </tr>
                ))}

                {deliveries.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-slate-500" colSpan={4}>
                      Nenhuma entrega registrada para este produto.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}