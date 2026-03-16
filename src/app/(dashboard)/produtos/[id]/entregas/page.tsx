"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type DeliveryItem = {
  id: string;
  quantity: number;
  note: string | null;
  created_at: string;
  product?: {
    id: string;
    name: string;
    type: string;
    unit: string | null;
  };
};

type EmployeeDeliveriesResponse = {
  employee: {
    id: string;
    name: string;
  };
  items: DeliveryItem[];
  error?: string;
};

export default function EntregasFuncionarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState("");
  const [data, setData] = useState<EmployeeDeliveriesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void params.then((value) => setId(value.id));
  }, [params]);

  const load = useCallback(async (employeeId: string) => {
    try {
      setLoading(true);

      const res = await fetch(`/api/company/employees/${employeeId}/deliveries`, {
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    void load(id);
  }, [id, load]);

  if (loading) {
    return <div className="max-w-7xl mx-auto px-6 py-8">Carregando...</div>;
  }

  if (!data) {
    return <div className="max-w-7xl mx-auto px-6 py-8">Funcionário não encontrado.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Entregas de {data.employee.name}</h1>
          <p className="text-sm text-slate-600">
            Histórico completo de EPI e uniforme.
          </p>
        </div>

        <Link
          href={`/funcionarios/${data.employee.id}/entregas/nova`}
          className="rounded-xl bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700"
        >
          Nova entrega
        </Link>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3">Data</th>
                <th className="text-left px-4 py-3">Produto</th>
                <th className="text-left px-4 py-3">Tipo</th>
                <th className="text-left px-4 py-3">Qtd</th>
                <th className="text-left px-4 py-3">Obs</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-3">
                    {new Date(item.created_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">{item.product?.name || "-"}</td>
                  <td className="px-4 py-3">{item.product?.type || "-"}</td>
                  <td className="px-4 py-3">
                    {item.quantity} {item.product?.unit || "UN"}
                  </td>
                  <td className="px-4 py-3">{item.note || "-"}</td>
                </tr>
              ))}

              {data.items.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={5}>
                    Nenhuma entrega registrada para este funcionário.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}