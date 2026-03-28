import { createClient } from "@/src/lib/supabase/server";
import { EmployeeForm } from "@/src/components/employee-form";

type EditarFuncionarioPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditarFuncionarioPage({
  params,
}: EditarFuncionarioPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="rounded-[28px] border border-red-200 bg-white p-8 shadow-sm">
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          Usuário não autenticado.
        </p>
      </div>
    );
  }

  const { data: membership, error: membershipError } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (membershipError || !membership) {
    return (
      <div className="rounded-[28px] border border-red-200 bg-white p-8 shadow-sm">
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          Empresa não encontrada para este usuário.
        </p>
      </div>
    );
  }

  const { data: funcionario, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .eq("company_id", membership.company_id)
    .single();

  if (error || !funcionario) {
    return (
      <div className="rounded-[28px] border border-red-200 bg-white p-8 shadow-sm">
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          Não foi possível carregar o funcionário.
        </p>
      </div>
    );
  }

  const { data: notes } = await supabase
    .from("employee_notes")
    .select("id, note_text, created_at")
    .eq("employee_id", id)
    .eq("company_id", membership.company_id)
    .order("created_at", { ascending: false });

  const { data: documents } = await supabase
    .from("employee_documents")
    .select("id, file_name, file_path, mime_type, file_size_bytes, created_at")
    .eq("employee_id", id)
    .eq("company_id", membership.company_id)
    .order("created_at", { ascending: false });

  return (
    <EmployeeForm
      mode="edit"
      initialEmployee={funcionario}
      initialNotes={notes || []}
      initialDocuments={documents || []}
    />
  );
}