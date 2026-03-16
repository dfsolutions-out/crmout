"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
  type: "EPI" | "UNIFORME" | "OUTRO";
  unit: string | null;
  stock: number;
  is_active: boolean;
  company_id?: string | null;
};

type ProductsResponse = {
  items?: Product[];
  error?: string;
};

type EmployeeResponse = {
  employee?: {
    id: string;
    name: string;
    company_id?: string | null;
  };
  items?: Array<{
    id: string;
    quantity: number;
    note: string | null;
    created_at: string;
  }>;
  error?: string;
};

type DeliveryForm = {
  product_id: string;
  quantity: number;
  note: string;
};

export default function NovaEntregaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("Carregando...");
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<DeliveryForm>({
    product_id: "",
    quantity: 1,
    note: "",
  });

  useEffect(() => {
    void params.then((value) => setEmployeeId(value.id));
  }, [params]);

  const loadProducts = useCallback(async () => {
    const res = await fetch("/api/company/products?active=true", {
      cache: "no-store",
    });

    const json: ProductsResponse = await res.json();

    if (!res.ok) {
      throw new Error(json.error || "Erro ao carregar produtos.");
    }

    setProducts((json.items ?? []).filter((product) => product.stock > 0));
  }, []);

  const loadEmployee = useCallback(async (id: string) => {
    const res = await fetch(`/api/company/employees/${id}/deliveries`, {
      cache: "no-store",
    });

    const json: EmployeeResponse = await res.json();

    if (!res.ok) {
      throw new Error(json.error || "Erro ao carregar funcionário.");
    }

    setEmployeeName(json.employee?.name || "Funcionário");
  }, []);

  useEffect(() => {
    if (!employeeId) return;

    async function run() {
      try {
        await Promise.all([loadProducts(), loadEmployee(employeeId)]);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao carregar dados.";
        alert(message);
      }
    }

    void run();
  }, [employeeId, loadEmployee, loadProducts]);

  const selectedProduct = useMemo(() => {
    return products.find((product) => product.id === form.product_id) || null;
  }, [form.product_id, products]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);

      const res = await fetch("/api/company/deliveries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee_id: employeeId,
          product_id: form.product_id,
          quantity: Number(form.quantity),
          note: form.note,
        }),
      });

      const json: { item?: { id: string }; error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao registrar entrega.");
      }

      router.push(`/funcionarios/${employeeId}/entregas`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao registrar entrega.";
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-1">Nova entrega</h1>
      <p className="text-sm text-slate-600 mb-6">
        Funcionário: <strong>{employeeName}</strong>
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Produto</label>
          <select
            required
            value={form.product_id}
            onChange={(e) =>
              setForm((old) => ({ ...old, product_id: e.target.value }))
            }
            className="w-full border rounded-xl px-3 py-2"
          >
            <option value="">Selecione</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} - estoque: {product.stock} {product.unit || "UN"}
              </option>
            ))}
          </select>
        </div>

        {selectedProduct && (
          <div className="text-sm text-slate-600">
            Tipo: <strong>{selectedProduct.type}</strong> • Estoque disponível:{" "}
            <strong>
              {selectedProduct.stock} {selectedProduct.unit || "UN"}
            </strong>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Quantidade</label>
          <input
            type="number"
            min={1}
            required
            value={form.quantity}
            onChange={(e) =>
              setForm((old) => ({ ...old, quantity: Number(e.target.value) }))
            }
            className="w-full border rounded-xl px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Observação</label>
          <textarea
            value={form.note}
            onChange={(e) => setForm((old) => ({ ...old, note: e.target.value }))}
            rows={4}
            className="w-full border rounded-xl px-3 py-2"
            placeholder="Ex: entrega inicial / reposição / troca"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Registrar entrega"}
        </button>
      </form>
    </div>
  );
}