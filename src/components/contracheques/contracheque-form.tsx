"use client";

import { useMemo, useState } from "react";
import { Printer, ArrowLeft, Calculator } from "lucide-react";
import Link from "next/link";

type Employee = {
  id: string;
  full_name: string | null;
  cpf: string | null;
  job_title: string | null;
  is_active: boolean | null;
};

type Props = {
  employees: Employee[];
  initialEmployeeId?: string;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatCpf(value?: string | null) {
  if (!value) return "-";
  return value;
}

function monthOptions() {
  return [
    { value: "01", label: "Janeiro" },
    { value: "02", label: "Fevereiro" },
    { value: "03", label: "Março" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Maio" },
    { value: "06", label: "Junho" },
    { value: "07", label: "Julho" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ];
}

export default function ContrachequeForm({
  employees,
  initialEmployeeId = "",
}: Props) {
  const today = new Date();
  const currentMonth = String(today.getMonth() + 1).padStart(2, "0");
  const currentYear = String(today.getFullYear());

  const [employeeId, setEmployeeId] = useState(initialEmployeeId);
  const [referenceMonth, setReferenceMonth] = useState(currentMonth);
  const [referenceYear, setReferenceYear] = useState(currentYear);

  const selectedEmployee = useMemo(
    () => employees.find((item) => item.id === employeeId) ?? null,
    [employees, employeeId]
  );

  const [salaryBase, setSalaryBase] = useState<number>(0);
  const [overtimeValue, setOvertimeValue] = useState<number>(0);
  const [otherEarnings, setOtherEarnings] = useState<number>(0);
  const [discounts, setDiscounts] = useState<number>(0);

  const grossTotal = useMemo(() => {
    return salaryBase + overtimeValue + otherEarnings;
  }, [salaryBase, overtimeValue, otherEarnings]);

  const netTotal = useMemo(() => {
    const result = grossTotal - discounts;
    return result < 0 ? 0 : result;
  }, [grossTotal, discounts]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }

          .print-area,
          .print-area * {
            visibility: visible;
          }

          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }

          .no-print {
            display: none !important;
          }

          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="no-print space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Dados do contracheque
              </h2>

              <Link
                href="/contracheques"
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Funcionário
                </label>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
                >
                  <option value="">Selecione</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.full_name || "Sem nome"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Mês de referência
                  </label>
                  <select
                    value={referenceMonth}
                    onChange={(e) => setReferenceMonth(e.target.value)}
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
                  >
                    {monthOptions().map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Ano
                  </label>
                  <input
                    type="number"
                    value={referenceYear}
                    onChange={(e) => setReferenceYear(e.target.value)}
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Salário base
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={salaryBase}
                  onChange={(e) => setSalaryBase(Number(e.target.value))}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Horas extras
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={overtimeValue}
                  onChange={(e) => setOvertimeValue(Number(e.target.value))}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Outros proventos
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={otherEarnings}
                  onChange={(e) => setOtherEarnings(Number(e.target.value))}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Descontos
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discounts}
                  onChange={(e) => setDiscounts(Number(e.target.value))}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-slate-700" />
              <h3 className="text-lg font-semibold text-slate-900">Resumo</h3>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-slate-600">Total bruto</span>
                <strong className="text-slate-900">{formatMoney(grossTotal)}</strong>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-slate-600">Total descontos</span>
                <strong className="text-slate-900">{formatMoney(discounts)}</strong>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
                <span className="font-medium text-emerald-700">Total líquido</span>
                <strong className="text-emerald-700">{formatMoney(netTotal)}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              disabled={!selectedEmployee}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              Gerar impressão
            </button>
          </div>
        </div>

        <div className="print-area rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mx-auto w-full max-w-[794px] bg-white">
            <div className="border border-slate-300">
              <div className="border-b bg-slate-100 px-6 py-4 text-center">
                <h2 className="text-lg font-bold text-slate-900">
                  DELTA SERVIÇOS
                </h2>
                <p className="text-sm text-slate-600">
                  Demonstrativo de Pagamento Salarial
                </p>
              </div>

              <div className="grid grid-cols-2 gap-0 border-b text-sm md:grid-cols-4">
                <div className="border-r border-b px-4 py-3 md:border-b-0">
                  <p className="text-xs text-slate-500">Funcionário</p>
                  <p className="font-semibold text-slate-900">
                    {selectedEmployee?.full_name || "-"}
                  </p>
                </div>

                <div className="border-r border-b px-4 py-3 md:border-b-0">
                  <p className="text-xs text-slate-500">CPF</p>
                  <p className="font-semibold text-slate-900">
                    {formatCpf(selectedEmployee?.cpf)}
                  </p>
                </div>

                <div className="border-r px-4 py-3">
                  <p className="text-xs text-slate-500">Função</p>
                  <p className="font-semibold text-slate-900">
                    {selectedEmployee?.job_title || "-"}
                  </p>
                </div>

                <div className="px-4 py-3">
                  <p className="text-xs text-slate-500">Referência</p>
                  <p className="font-semibold text-slate-900">
                    {referenceMonth}/{referenceYear}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 border-b text-sm">
                <div className="border-r px-4 py-3">
                  <p className="text-xs text-slate-500">Empresa</p>
                  <p className="font-semibold text-slate-900">Delta Serviços</p>
                </div>

                <div className="px-4 py-3">
                  <p className="text-xs text-slate-500">Salário base</p>
                  <p className="font-semibold text-slate-900">
                    {formatMoney(salaryBase)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2">
                <div className="border-r">
                  <div className="border-b bg-slate-50 px-4 py-3">
                    <h3 className="font-semibold text-slate-900">Proventos</h3>
                  </div>

                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-2 text-left font-medium text-slate-600">
                          Descrição
                        </th>
                        <th className="px-4 py-2 text-right font-medium text-slate-600">
                          Valor
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="px-4 py-3">Salário base</td>
                        <td className="px-4 py-3 text-right">
                          {formatMoney(salaryBase)}
                        </td>
                      </tr>

                      <tr className="border-b">
                        <td className="px-4 py-3">Horas extras</td>
                        <td className="px-4 py-3 text-right">
                          {formatMoney(overtimeValue)}
                        </td>
                      </tr>

                      <tr>
                        <td className="px-4 py-3">Outros proventos</td>
                        <td className="px-4 py-3 text-right">
                          {formatMoney(otherEarnings)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <div className="border-b bg-slate-50 px-4 py-3">
                    <h3 className="font-semibold text-slate-900">Descontos</h3>
                  </div>

                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-2 text-left font-medium text-slate-600">
                          Descrição
                        </th>
                        <th className="px-4 py-2 text-right font-medium text-slate-600">
                          Valor
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-3">Descontos gerais</td>
                        <td className="px-4 py-3 text-right">
                          {formatMoney(discounts)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-3 border-t bg-slate-50">
                <div className="border-r px-4 py-4">
                  <p className="text-xs text-slate-500">Total bruto</p>
                  <p className="mt-1 text-base font-bold text-slate-900">
                    {formatMoney(grossTotal)}
                  </p>
                </div>

                <div className="border-r px-4 py-4">
                  <p className="text-xs text-slate-500">Total descontos</p>
                  <p className="mt-1 text-base font-bold text-slate-900">
                    {formatMoney(discounts)}
                  </p>
                </div>

                <div className="px-4 py-4">
                  <p className="text-xs text-slate-500">Total líquido</p>
                  <p className="mt-1 text-base font-bold text-emerald-700">
                    {formatMoney(netTotal)}
                  </p>
                </div>
              </div>

              <div className="px-6 py-10">
                <div className="mx-auto mt-10 max-w-md border-t pt-3 text-center text-sm text-slate-700">
                  Assinatura do funcionário
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}