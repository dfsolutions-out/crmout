"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { useState } from "react";

type Props = {
  id: string;
  status: "PENDENTE" | "PAGO" | "VENCIDO";
};

export default function FinanceiroTableActions({ id, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleMarkAsPaid() {
    try {
      setLoading(true);

      const response = await fetch(`/api/company/financial/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "PAGO",
          paid_at: new Date().toISOString(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Não foi possível marcar como pago.");
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao atualizar status.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este lançamento?"
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      const response = await fetch(`/api/company/financial/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Não foi possível excluir.");
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao excluir lançamento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <Link
        href={`/financeiro/${id}/editar`}
        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
      >
        <Pencil className="h-4 w-4" />
        Editar
      </Link>

      {status !== "PAGO" ? (
        <button
          type="button"
          onClick={handleMarkAsPaid}
          disabled={loading}
          className="inline-flex items-center gap-1 text-emerald-600 hover:underline disabled:opacity-50"
        >
          <CheckCircle2 className="h-4 w-4" />
          Marcar como pago
        </button>
      ) : null}

      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="inline-flex items-center gap-1 text-red-600 hover:underline disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
        Excluir
      </button>
    </div>
  );
}