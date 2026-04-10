"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  ClipboardList,
  FileText,
  Wallet,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Truck,
} from "lucide-react";

type Props = {
  children: React.ReactNode;
};

type NavItemProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
  collapsed: boolean;
  isActive: boolean;
};

export default function DashboardSidebar({ children }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? "w-[98px]" : "w-[292px]";
  const mainMargin = collapsed ? "md:ml-[98px]" : "md:ml-[292px]";

  return (
    <div className="min-h-screen bg-[#F3F6FB]">
      <aside
        className={`fixed left-0 top-0 z-40 hidden h-screen border-r border-slate-200/50 bg-[#12325F] text-white transition-all duration-300 md:block ${sidebarWidth}`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 px-4 py-5">
            {!collapsed ? (
              <div className="relative flex flex-col items-center justify-center">
                <button
                  type="button"
                  onClick={() => setCollapsed(true)}
                  className="absolute right-0 top-0 inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-200 transition hover:bg-white/10 hover:text-white"
                  aria-label="Recolher menu"
                  title="Recolher menu"
                >
                  <PanelLeftClose size={18} />
                </button>

                <div className="flex h-36 w-36 items-center justify-center">
                  <Image
                    src="/logo-delta.png"
                    alt="Logo Delta"
                    width={160}
                    height={160}
                    className="h-32 w-32 object-contain"
                    priority
                  />
                </div>

                <p className="mt-2 text-center text-[16px] font-semibold tracking-wide text-white/80">
                  CNPJ 03.701.675/0001-56
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-white/40 overflow-hidden">
                  <Image
                    src="/logo-delta.png"
                    alt="Logo Delta"
                    width={56}
                    height={56}
                    className="h-14 w-14 object-contain"
                    priority
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setCollapsed(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-200 transition hover:bg-white/10 hover:text-white"
                  aria-label="Expandir menu"
                  title="Expandir menu"
                >
                  <PanelLeftOpen size={18} />
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <nav className="space-y-2">
              <NavItem
                href="/dashboard"
                label="Dashboard"
                icon={<LayoutDashboard size={18} />}
                collapsed={collapsed}
                isActive={pathname === "/dashboard"}
              />

              <NavItem
                href="/clientes"
                label="Clientes"
                icon={<Users size={18} />}
                collapsed={collapsed}
                isActive={pathname.startsWith("/clientes")}
              />

              <NavItem
                href="/funcionarios"
                label="Funcionários"
                icon={<Users size={18} />}
                collapsed={collapsed}
                isActive={pathname.startsWith("/funcionarios")}
              />

              <NavItem
                href="/produtos"
                label="Uniforme / EPI"
                icon={<Package size={18} />}
                collapsed={collapsed}
                isActive={pathname.startsWith("/produtos")}
              />

              <NavItem
                href="/fornecedores"
                label="Fornecedores"
                icon={<Truck size={18} />}
                collapsed={collapsed}
                isActive={pathname.startsWith("/fornecedores")}
              />

              <NavItem
                href="/folha-ponto"
                label="Folha de Ponto"
                icon={<ClipboardList size={18} />}
                collapsed={collapsed}
                isActive={pathname.startsWith("/folha-ponto")}
              />

              <NavItem
                href="/contracheques"
                label="Contracheque"
                icon={<FileText size={18} />}
                collapsed={collapsed}
                isActive={pathname.startsWith("/contracheques")}
              />

              <NavItem
                href="/financeiro"
                label="Financeiro"
                icon={<Wallet size={18} />}
                collapsed={collapsed}
                isActive={pathname.startsWith("/financeiro")}
              />
            </nav>
          </div>

          <div className="border-t border-white/10 p-4">
            <form action="/logout" method="post">
              <button
                type="submit"
                className={`flex items-center rounded-2xl bg-white/10 text-sm font-medium text-white transition hover:bg-white/15 ${
                  collapsed
                    ? "h-12 w-full justify-center"
                    : "w-full gap-3 px-4 py-3"
                }`}
                aria-label="Sair"
                title="Sair"
              >
                <LogOut size={18} />
                {!collapsed ? <span>Sair</span> : null}
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main
        className={`min-h-screen p-6 transition-all duration-300 md:p-8 ${mainMargin}`}
      >
        <div className="mx-auto max-w-[1440px]">{children}</div>
      </main>
    </div>
  );
}

function NavItem({ href, label, icon, collapsed, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`group flex items-center rounded-2xl text-[16px] font-semibold transition-all ${
        collapsed ? "justify-center px-0 py-3.5" : "gap-3 px-3.5 py-3"
      } ${
        isActive
          ? "bg-white/10 text-white"
          : "text-slate-200 hover:bg-white/10 hover:text-white"
      }`}
      title={collapsed ? label : undefined}
    >
      <span
        className={`shrink-0 ${
          isActive ? "text-white" : "text-slate-300 group-hover:text-white"
        }`}
      >
        {icon}
      </span>

      {!collapsed ? <span className="truncate">{label}</span> : null}
    </Link>
  );
}