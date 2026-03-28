"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";

type EntryType = "PAGAR" | "RECEBER";
type EntryStatus = "PENDENTE" | "PAGO" | "VENCIDO";

type EntryInput = {
  id: string;
  type: EntryType;
  description: string;
  category: string;
  amount: number;
  due_date: string;
  status: EntryStatus;
  paid_at: string | null;
  notes: string;
};

type Props = {
  mode: "create" | "edit";
  entry?: EntryInput;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function FinanceiroForm({ mode, entry }: Props) {
  const router = useRouter();

  const [type, setType] = useState<EntryType>(entry?.type || "PAGAR");
  const [description, setDescription] = useState(entry?.description || "");
  const [category, setCategory] = useState(entry?.category || "");
  const [amount, setAmount] = useState<number>(entry?.amount || 0);
  const [dueDate, setDueDate] = useState(entry?.due_date || "");
  const [status, setStatus] = useState<EntryStatus>(entry?.status || "PENDENTE");
  const [paidAt, setPaidAt] = useState(
    entry?.paid_at ? entry.paid_at.slice(0, 10) : ""
  );
  const [notes, setNotes] = useState(entry?.notes || "");
  const [loading, setLoading] = useState(false);

  const title = useMemo(() => {
    return type === "PAGAR" ? "Conta a pagar" : "Conta a receber";
  }, [type]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!description.trim()) {
      alert("Informe a descrição.");
      return;
    }

    if (!dueDate) {
      alert("Informe a data de vencimento.");
      return;
    }

    if (amount <= 0) {
      alert("Informe um valor maior que zero.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        type,
        description: description.trim(),
        category: category.trim() || null,
        amount,
        due_date: dueDate,
        status,
        paid_at: paidAt || null,
        notes: notes.trim() || null,
      };

      const response =
        mode === "create"
          ? await fetch("/api/company/financial", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/company/financial/${entry?.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Não foi possível salvar o lançamento.");
      }

      router.push("/financeiro");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao salvar lançamento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,760px)_360px]">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Dados do lançamento
          </h2>

          <Link
            href="/financeiro"
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Tipo
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as EntryType)}
              className="w-full rounded-xl border px-4 py-3"
            >
              <option value="PAGAR">Pagar</option>
              <option value="RECEBER">Receber</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EntryStatus)}
              className="w-full rounded-xl border px-4 py-3"
            >
              <option value="PENDENTE">Pendente</option>
              <option value="PAGO">Pago</option>
              <option value="VENCIDO">Vencido</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Descrição
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex.: aluguel escritório, recebimento cliente XPTO..."
            className="w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Categoria
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex.: aluguel, fornecedor, cliente, salário..."
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Valor
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Vencimento
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Data de pagamento
            </label>
            <input
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Observações
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            className="w-full rounded-xl border px-4 py-3"
            placeholder="Anotações internas do lançamento..."
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {loading
              ? "Salvando..."
              : mode === "create"
              ? "Criar lançamento"
              : "Salvar alterações"}
          </button>
        </div>
      </form>

      <div className="space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Resumo</h3>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-slate-600">Tipo</span>
              <strong
                className={
                  type === "PAGAR" ? "text-red-600" : "text-emerald-600"
                }
              >
                {title}
              </strong>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-slate-600">Valor</span>
              <strong className="text-slate-900">{formatMoney(amount || 0)}</strong>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-slate-600">Vencimento</span>
              <strong className="text-slate-900">
                {dueDate
                  ? new Date(`${dueDate}T00:00:00`).toLocaleDateString("pt-BR")
                  : "-"}
              </strong>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-slate-600">Status</span>
              <strong className="text-slate-900">{status}</strong>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Dica</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Comece usando categorias simples, como:
            <span className="block mt-2">
              aluguel, fornecedor, salário, combustível, cliente, serviço,
              manutenção, impostos.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}