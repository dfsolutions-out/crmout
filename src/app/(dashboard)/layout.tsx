import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white p-6 hidden md:block">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">CRMOut</h2>
          <p className="text-sm text-slate-300 mt-1">Delta Serviços</p>
        </div>

        <nav className="space-y-3">
          <Link
            href="/dashboard"
            className="block rounded-lg px-3 py-2 hover:bg-slate-800 transition"
          >
            Dashboard
          </Link>

          <Link
            href="/onboarding"
            className="block rounded-lg px-3 py-2 hover:bg-slate-800 transition"
          >
            Empresa
          </Link>

          <Link
            href="/clientes"
            className="block rounded-lg px-3 py-2 hover:bg-slate-800 transition"
          >
            Clientes
          </Link>

          <Link
            href="/funcionarios"
            className="block rounded-lg px-3 py-2 hover:bg-slate-800 transition"
          >
            Funcionários
          </Link>

          <Link
            href="/produtos"
            className="block rounded-lg px-3 py-2 opacity-50"
          >
            Produtos
          </Link>
        </nav>

        <form action="/logout" method="post" className="mt-10">
          <button
            type="submit"
            className="w-full rounded-xl bg-white text-slate-900 py-3 font-medium"
          >
            Sair
          </button>
        </form>
      </aside>

      <main className="md:ml-64 p-6">{children}</main>
    </div>
  );
}
