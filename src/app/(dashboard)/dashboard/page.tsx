import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import {
  ArrowRight,
  Users,
  UserSquare2,
  AlertTriangle,
  Wallet,
  TrendingUp,
  PackageSearch,
  ShieldCheck,
  Boxes,
} from "lucide-react";

type ClienteRow = {
  id: string;
};

type EmployeeRow = {
  id: string;
  full_name: string | null;
};

type ProductRow = {
  id: string;
  name: string;
  stock: number;
  min_stock: number;
  unit: string | null;
  type: string;
};

type DeliveryEmployee = {
  id: string;
  full_name: string | null;
};

type DeliveryProduct = {
  id: string;
  name: string;
  unit: string | null;
};

type DeliveryRow = {
  id: string;
  quantity: number;
  note: string | null;
  created_at: string;
  employee: DeliveryEmployee | null;
  product: DeliveryProduct | null;
};

type RawDeliveryRow = {
  id: string;
  quantity: number;
  note: string | null;
  created_at: string;
  employee: DeliveryEmployee | DeliveryEmployee[] | null;
  product: DeliveryProduct | DeliveryProduct[] | null;
};

type FinancialEntryRow = {
  id: string;
  type: "PAGAR" | "RECEBER";
  amount: number | string;
  due_date: string;
  status: "PENDENTE" | "PAGO" | "VENCIDO";
};

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function normalizeAmount(value: number | string) {
  return typeof value === "number" ? value : Number(value || 0);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getEffectiveStatus(
  status: "PENDENTE" | "PAGO" | "VENCIDO",
  dueDate: string
): "PENDENTE" | "PAGO" | "VENCIDO" {
  if (status === "PAGO") return "PAGO";

  const today = new Date();
  const due = new Date(`${dueDate}T23:59:59`);

  if (due < today) return "VENCIDO";
  return "PENDENTE";
}

function percent(value: number, total: number) {
  if (!total || total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

export default async function DashboardPage() {
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

  if (membershipError || !membership?.company_id) {
    return (
      <div className="space-y-6">
        <div className="rounded-[28px] border border-red-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Dashboard
          </h1>

          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            Empresa não encontrada para este usuário.
          </p>
        </div>
      </div>
    );
  }

  const companyId = membership.company_id;

  const [
    clientsResult,
    employeesResult,
    productsResult,
    deliveriesResult,
    financialResult,
  ] = await Promise.all([
    supabase.from("clients").select("id").eq("company_id", companyId),

    supabase
      .from("employees")
      .select("id, full_name")
      .eq("company_id", companyId),

    supabase
      .from("products")
      .select("id, name, stock, min_stock, unit, type")
      .eq("company_id", companyId)
      .order("name", { ascending: true }),

    supabase
      .from("deliveries")
      .select(`
        id,
        quantity,
        note,
        created_at,
        employee:employees(id,full_name),
        product:products(id,name,unit)
      `)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(8),

    supabase
      .from("financial_entries")
      .select("id, type, amount, due_date, status")
      .eq("company_id", companyId),
  ]);

  const clients = (clientsResult.data ?? []) as ClienteRow[];
  const employees = (employeesResult.data ?? []) as EmployeeRow[];
  const products = (productsResult.data ?? []) as ProductRow[];
  const financialEntries = (financialResult.data ?? []) as FinancialEntryRow[];

  const rawDeliveries = (deliveriesResult.data ?? []) as RawDeliveryRow[];

  const deliveries: DeliveryRow[] = rawDeliveries.map((delivery) => ({
    id: delivery.id,
    quantity: delivery.quantity,
    note: delivery.note,
    created_at: delivery.created_at,
    employee: firstOrNull(delivery.employee),
    product: firstOrNull(delivery.product),
  }));

  const lowStockProducts = products.filter(
    (product) => Number(product.stock) <= Number(product.min_stock)
  );

  const totalClients = clients.length;
  const totalEmployees = employees.length;
  
  const totalLowStock = lowStockProducts.length;

  const enrichedFinancial = financialEntries.map((entry) => ({
    ...entry,
    amountNumber: normalizeAmount(entry.amount),
    effectiveStatus: getEffectiveStatus(entry.status, entry.due_date),
  }));

  const totalPagar = enrichedFinancial
    .filter(
      (item) => item.type === "PAGAR" && item.effectiveStatus !== "PAGO"
    )
    .reduce((acc, item) => acc + item.amountNumber, 0);

  const totalReceber = enrichedFinancial
    .filter(
      (item) => item.type === "RECEBER" && item.effectiveStatus !== "PAGO"
    )
    .reduce((acc, item) => acc + item.amountNumber, 0);

  const totalPendente = enrichedFinancial
    .filter((item) => item.effectiveStatus === "PENDENTE")
    .reduce((acc, item) => acc + item.amountNumber, 0);

  const totalVencido = enrichedFinancial
    .filter((item) => item.effectiveStatus === "VENCIDO")
    .reduce((acc, item) => acc + item.amountNumber, 0);

  const totalFinancialOpen =
    totalPagar + totalReceber + totalPendente + totalVencido;

  const productTypeMap = products.reduce<Record<string, number>>((acc, item) => {
    const key = item.type || "OUTRO";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const productTypeBars = Object.entries(productTypeMap)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const recentDeliveriesByEmployee = deliveries.reduce<Record<string, number>>(
    (acc, item) => {
      const key = item.employee?.full_name || "Sem funcionário";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {}
  );

  const deliveryBars = Object.entries(recentDeliveriesByEmployee)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const maxProductBar = Math.max(...productTypeBars.map((i) => i.value), 1);
  const maxDeliveryBar = Math.max(...deliveryBars.map((i) => i.value), 1);

  const saldoPrevisto = totalReceber - totalPagar;

  return (
    <div className="space-y-8">
      {/* TOPO */}
      <section className="rounded-[30px] border border-slate-200 bg-white px-8 py-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              <ShieldCheck className="h-4 w-4" />
              Painel operacional
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              Dashboard
            </h1>

            <p className="mt-3 text-base leading-7 text-slate-600">
              Visão geral da operação da empresa com foco em cadastros, estoque,
              entregas e financeiro.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/financeiro"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#12325F] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
            >
              Abrir financeiro
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/produtos"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Ver produtos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* KPIS PRINCIPAIS */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Clientes"
          value={String(totalClients)}
          subtitle="Base cadastrada"
          icon={<Users className="h-5 w-5" />}
          href="/clientes"
        />

        <KpiCard
          title="Funcionários"
          value={String(totalEmployees)}
          subtitle="Equipe registrada"
          icon={<UserSquare2 className="h-5 w-5" />}
          href="/funcionarios"
        />

        <KpiCard
          title="Estoque baixo"
          value={String(totalLowStock)}
          subtitle="Itens abaixo do mínimo"
          icon={<AlertTriangle className="h-5 w-5" />}
          href="/produtos"
          valueClassName={totalLowStock > 0 ? "text-red-600" : "text-slate-900"}
        />

        <KpiCard
          title="Saldo previsto"
          value={formatMoney(saldoPrevisto)}
          subtitle="Receber menos pagar"
          icon={<Wallet className="h-5 w-5" />}
          href="/financeiro"
          valueClassName={saldoPrevisto < 0 ? "text-red-600" : "text-emerald-600"}
        />
      </section>

      {/* GRAFICOS */}
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Visão financeira
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Distribuição dos valores em aberto.
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>

          <div className="space-y-5">
            <BarRow
              label="A pagar"
              value={formatMoney(totalPagar)}
              percentValue={percent(totalPagar, totalFinancialOpen)}
              fillClass="bg-red-500"
            />

            <BarRow
              label="A receber"
              value={formatMoney(totalReceber)}
              percentValue={percent(totalReceber, totalFinancialOpen)}
              fillClass="bg-emerald-500"
            />

            <BarRow
              label="Pendentes"
              value={formatMoney(totalPendente)}
              percentValue={percent(totalPendente, totalFinancialOpen)}
              fillClass="bg-amber-500"
            />

            <BarRow
              label="Vencidos"
              value={formatMoney(totalVencido)}
              percentValue={percent(totalVencido, totalFinancialOpen)}
              fillClass="bg-rose-500"
            />
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <span className="text-sm font-medium text-slate-600">
              Total financeiro aberto
            </span>
            <strong className="text-base text-slate-900">
              {formatMoney(totalFinancialOpen)}
            </strong>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Distribuição de produtos
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Quantidade de itens por tipo cadastrado.
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
              <Boxes className="h-5 w-5" />
            </div>
          </div>

          <div className="space-y-4">
            {productTypeBars.length > 0 ? (
              productTypeBars.map((item) => (
                <MiniBar
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  widthPercent={Math.max(
                    12,
                    Math.round((item.value / maxProductBar) * 100)
                  )}
                  fillClass="bg-[#12325F]"
                />
              ))
            ) : (
              <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                Nenhum produto cadastrado ainda.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* TABELAS */}
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Produtos com estoque baixo
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Itens que já atingiram ou passaram do estoque mínimo.
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <PackageSearch className="h-5 w-5" />
            </div>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-3 font-semibold">Produto</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Estoque</th>
                  <th className="px-4 py-3 font-semibold">Mínimo</th>
                </tr>
              </thead>

              <tbody>
                {lowStockProducts.length > 0 ? (
                  lowStockProducts.slice(0, 6).map((product) => (
                    <tr
                      key={product.id}
                      className="border-t border-slate-100 transition hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{product.type}</td>
                      <td className="px-4 py-3 font-semibold text-red-600">
                        {product.stock} {product.unit || "UN"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {product.min_stock} {product.unit || "UN"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Nenhum produto com estoque baixo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Entregas recentes
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Últimos registros de entrega para funcionários.
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-3 font-semibold">Data</th>
                  <th className="px-4 py-3 font-semibold">Funcionário</th>
                  <th className="px-4 py-3 font-semibold">Produto</th>
                  <th className="px-4 py-3 font-semibold">Qtd</th>
                </tr>
              </thead>

              <tbody>
                {deliveries.length > 0 ? (
                  deliveries.map((delivery) => (
                    <tr
                      key={delivery.id}
                      className="border-t border-slate-100 transition hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-3 text-slate-600">
                        {formatDateTime(delivery.created_at)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {delivery.employee?.full_name || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {delivery.product?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {delivery.quantity} {delivery.product?.unit || "UN"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Nenhuma entrega registrada ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* BLOCO EXTRA ENXUTO */}
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Entregas por funcionário
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Distribuição com base nas entregas recentes.
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-700">
              <Users className="h-5 w-5" />
            </div>
          </div>

          <div className="space-y-4">
            {deliveryBars.length > 0 ? (
              deliveryBars.map((item) => (
                <MiniBar
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  widthPercent={Math.max(
                    12,
                    Math.round((item.value / maxDeliveryBar) * 100)
                  )}
                  fillClass="bg-blue-500"
                />
              ))
            ) : (
              <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                Ainda não há entregas para exibir no gráfico.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Acessos rápidos
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Atalhos para os módulos mais usados.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <QuickLink href="/clientes" title="Clientes" />
            <QuickLink href="/funcionarios" title="Funcionários" />
            <QuickLink href="/produtos" title="Produtos" />
            <QuickLink href="/financeiro" title="Financeiro" />
          </div>
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  href,
  valueClassName,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  href: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p
            className={`mt-3 text-4xl font-semibold tracking-tight text-slate-900 ${
              valueClassName || ""
            }`}
          >
            {value}
          </p>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-700">
          {icon}
        </div>
      </div>

      <div className="mt-5">
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 transition hover:text-blue-800"
        >
          Abrir
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function BarRow({
  label,
  value,
  percentValue,
  fillClass,
}: {
  label: string;
  value: string;
  percentValue: number;
  fillClass: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-semibold text-slate-900">{value}</span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${fillClass}`}
          style={{ width: `${Math.max(percentValue, 4)}%` }}
        />
      </div>
    </div>
  );
}

function MiniBar({
  label,
  value,
  widthPercent,
  fillClass,
}: {
  label: string;
  value: number;
  widthPercent: number;
  fillClass: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="truncate text-sm font-medium text-slate-700">
          {label}
        </span>
        <span className="text-sm font-semibold text-slate-900">{value}</span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${fillClass}`}
          style={{ width: `${widthPercent}%` }}
        />
      </div>
    </div>
  );
}

function QuickLink({
  href,
  title,
}: {
  href: string;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-white"
    >
      <div className="flex items-center justify-between gap-3">
        <span>{title}</span>
        <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}