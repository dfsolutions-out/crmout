import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";

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

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
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
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <div className="bg-white border rounded-2xl p-6">
          <p className="text-red-600">
            Empresa não encontrada para este usuário.
          </p>
        </div>
      </div>
    );
  }

  const companyId = membership.company_id;

  const [clientsResult, employeesResult, productsResult, deliveriesResult] =
    await Promise.all([
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
        .limit(10),
    ]);

  const clients = (clientsResult.data ?? []) as ClienteRow[];
  const employees = (employeesResult.data ?? []) as EmployeeRow[];
  const products = (productsResult.data ?? []) as ProductRow[];

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
    (product) => product.stock <= product.min_stock
  );

  const totalClients = clients.length;
  const totalEmployees = employees.length;
  const totalProducts = products.length;
  const totalLowStock = lowStockProducts.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-slate-600">
            Visão geral da operação da empresa.
          </p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white border rounded-2xl p-5">
          <p className="text-sm text-slate-500">Clientes</p>
          <p className="mt-2 text-3xl font-bold">{totalClients}</p>
          <div className="mt-4">
            <Link
              href="/clientes"
              className="text-sm text-blue-600 hover:underline"
            >
              Ver clientes
            </Link>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <p className="text-sm text-slate-500">Funcionários</p>
          <p className="mt-2 text-3xl font-bold">{totalEmployees}</p>
          <div className="mt-4">
            <Link
              href="/funcionarios"
              className="text-sm text-blue-600 hover:underline"
            >
              Ver funcionários
            </Link>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <p className="text-sm text-slate-500">Produtos</p>
          <p className="mt-2 text-3xl font-bold">{totalProducts}</p>
          <div className="mt-4">
            <Link
              href="/produtos"
              className="text-sm text-blue-600 hover:underline"
            >
              Ver produtos
            </Link>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <p className="text-sm text-slate-500">Estoque baixo</p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {totalLowStock}
          </p>
          <div className="mt-4">
            <Link
              href="/produtos"
              className="text-sm text-blue-600 hover:underline"
            >
              Ver itens
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="bg-white border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Produtos com estoque baixo</h2>
            <p className="text-sm text-slate-500">
              Itens que já atingiram ou passaram do estoque mínimo.
            </p>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Estoque</th>
                  <th className="px-4 py-3">Mínimo</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.length > 0 ? (
                  lowStockProducts.map((product) => (
                    <tr key={product.id} className="border-t">
                      <td className="px-4 py-3 font-medium">{product.name}</td>
                      <td className="px-4 py-3">{product.type}</td>
                      <td className="px-4 py-3 text-red-600">
                        {product.stock} {product.unit || "UN"}
                      </td>
                      <td className="px-4 py-3">
                        {product.min_stock} {product.unit || "UN"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/produtos/${product.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          Abrir
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                      Nenhum produto com estoque baixo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Entregas recentes</h2>
            <p className="text-sm text-slate-500">
              Últimas entregas registradas para funcionários.
            </p>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Funcionário</th>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Qtd</th>
                  <th className="px-4 py-3">Obs</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.length > 0 ? (
                  deliveries.map((delivery) => (
                    <tr key={delivery.id} className="border-t">
                      <td className="px-4 py-3">
                        {new Date(delivery.created_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        {delivery.employee?.full_name || "-"}
                      </td>
                      <td className="px-4 py-3">
                        {delivery.product?.name || "-"}
                      </td>
                      <td className="px-4 py-3">
                        {delivery.quantity} {delivery.product?.unit || "UN"}
                      </td>
                      <td className="px-4 py-3">{delivery.note || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                      Nenhuma entrega registrada ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link
          href="/funcionarios"
          className="bg-white border rounded-2xl p-5 hover:bg-slate-50 transition"
        >
          <h3 className="font-semibold text-lg">Funcionários</h3>
          <p className="mt-2 text-sm text-slate-600">
            Gerencie cadastros, entregas e histórico.
          </p>
        </Link>

        <Link
          href="/produtos"
          className="bg-white border rounded-2xl p-5 hover:bg-slate-50 transition"
        >
          <h3 className="font-semibold text-lg">Produtos</h3>
          <p className="mt-2 text-sm text-slate-600">
            Controle estoque, entradas, saídas e itens com estoque baixo.
          </p>
        </Link>

        <Link
          href="/clientes"
          className="bg-white border rounded-2xl p-5 hover:bg-slate-50 transition"
        >
          <h3 className="font-semibold text-lg">Clientes</h3>
          <p className="mt-2 text-sm text-slate-600">
            Acesse rapidamente a base de clientes cadastrados.
          </p>
        </Link>
      </section>
    </div>
  );
}