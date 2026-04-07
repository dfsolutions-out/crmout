"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type ProductType = "EPI" | "UNIFORME" | "OUTRO";

type ProductResponse = {
  item: {
    id: string;
    name: string;
    sku: string | null;
    type: ProductType;
    unit: string | null;
    min_stock: number;
    is_active: boolean;
  };
  error?: string;
};

type EditForm = {
  name: string;
  sku: string;
  type: ProductType;
  unit: string;
  min_stock: number;
  is_active: boolean;
};

export default function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  const [id, setId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<EditForm>({
    name: "",
    sku: "",
    type: "EPI",
    unit: "UN",
    min_stock: 0,
    is_active: true,
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

      const json: ProductResponse = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao carregar produto.");
      }

      setForm({
        name: json.item.name || "",
        sku: json.item.sku || "",
        type: json.item.type || "EPI",
        unit: json.item.unit || "UN",
        min_stock: json.item.min_stock || 0,
        is_active: Boolean(json.item.is_active),
      });
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);

      const res = await fetch(`/api/company/products/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const json: { item?: { id: string }; error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao salvar alterações.");
      }

      router.push(`/produtos/${id}`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao salvar alterações.";
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="max-w-3xl mx-auto px-6 py-8">Carregando...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Editar produto</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nome</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((old) => ({ ...old, name: e.target.value }))}
            className="w-full border rounded-xl px-3 py-2"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">CA</label>
            <input
              value={form.sku}
              onChange={(e) => setForm((old) => ({ ...old, sku: e.target.value }))}
              className="w-full border rounded-xl px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tipo</label>
            <select
              value={form.type}
              onChange={(e) =>
                setForm((old) => ({ ...old, type: e.target.value as ProductType }))
              }
              className="w-full border rounded-xl px-3 py-2"
            >
              <option value="EPI">EPI</option>
              <option value="UNIFORME">UNIFORME</option>
              <option value="OUTRO">OUTRO</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Unidade</label>
            <input
              value={form.unit}
              onChange={(e) => setForm((old) => ({ ...old, unit: e.target.value }))}
              className="w-full border rounded-xl px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Estoque mínimo</label>
            <input
              type="number"
              min={0}
              value={form.min_stock}
              onChange={(e) =>
                setForm((old) => ({ ...old, min_stock: Number(e.target.value) }))
              }
              className="w-full border rounded-xl px-3 py-2"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) =>
              setForm((old) => ({ ...old, is_active: e.target.checked }))
            }
          />
          Produto ativo
        </label>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </div>
  );
}