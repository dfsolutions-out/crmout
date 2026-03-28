"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  Package,
  ClipboardList,
  FileText,
  Wallet,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

type Props = {
  children: React.ReactNode;
  companyName: string;
};

type NavItemProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
  collapsed: boolean;
  isActive: boolean;
};

export default function DashboardSidebar({ children, companyName }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? "w-[92px]" : "w-[278px]";
  const mainMargin = collapsed ? "md:ml-[92px]" : "md:ml-[278px]";

  return (
    <div className="min-h-screen bg-[#F3F6FB]">
      <aside
        className={`fixed left-0 top-0 z-40 hidden h-screen border-r border-slate-200/50 bg-[#12325F] text-white transition-all duration-300 md:block ${sidebarWidth}`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 px-4 py-4">
            {!collapsed ? (
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center">
                    <Image
                      src="/logo-delta.png"
                      alt="Logo Delta"
                      width={44}
                      height={44}
                      className="h-11 w-11 object-contain"
                      priority
                    />
                  </div>

                  <div className="min-w-0 pt-0.5">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-300">
                      Empresa
                    </p>
                    <h2 className="truncate text-[15px] font-semibold leading-tight text-white">
                      {companyName}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCollapsed(true)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-200 transition hover:bg-white/10 hover:text-white"
                  aria-label="Recolher menu"
                  title="Recolher menu"
                >
                  <PanelLeftClose size={18} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-white/40 overflow-hidden">
                  <Image
                    src="/logo-delta.png"
                    alt="Logo Delta"
                    width={44}
                    height={44}
                    className="h-11 w-11 object-contain"
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
                href="/onboarding"
                label="Empresa"
                icon={<Building2 size={18} />}
                collapsed={collapsed}
                isActive={pathname === "/onboarding"}
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
                label="Produtos"
                icon={<Package size={18} />}
                collapsed={collapsed}
                isActive={pathname.startsWith("/produtos")}
              />

              <NavItem
                href="/folha-ponto"
                label="Folha de ponto"
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
      className={`group flex items-center rounded-2xl text-sm font-medium transition-all ${
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
