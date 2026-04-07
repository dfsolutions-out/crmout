"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ProductType = "EPI" | "UNIFORME" | "OUTRO";

type CreateProductBody = {
  name: string;
  sku: string;
  type: ProductType;
  unit: string;
  stock: number;
  min_stock: number;
  is_active: boolean;
};

export default function NovoProdutoPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<CreateProductBody>({
    name: "",
    sku: "",
    type: "EPI",
    unit: "UN",
    stock: 0,
    min_stock: 0,
    is_active: true,
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);

      const res = await fetch("/api/company/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const json: { item?: { id: string }; error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao criar produto.");
      }

      router.push("/produtos");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao criar produto.";
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Novo produto</h1>

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

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Unidade</label>
            <input
              value={form.unit}
              onChange={(e) => setForm((old) => ({ ...old, unit: e.target.value }))}
              className="w-full border rounded-xl px-3 py-2"
              placeholder="UN / PAR / CX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Estoque inicial</label>
            <input
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) =>
                setForm((old) => ({ ...old, stock: Number(e.target.value) }))
              }
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
          {saving ? "Salvando..." : "Salvar produto"}
        </button>
      </form>
    </div>
  );
}