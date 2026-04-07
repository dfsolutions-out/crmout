import { notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { PrintButton } from "@/src/components/print-button";

type SearchParams = {
  month?: string;
  year?: string;
};

type FolhaPontoPrintPageProps = {
  params: Promise<{ employeeId: string }>;
  searchParams: Promise<SearchParams>;
};

type EmployeeRow = {
  id: string;
  company_id: string;
  full_name: string | null;
  cpf: string | null;
  ctps: string | null;
  job_title: string | null;
  work_days: string[] | null;
  entry_time: string | null;
  lunch_start_time: string | null;
  lunch_end_time: string | null;
  exit_time: string | null;
  is_active: boolean | null;
};

function monthName(month: number) {
  return [
    "JANEIRO",
    "FEVEREIRO",
    "MARÇO",
    "ABRIL",
    "MAIO",
    "JUNHO",
    "JULHO",
    "AGOSTO",
    "SETEMBRO",
    "OUTUBRO",
    "NOVEMBRO",
    "DEZEMBRO",
  ][month - 1];
}

function weekDayName(date: Date) {
  return [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ][date.getDay()];
}

function buildMonthDays(month: number, year: number) {
  const totalDays = new Date(year, month, 0).getDate();

  return Array.from({ length: totalDays }, (_, index) => {
    const day = index + 1;
    const date = new Date(year, month - 1, day);

    return {
      day,
      weekDay: weekDayName(date),
    };
  });
}

function cleanTime(value: string | null) {
  if (!value) return "__:__";
  return value.slice(0, 5);
}

function formatWorkJourney(employee: EmployeeRow) {
  const entry = cleanTime(employee.entry_time);
  const lunchStart = cleanTime(employee.lunch_start_time);
  const lunchEnd = cleanTime(employee.lunch_end_time);
  const exit = cleanTime(employee.exit_time);

  return `Entrada: ${entry} Intervalo: ${lunchStart} às ${lunchEnd} Saída: ${exit}`;
}

function getCompanyDisplay(company: Record<string, unknown> | null) {
  const name =
    (company?.corporate_name as string) ||
    (company?.legal_name as string) ||
    (company?.trade_name as string) ||
    (company?.name as string) ||
    "DELTA SERVIÇOS PATRIMONIAL LTDA";

  const cnpj =
    (company?.cnpj as string) ||
    (company?.document as string) ||
    (company?.tax_id as string) ||
    "03.701.675/0001-56";

  const address =
    ((company?.address as string) || "").trim() ||
    "AV. WASHINGTON LUIZ 13620 – QD 03 LT 05 A BOX 121";

  return { name, cnpj, address };
}

export default async function FolhaPontoPrintPage({
  params,
  searchParams,
}: FolhaPontoPrintPageProps) {
  const { employeeId } = await params;
  const query = await searchParams;

  const month = Number(query.month || new Date().getMonth() + 1);
  const year = Number(query.year || new Date().getFullYear());

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership, error: membershipError } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (membershipError || !membership) notFound();

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select(
      `
      id,
      company_id,
      full_name,
      cpf,
      ctps,
      job_title,
      work_days,
      entry_time,
      lunch_start_time,
      lunch_end_time,
      exit_time,
      is_active
    `,
    )
    .eq("id", employeeId)
    .eq("company_id", membership.company_id)
    .single();

  if (employeeError || !employee) notFound();

  const employeeTyped = employee as EmployeeRow;

  const { data: companyData } = await supabase
    .from("companies")
    .select("*")
    .eq("id", membership.company_id)
    .single();

  const company = getCompanyDisplay(
    (companyData as Record<string, unknown> | null) ?? null,
  );

  const days = buildMonthDays(month, year);

  return (
    <div className="bg-slate-100 p-4 print:bg-white print:p-0">
      <style>{`
        @page {
          size: A4 portrait;
          margin: 7mm 10mm;
        }

        @media print {
          html, body {
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="mx-auto mb-4 flex max-w-[900px] justify-end print:hidden">
        <PrintButton />
      </div>

      <div className="mx-auto max-w-[900px] bg-white p-3 text-black print:max-w-none print:p-0">
        <div
          className="border border-black bg-white"
          style={{
            width: "100%",
            height: "305mm",
            fontFamily: "Calibri, Arial, sans-serif",
            fontSize: "9.4px",
            lineHeight: "1.15",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            className="border-b border-black text-center font-bold"
            style={{ fontSize: "14px", padding: "11px 6px" }}
          >
            FOLHA INDIVIDUAL DE PONTO
          </div>

          <div
            className="grid border-b border-black"
            style={{ gridTemplateColumns: "58% 42%" }}
          >
            <div
              className="border-r border-black"
              style={{ padding: "8px 6px" }}
            >
              Empresa: {company.name}
            </div>
            <div style={{ padding: "8px 6px", textAlign: "center" }}>
              CNPJ: {company.cnpj || "—"}
            </div>
          </div>

          <div className="border-b border-black" style={{ padding: "8px 6px" }}>
            Endereço: {company.address || "—"}
          </div>

          <div
            className="grid border-b border-black"
            style={{ gridTemplateColumns: "58% 42%" }}
          >
            <div
              className="border-r border-black"
              style={{ padding: "8px 6px" }}
            >
              Funcionário: {employeeTyped.full_name || "—"}
            </div>
            <div style={{ padding: "8px 6px" }}>Jornada de Trabalho:</div>
          </div>

          <div
            className="grid border-b border-black"
            style={{ gridTemplateColumns: "34% 24% 42%" }}
          >
            <div style={{ padding: "8px 6px" }}>
              Função: {employeeTyped.job_title || "—"}
            </div>
            <div
              className="border-r border-l border-black"
              style={{ padding: "8px 6px", textAlign: "center" }}
            >
              CTPS: {employeeTyped.ctps || "—"}
            </div>
            <div style={{ padding: "8px 6px" }}>
              {formatWorkJourney(employeeTyped)}
            </div>
          </div>

          <div className="border-b border-black" style={{ padding: "8px 6px" }}>
            Período: {`${monthName(month)} / ${year}`}
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <table
              className="w-full border-collapse"
              style={{ tableLayout: "fixed", width: "100%" }}
            >
              <colgroup>
                <col style={{ width: "5%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "34%" }} />
              </colgroup>

              <thead>
                <tr>
                  <th
                    rowSpan={2}
                    className="border-r border-b border-black text-center align-middle"
                    style={{ padding: "7px 4px", fontWeight: 400 }}
                  >
                    DIA
                  </th>
                  <th
                    rowSpan={2}
                    className="border-r border-b border-black text-center align-middle"
                    style={{ padding: "7px 4px", fontWeight: 400 }}
                  >
                    SEMANA
                  </th>
                  <th
                    rowSpan={2}
                    className="border-r border-b border-black text-center align-middle"
                    style={{ padding: "7px 4px", fontWeight: 400 }}
                  >
                    ENTRADA
                  </th>
                  <th
                    colSpan={2}
                    className="border-r border-b border-black text-center"
                    style={{ padding: "7px 4px", fontWeight: 400 }}
                  >
                    INTERVALO
                  </th>
                  <th
                    rowSpan={2}
                    className="border-r border-b border-black text-center align-middle"
                    style={{ padding: "7px 4px", fontWeight: 400 }}
                  >
                    SAÍDA
                  </th>
                  <th
                    rowSpan={2}
                    className="border-r border-b border-black text-center align-middle"
                    style={{ padding: "7px 4px", fontWeight: 400 }}
                  >
                    HORA EXTRA
                  </th>
                  <th
                    rowSpan={2}
                    className="border-b border-black text-center align-middle"
                    style={{ padding: "7px 4px", fontWeight: 400 }}
                  >
                    ASSINATURA DO EMPREGADO
                  </th>
                </tr>

                <tr>
                  <th
                    className="border-r border-b border-black text-center"
                    style={{ padding: "6px 4px", fontWeight: 400 }}
                  >
                    SAÍDA
                  </th>
                  <th
                    className="border-r border-b border-black text-center"
                    style={{ padding: "6px 4px", fontWeight: 400 }}
                  >
                    RETORNO
                  </th>
                </tr>
              </thead>

              <tbody>
                {days.map((item) => (
                  <tr key={item.day}>
                    <td
                      className="border-r border-b border-black text-center"
                      style={{ padding: "5px 4px", height: "22px" }}
                    >
                      {item.day}
                    </td>
                    <td
                      className="border-r border-b border-black"
                      style={{ padding: "5px 4px", height: "22px" }}
                    >
                      {item.weekDay}
                    </td>
                    <td
                      className="border-r border-b border-black text-center"
                      style={{ padding: "5px 4px", height: "22px" }}
                    >
                      :
                    </td>
                    <td
                      className="border-r border-b border-black text-center"
                      style={{ padding: "5px 4px", height: "22px" }}
                    >
                      :
                    </td>
                    <td
                      className="border-r border-b border-black text-center"
                      style={{ padding: "5px 4px", height: "22px" }}
                    >
                      :
                    </td>
                    <td
                      className="border-r border-b border-black text-center"
                      style={{ padding: "5px 4px", height: "22px" }}
                    >
                      :
                    </td>
                    <td
                      className="border-r border-b border-black text-center"
                      style={{ padding: "5px 4px", height: "22px" }}
                    >
                      :
                    </td>
                    <td
                      className="border-b border-black"
                      style={{ padding: "5px 4px", height: "22px" }}
                    />
                  </tr>
                ))}
              </tbody>
            </table>

            <div
              style={{
                padding: "6px 0 0 0",
                marginTop: "auto",
              }}
            >
              <div style={{ padding: "0 0 4px 0", fontWeight: 400 }}>
                OBSERVAÇÕES:
              </div>
              <div className="border-b border-black" style={{ height: "30px" }} />
              <div className="border-b border-black" style={{ height: "30px" }} />
              <div className="border-b border-black" style={{ height: "30px" }} />
              <div className="border-b border-black" style={{ height: "30px" }} />
              <div className="border-b border-black" style={{ height: "30px" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}