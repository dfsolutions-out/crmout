"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PackageCheck, Plus, Printer, ArrowLeft } from "lucide-react";

type DeliveryItem = {
  id: string;
  quantity: number;
  product?: {
    id: string;
    name: string;
    type: string;
    unit: string | null;
  } | null;
};

type DeliveryGroup = {
  id: string;
  note: string | null;
  created_at: string;
  items?: DeliveryItem[];
};

type EmployeeDeliveriesResponse = {
  employee?: {
    id: string;
    name: string;
  };
  items?: DeliveryGroup[];
  error?: string;
};

export default function EntregasFuncionarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EmployeeDeliveriesResponse | null>(null);

  useEffect(() => {
    void params.then((value) => setEmployeeId(value.id));
  }, [params]);

  const load = useCallback(async (id: string) => {
    try {
      setLoading(true);

      const res = await fetch(`/api/company/employees/${id}/deliveries`, {
        cache: "no-store",
      });

      const json: EmployeeDeliveriesResponse = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao carregar entregas.");
      }

      setData(json);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar entregas.";
      alert(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!employeeId) return;
    void load(employeeId);
  }, [employeeId, load]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-slate-500">Carregando entregas...</p>
        </div>
      </div>
    );
  }

  if (!data?.employee) {
    return (
      <div className="space-y-6">
        <div className="rounded-[28px] border border-red-200 bg-white p-8 shadow-sm">
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            Funcionário não encontrado.
          </p>
        </div>
      </div>
    );
  }

  const employee = data.employee;
  const items = data.items ?? [];

  function buildItemsSummary(delivery: DeliveryGroup) {
    const deliveryItems = delivery.items ?? [];

    if (deliveryItems.length === 0) return "-";

    return deliveryItems
      .map((item) => {
        const unit = item.product?.unit || "UN";
        const name = item.product?.name || "Item";
        return `${item.quantity} ${unit} - ${name}`;
      })
      .join(", ");
  }

  function countTotalQuantity(delivery: DeliveryGroup) {
    return (delivery.items ?? []).reduce((total, item) => total + item.quantity, 0);
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[30px] border border-slate-200 bg-white px-8 py-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              <PackageCheck className="h-4 w-4" />
              Histórico de entregas
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              {employee.name}
            </h1>

            <p className="mt-3 text-base leading-7 text-slate-600">
              Histórico completo de EPI e uniforme entregues ao funcionário.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/funcionarios/${employee.id}/entregas/nova`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#12325F] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
            >
              <Plus className="h-4 w-4" />
              Nova entrega
            </Link>

            <Link
              href={`/funcionarios/${employee.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Lista de entregas
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Cada linha representa uma entrega completa, podendo conter vários itens.
            </p>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <PackageCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80">
              <tr className="text-left text-slate-600">
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Itens entregues</th>
                <th className="px-4 py-3 font-semibold">Qtd total</th>
                <th className="px-4 py-3 font-semibold">Obs</th>
                <th className="px-4 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>

            <tbody>
              {items.map((delivery) => (
                <tr
                  key={delivery.id}
                  className="border-t border-slate-100 transition hover:bg-slate-50/70"
                >
                  <td className="px-4 py-4 text-slate-600">
                    {new Date(delivery.created_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-4 font-medium text-slate-900">
                    {buildItemsSummary(delivery)}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {countTotalQuantity(delivery)}
                  </td>
                  <td className="px-4 py-4 text-slate-500">
                    {delivery.note || "-"}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end">
                      <Link
                        href={`/funcionarios/${employee.id}/entregas/${delivery.id}/imprimir`}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <Printer className="h-4 w-4" />
                        Imprimir
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                    Nenhuma entrega registrada para este funcionário.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}