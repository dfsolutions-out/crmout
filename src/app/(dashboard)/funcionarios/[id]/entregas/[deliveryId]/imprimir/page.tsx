"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type DeliveryResponse = {
  employee?: {
    id: string;
    name: string;
    company_id?: string | null;
    job_title?: string | null;
  };
  delivery?: {
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
        sku?: string | null;
      } | null;
    }>;
  };
  error?: string;
};

export default function ImprimirEntregaPage({
  params,
}: {
  params: Promise<{ id: string; deliveryId: string }>;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [deliveryId, setDeliveryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DeliveryResponse | null>(null);

  useEffect(() => {
    void params.then((value) => {
      setEmployeeId(value.id);
      setDeliveryId(value.deliveryId);
    });
  }, [params]);

  const load = useCallback(async (empId: string, delId: string) => {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/company/employees/${empId}/deliveries/${delId}`,
        { cache: "no-store" }
      );

      const json: DeliveryResponse = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao carregar termo.");
      }

      setData(json);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar termo.";
      alert(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!employeeId || !deliveryId) return;
    void load(employeeId, deliveryId);
  }, [employeeId, deliveryId, load]);

  const totalQuantity = useMemo(() => {
    return (data?.delivery?.items ?? []).reduce(
      (total, item) => total + item.quantity,
      0
    );
  }, [data]);

  if (loading) {
    return <div className="max-w-4xl mx-auto px-6 py-8">Carregando...</div>;
  }

  if (!data?.employee || !data?.delivery) {
    return <div className="max-w-4xl mx-auto px-6 py-8">Termo não encontrado.</div>;
  }

  const employee = data.employee;
  const delivery = data.delivery;
  const items = delivery.items ?? [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="print:hidden flex justify-end mb-6">
        <button
          onClick={() => window.print()}
          className="rounded-xl bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700"
        >
          Imprimir
        </button>
      </div>

      <div className="bg-white rounded-2xl border p-10 text-slate-900">
        <h1 className="text-2xl font-bold text-center mb-8">
          TERMO DE ENTREGA DE EPI / UNIFORME
        </h1>

        <div className="grid gap-3 text-base">
          <p>
            <strong>Funcionário:</strong> {employee.name}
          </p>

          <p>
            <strong>Função:</strong> {employee.job_title || "-"}
          </p>

          <p>
            <strong>Data da entrega:</strong>{" "}
            {new Date(delivery.created_at).toLocaleString("pt-BR")}
          </p>

          <p>
            <strong>Quantidade total de itens:</strong> {totalQuantity}
          </p>

          <p>
            <strong>Observação:</strong> {delivery.note || "-"}
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left">Produto</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">CA</th>
                <th className="px-4 py-3 text-left">Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-3">{item.product?.name || "-"}</td>
                  <td className="px-4 py-3">{item.product?.type || "-"}</td>
                  <td className="px-4 py-3">{item.product?.sku || "-"}</td>
                  <td className="px-4 py-3">
                    {item.quantity} {item.product?.unit || "UN"}
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    Nenhum item encontrado nesta entrega.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-10 space-y-4 leading-7">
          <p>
            Declaro para os devidos fins que recebi o(s) item(ns) acima descrito(s),
            em perfeitas condições de uso, comprometendo-me a utilizá-lo(s) de forma
            correta durante o exercício das minhas atividades.
          </p>

          <p>
            Declaro ainda estar ciente da minha responsabilidade quanto à guarda,
            conservação e uso adequado do(s) equipamento(s) e/ou uniforme(s)
            entregue(s).
          </p>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="text-center">
            <div className="border-t pt-3">Assinatura do Funcionário</div>
          </div>

          <div className="text-center">
            <div className="border-t pt-3">Assinatura da Empresa</div>
          </div>
        </div>
      </div>
    </div>
  );
}