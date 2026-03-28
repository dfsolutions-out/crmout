import { redirect } from "next/navigation";

import { createClient } from "@/src/lib/supabase/server";
import ContrachequeForm from "@/src/components/contracheques/contracheque-form";

type CompanyMemberRow = {
  company_id: string;
};

type EmployeeRow = {
  id: string;
  full_name: string | null;
  cpf: string | null;
  job_title: string | null;
  is_active: boolean | null;
};

type PageProps = {
  searchParams?: Promise<{
    employeeId?: string;
  }>;
};

export default async function NovoContrachequePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const selectedEmployeeId = params?.employeeId ?? "";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: member, error: memberError } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single<CompanyMemberRow>();

  if (memberError || !member?.company_id) {
    redirect("/login");
  }

  const { data: employees, error: employeesError } = await supabase
    .from("employees")
    .select("id, full_name, cpf, job_title, is_active")
    .eq("company_id", member.company_id)
    .eq("is_active", true)
    .order("full_name", { ascending: true })
    .returns<EmployeeRow[]>();

  if (employeesError) {
    throw new Error("Não foi possível carregar os funcionários.");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Novo contracheque
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Preencha os valores manualmente e gere o layout para impressão.
        </p>
      </div>

      <ContrachequeForm
        employees={employees ?? []}
        initialEmployeeId={selectedEmployeeId}
      />
    </div>
  );
}