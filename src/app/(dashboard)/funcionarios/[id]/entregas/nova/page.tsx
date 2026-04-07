"use client";

import { useRouter, useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PackagePlus,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
} from "lucide-react";

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
    note: string | null;
    created_at: string;
    items?: Array<{
      id: string;
      quantity: number;
      product?: {
        id: string;
        name: string;
        type: string;
        unit: string | null;
      } | null;
    }>;
  }>;
  error?: string;
};

type DeliveryLine = {
  product_id: string;
  quantity: number;
};

type DeliveryBody = {
  employee_id: string;
  note: string;
  items: DeliveryLine[];
};

export default function NovaEntregaPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const employeeId = String(params.id || "");

  const [employeeName, setEmployeeName] = useState("Carregando...");
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);

  const [note, setNote] = useState("");
  const [lines, setLines] = useState<DeliveryLine[]>([
    { product_id: "", quantity: 1 },
  ]);

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

  const selectedProductsInfo = useMemo(() => {
    return lines
      .map((line, index) => {
        const product =
          products.find((productItem) => productItem.id === line.product_id) ||
          null;

        return {
          index,
          line,
          product,
        };
      })
      .filter((entry) => entry.product);
  }, [lines, products]);

  function updateLine(index: number, patch: Partial<DeliveryLine>) {
    setLines((old) =>
      old.map((line, currentIndex) =>
        currentIndex === index ? { ...line, ...patch } : line
      )
    );
  }

  function addLine() {
    setLines((old) => [...old, { product_id: "", quantity: 1 }]);
  }

  function removeLine(index: number) {
    setLines((old) => {
      if (old.length === 1) {
        return [{ product_id: "", quantity: 1 }];
      }

      return old.filter((_, currentIndex) => currentIndex !== index);
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);

      const validLines = lines
        .map((line) => ({
          product_id: String(line.product_id || "").trim(),
          quantity: Number(line.quantity),
        }))
        .filter(
          (line) =>
            line.product_id && Number.isFinite(line.quantity) && line.quantity > 0
        );

      if (validLines.length === 0) {
        throw new Error("Adicione pelo menos um item válido.");
      }

      const payload: DeliveryBody = {
        employee_id: employeeId,
        note,
        items: validLines,
      };

      const res = await fetch("/api/company/deliveries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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
              Funcionário:{" "}
              <span className="font-semibold text-slate-800">{employeeName}</span>
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
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Itens da entrega
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Adicione quantos itens forem necessários para o mesmo funcionário.
            </p>
          </div>

          <button
            type="button"
            onClick={addLine}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
            Adicionar item
          </button>
        </div>

        <div className="space-y-4">
          {lines.map((line, index) => {
            const selectedProduct =
              products.find((product) => product.id === line.product_id) || null;

            return (
              <div
                key={index}
                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Item {index + 1}
                  </h3>

                  <button
                    type="button"
                    onClick={() => removeLine(index)}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remover
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-[1.8fr_0.7fr]">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Produto
                    </label>
                    <select
                      required
                      value={line.product_id}
                      onChange={(e) =>
                        updateLine(index, { product_id: e.target.value })
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

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(index, { quantity: Number(e.target.value) })
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {selectedProduct ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700">
                    Tipo: <strong>{selectedProduct.type}</strong> • Estoque disponível:{" "}
                    <strong>
                      {selectedProduct.stock} {selectedProduct.unit || "UN"}
                    </strong>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {selectedProductsInfo.length > 0 ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <h3 className="text-sm font-semibold text-slate-800">
              Resumo da entrega
            </h3>

            <div className="mt-3 space-y-2 text-sm text-slate-600">
              {selectedProductsInfo.map(({ index, line, product }) => (
                <div key={index}>
                  {line.quantity} {product?.unit || "UN"} -{" "}
                  <strong>{product?.name}</strong>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Observação geral da entrega
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={5}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            placeholder="Ex.: entrega inicial / uniforme completo / reposição"
          />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#12325F] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Registrar entrega"}
            {!saving ? <ArrowRight className="h-4 w-4" /> : null}
          </button>
        </div>
      </form>
    </div>
  );
}