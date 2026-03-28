"use client";

import { useRouter, useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PackagePlus, ArrowLeft, ArrowRight } from "lucide-react";

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

export default function NovaEntregaPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const employeeId = String(params.id || "");

  const [employeeName, setEmployeeName] = useState("Carregando...");
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<DeliveryForm>({
    product_id: "",
    quantity: 1,
    note: "",
  });

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
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao registrar entrega.";
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
              <PackagePlus className="h-4 w-4" />
              Registro de entrega
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              Nova entrega
            </h1>

            <p className="mt-3 text-base leading-7 text-slate-600">
              Funcionário: <span className="font-semibold text-slate-800">{employeeName}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push(`/funcionarios/${employeeId}/entregas`)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
          </div>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="mb-5">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Dados da entrega
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Selecione o produto, informe a quantidade e registre uma observação.
          </p>
        </div>

        <div className="grid gap-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Produto
            </label>
            <select
              required
              value={form.product_id}
              onChange={(e) =>
                setForm((old) => ({ ...old, product_id: e.target.value }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Selecione</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - estoque: {product.stock} {product.unit || "UN"}
                </option>
              ))}
            </select>
          </div>

          {selectedProduct ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
              Tipo: <strong>{selectedProduct.type}</strong> • Estoque disponível:{" "}
              <strong>
                {selectedProduct.stock} {selectedProduct.unit || "UN"}
              </strong>
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Quantidade
            </label>
            <input
              type="number"
              min={1}
              required
              value={form.quantity}
              onChange={(e) =>
                setForm((old) => ({ ...old, quantity: Number(e.target.value) }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Observação
            </label>
            <textarea
              value={form.note}
              onChange={(e) => setForm((old) => ({ ...old, note: e.target.value }))}
              rows={5}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              placeholder="Ex.: entrega inicial / reposição / troca"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#12325F] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Registrar entrega"}
              {!saving ? <ArrowRight className="h-4 w-4" /> : null}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}